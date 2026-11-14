using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Api.Functions;
using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Identity;
using Vacate.Application.Memberships;
using Vacate.Application.Organizations;
using Vacate.Application.Users;
using Vacate.Infrastructure;

namespace Vacate.IntegrationTests;

public sealed class ResourceEndpointTests
{
    private ServiceProvider provider = null!;
    private IUserRepository users = null!;
    private IMembershipRepository memberships = null!;
    private const string Company = "20000000-0000-4000-8000-000000000100";

    private static string GuidFor(int value) => $"20000000-0000-4000-8000-{value:000000000000}";

    [SetUp]
    public void Setup() => Configure(true);

    private void Configure(bool developmentAuthentication, TimeProvider? clock = null, ISessionStore? sessionStore = null)
    {
        provider?.Dispose();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["DevelopmentAuthentication:Enabled"] = developmentAuthentication.ToString(),
            ["SeedData:Enabled"] = "true"
        }).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddInMemoryPersistence();
        if (clock is not null)
        {
            services.AddSingleton(clock);
        }

        if (sessionStore is not null)
        {
            services.AddSingleton(sessionStore);
        }

        services.AddSingleton<RecordMapper>();
        services.AddSingleton<AccessPolicy>();
        services.AddSingleton<UserService>();
        services.AddSingleton<MembershipService>();
        services.AddSingleton<OrganizationService>();
        services.AddSingleton<AuthenticationService>();
        services.AddSingleton<UserFunctions>();
        services.AddSingleton<OrganizationFunctions>();
        services.AddSingleton<SessionFunctions>();
        provider = services.BuildServiceProvider();
        users = provider.GetRequiredService<IUserRepository>();
        memberships = provider.GetRequiredService<IMembershipRepository>();
    }

    [TearDown]
    public void TearDown() => provider.Dispose();

    private async Task<(int Status, JsonNode? Json)> Call(string method, string path, string? token = null, object? body = null)
    {
        var request = new DefaultHttpContext().Request;
        request.Method = method;
        request.ContentType = "application/json";
        request.Headers.Authorization = token is null ? "" : $"Bearer {token}";
        request.Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(body ?? new
        {
        })));
        var matches = HttpFunctions()
            .Select(function => (function.Target, function.Method, function.Route, function.Methods, Match: MatchRoute(function.Route, path)))
            .Where(function => function.Match.Success && function.Methods.Contains(method, StringComparer.OrdinalIgnoreCase))
            .ToArray();
        Assert.That(matches, Has.Length.EqualTo(1), $"{method} {path} should match exactly one HTTP function.");
        var match = matches[0];
        var arguments = match.Method.GetParameters().Select(parameter =>
        {
            if (parameter.ParameterType == typeof(HttpRequest))
            {
                return (object)request;
            }

            var value = match.Match.Groups[parameter.Name!].Value;
            return Uri.UnescapeDataString(value);
        }).ToArray();
        var result = await (Task<IActionResult>)match.Method.Invoke(match.Target, arguments)!;
        return result switch
        {
            ObjectResult obj => (obj.StatusCode ?? 200, obj.Value is JsonNode node ? node.DeepClone() : JsonSerializer.SerializeToNode(obj.Value)),
            StatusCodeResult status => (status.StatusCode, null),
            _ => throw new InvalidOperationException("Unexpected result")
        };
    }

    private IEnumerable<(object Target, MethodInfo Method, string Route, string[] Methods)> HttpFunctions()
    {
        foreach (var target in new object[]
        {
            provider.GetRequiredService<SessionFunctions>(),
            provider.GetRequiredService<UserFunctions>(),
            provider.GetRequiredService<OrganizationFunctions>()
        })
        {
            foreach (var method in target.GetType().GetMethods())
            {
                var trigger = method.GetParameters()
                    .SelectMany(parameter => parameter.GetCustomAttributes())
                    .SingleOrDefault(attribute => attribute.GetType().Name == "HttpTriggerAttribute");
                if (trigger is null)
                {
                    continue;
                }

                var triggerType = trigger.GetType();
                var route = (string?)triggerType.GetProperty("Route")?.GetValue(trigger)
                    ?? throw new InvalidOperationException($"{method.Name} has no HTTP route.");
                var methods = ((IEnumerable<string>?)triggerType.GetProperty("Methods")?.GetValue(trigger))?.ToArray()
                    ?? throw new InvalidOperationException($"{method.Name} has no HTTP method.");
                yield return (target, method, route, methods);
            }
        }
    }

    private static Match MatchRoute(string route, string path)
    {
        var segments = route.Split('/');
        var pattern = "^" + string.Join("/", segments.Select(segment =>
            segment.StartsWith('{') && segment.EndsWith('}')
                ? $"(?<{segment[1..^1]}>[^/]+)"
                : Regex.Escape(segment))) + "$";
        return Regex.Match(path, pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    [Test]
    public void resource_functions_declare_one_method_per_explicit_route()
    {
        var functions = HttpFunctions().ToArray();
        var routeMethods = functions.SelectMany(function =>
            function.Methods.Select(method => $"{method.ToUpperInvariant()} {function.Route}")).ToArray();

        Assert.Multiple(() =>
        {
            Assert.That(functions, Has.Length.EqualTo(37));
            Assert.That(functions.All(function => function.Methods.Length == 1), Is.True);
            Assert.That(functions.Any(function => function.Route.Contains('*')), Is.False);
            Assert.That(routeMethods, Has.Length.EqualTo(routeMethods.Distinct(StringComparer.OrdinalIgnoreCase).Count()));
        });
    }

    [Test]
    public async Task Session_has_thirty_minute_absolute_expiry_and_authenticated_activity_does_not_extend_it()
    {
        var clock = new SessionClock(new(2026, 11, 13, 12, 0, 0, TimeSpan.Zero));
        Configure(true, clock);
        var issued = clock.GetUtcNow();
        var response = await Call("POST", "auth/sessions", body: new { username = "maya", password = "maya" });
        Assert.That(response.Status, Is.EqualTo(200));
        Assert.That(DateTimeOffset.Parse(response.Json!["expiresAt"]!.ToString()), Is.EqualTo(issued.AddMinutes(30)));
        var token = response.Json["accessToken"]!.ToString();
        clock.Advance(TimeSpan.FromMinutes(15));
        Assert.That((await Call("GET", "auth/sessions/current", token)).Status, Is.EqualTo(200));
        clock.Advance(TimeSpan.FromMinutes(15) - TimeSpan.FromTicks(1));
        Assert.That((await Call("GET", "auth/sessions/current", token)).Status, Is.EqualTo(200));
        clock.Advance(TimeSpan.FromTicks(1));
        Assert.That((await Call("GET", "auth/sessions/current", token)).Status, Is.EqualTo(401));
        Assert.That((await Call("GET", $"organizations/{Company}", token)).Status, Is.EqualTo(401));
    }

    [Test]
    public async Task Sessions_have_independent_issue_times_and_signout_revokes_only_the_selected_token()
    {
        var clock = new SessionClock(new(2026, 11, 13, 12, 0, 0, TimeSpan.Zero));
        Configure(true, clock);
        var first = await Login("maya");
        clock.Advance(TimeSpan.FromMinutes(5));
        var second = await Login("maya");
        Assert.That((await Call("GET", "auth/sessions/current", first)).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", "auth/sessions/current", first)).Status, Is.EqualTo(204));
        Assert.That((await Call("GET", "auth/sessions/current", first)).Status, Is.EqualTo(401));
        Assert.That((await Call("GET", "auth/sessions/current", second)).Status, Is.EqualTo(200));
        clock.Advance(TimeSpan.FromMinutes(25));
        Assert.That((await Call("GET", "auth/sessions/current", second)).Status, Is.EqualTo(200));
        clock.Advance(TimeSpan.FromMinutes(5));
        Assert.That((await Call("GET", "auth/sessions/current", second)).Status, Is.EqualTo(401));
    }

    [Test]
    public async Task Account_disabling_revokes_unexpired_sessions_without_giving_employee_admin_authority()
    {
        var clock = new SessionClock(new(2026, 11, 13, 12, 0, 0, TimeSpan.Zero));
        Configure(true, clock);
        var employee = await Login("maya");
        var anotherEmployeeSession = await Login("maya");
        var admin = await Login("nora");
        var path = $"users/{GuidFor(4)}/account";
        clock.Advance(TimeSpan.FromMinutes(10));
        Assert.That((await Call("PATCH", path, employee, new { status = "disabled" })).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", "auth/sessions/current", employee)).Status, Is.EqualTo(200));
        Assert.That((await Call("PATCH", path, admin, new { status = "disabled" })).Status, Is.EqualTo(200));
        Assert.That((await Call("GET", "auth/sessions/current", employee)).Status, Is.EqualTo(401));
        Assert.That((await Call("GET", "auth/sessions/current", anotherEmployeeSession)).Status, Is.EqualTo(401));
        Assert.That((await Call("PATCH", path, admin, new { status = "active" })).Status, Is.EqualTo(200));
        Assert.That((await Call("GET", "auth/sessions/current", employee)).Status, Is.EqualTo(401));
        Assert.That((await Call("GET", "auth/sessions/current", admin)).Status, Is.EqualTo(200));
    }

    [Test]
    public void Session_storage_failure_is_not_reported_as_invalid_credentials_or_an_expired_ticket()
    {
        Configure(true, sessionStore: new FailingSessionStore());
        var error = Assert.ThrowsAsync<IOException>(async () => await Call("GET", "auth/sessions/current", "synthetic-ticket"));
        Assert.That(error!.Message, Is.EqualTo("Synthetic session storage unavailable."));
    }

    private sealed class FailingSessionStore : ISessionStore
    {
        public SessionTicket Issue(int userId, DateTimeOffset expiresAt) => throw new IOException("Synthetic session storage unavailable.");

        public int? Resolve(string token, DateTimeOffset now) => throw new IOException("Synthetic session storage unavailable.");

        public void Revoke(string token) => throw new IOException("Synthetic session storage unavailable.");

        public void RevokeForUser(int userId) => throw new IOException("Synthetic session storage unavailable.");
    }

    private sealed class SessionClock(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset current = now;

        public override DateTimeOffset GetUtcNow() => current;

        public void Advance(TimeSpan elapsed) => current += elapsed;
    }

    private async Task<string> Login(string id)
    {
        var result = await Call("POST", "auth/sessions", body: new
        {
            username = id,
            password = id
        });
        Assert.That(result.Status, Is.EqualTo(200));
        return result.Json!["accessToken"]!.ToString();
    }

    [Test]
    public async Task settings_permissions_are_scoped_by_membership_not_presentation_title()
    {
        foreach (var (alias, departments, teams) in new[] { ("maya", 0, 0), ("leah", 0, 1), ("ella", 1, 2), ("nora", 2, 4), ("daria", 2, 4) })
        {
            var token = await Login(alias);
            var result = await Call("GET", $"organizations/{Company}/summary", token);
            var access = result.Json!["settingsAccess"]!;
            Assert.That(access["departments"]!.AsArray(), Has.Count.EqualTo(departments));
            Assert.That(access["teams"]!.AsArray(), Has.Count.EqualTo(teams));
            Assert.That((await Call("GET", $"organizations/{GuidFor(999)}/summary", token)).Status, Is.EqualTo(404));
        }
        var lead = await Login("leah");
        Assert.That((await Call("GET", $"organizations/{Company}", lead)).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", $"organizations/{Company}/teams/{GuidFor(401)}", lead)).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", $"organizations/{Company}/teams/{GuidFor(400)}", lead, new { name = "Not authorized" })).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", $"organizations/{Company}/teams/{GuidFor(401)}", lead, new { requireVacationApproval = false })).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", $"organizations/{Company}/departments/{GuidFor(300)}", lead, new { requireVacationApproval = false })).Status, Is.EqualTo(404));
        var departmentLead = await Login("ella");
        Assert.That((await Call("PATCH", $"organizations/{Company}/teams/{GuidFor(400)}", departmentLead, new { requireVacationApproval = false })).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", $"organizations/{Company}/teams/{GuidFor(403)}", departmentLead, new { requireVacationApproval = false })).Status, Is.EqualTo(200));
        var employee = await Login("maya");
        Assert.That((await Call("GET", $"organizations/{Company}/teams/{GuidFor(400)}", employee)).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", $"organizations/{Company}/teams/{GuidFor(400)}", employee, new { requireVacationApproval = false })).Status, Is.EqualTo(404));
        var admin = await Login("nora");
        Assert.That((await Call("PATCH", $"organizations/{Company}/memberships/{GuidFor(4)}", admin, new { settingsRole = "Owner" })).Status, Is.EqualTo(400));
        var foreign = (await Call("POST", "organizations", admin, new { name = "Foreign settings", workWeekDays = 5 })).Json!["guid"]!.ToString();
        var foreignTeam = (await Call("POST", $"organizations/{foreign}/teams", admin, new { name = "Foreign team" })).Json!["guid"]!.ToString();
        foreach (var token in new[] { lead, departmentLead, employee })
        {
            Assert.That((await Call("GET", $"organizations/{foreign}/teams/{foreignTeam}", token)).Status, Is.EqualTo(404));
            Assert.That((await Call("PATCH", $"organizations/{foreign}/teams/{foreignTeam}", token, new { requireVacationApproval = false })).Status, Is.EqualTo(404));
        }
    }

    [Test]
    public async Task vacation_approval_overrides_inherit_and_delegation_revocation_is_immediate()
    {
        var admin = await Login("nora");
        var lead = await Login("leah");
        var path = $"organizations/{Company}";
        async Task<bool> Required() => (await Call("GET", path + "/summary", lead)).Json!["settingsAccess"]!["effectiveVacationApproval"]!.GetValue<bool>();
        Assert.That(await Required(), Is.True);
        Assert.That((await Call("PATCH", path + $"/departments/{GuidFor(300)}", admin, new { requireVacationApproval = false })).Status, Is.EqualTo(200));
        Assert.That(await Required(), Is.False);
        var before = (await Call("GET", path + $"/teams/{GuidFor(400)}", lead)).Json!;
        var changed = await Call("PATCH", path + $"/teams/{GuidFor(400)}", lead, new { requireVacationApproval = true });
        Assert.That(changed.Status, Is.EqualTo(200));
        Assert.That(changed.Json!["createdAt"]!.ToString(), Is.EqualTo(before["createdAt"]!.ToString()));
        Assert.That(DateTimeOffset.Parse(changed.Json["updatedAt"]!.ToString()), Is.GreaterThanOrEqualTo(DateTimeOffset.Parse(before["updatedAt"]!.ToString())));
        Assert.That(await Required(), Is.True);
        Assert.That((await Call("PATCH", path + $"/teams/{GuidFor(400)}", lead, new { requireVacationApproval = (bool?)null })).Status, Is.EqualTo(200));
        Assert.That(await Required(), Is.False);
        await Call("PATCH", path, admin, new { requireVacationApproval = false });
        await Call("PATCH", path + $"/departments/{GuidFor(300)}", admin, new { requireVacationApproval = (bool?)null });
        Assert.That(await Required(), Is.False);
        await Call("PATCH", path, admin, new { teamLeadSettingsEnabled = false, departmentLeadSettingsEnabled = false });
        Assert.That((await Call("PATCH", path + $"/teams/{GuidFor(400)}", lead, new { requireVacationApproval = true })).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", path + "/summary", lead)).Json!["settingsAccess"]!["teams"]!.AsArray(), Is.Empty);
        var departmentLead = await Login("ella");
        Assert.That((await Call("GET", path + "/summary", departmentLead)).Json!["settingsAccess"]!["departments"]!.AsArray(), Is.Empty);
        Assert.That((await Call("PATCH", path + $"/departments/{GuidFor(301)}", departmentLead, new { requireVacationApproval = true })).Status, Is.EqualTo(404));
        var employee = await Login("maya");
        Assert.That((await Call("PATCH", path, employee, new { teamLeadSettingsEnabled = true })).Status, Is.EqualTo(404));
    }

    [Test]
    public async Task carryover_is_validated_configuration_only_and_cannot_change_balances()
    {
        var admin = await Login("nora");
        var path = $"organizations/{Company}";
        var balance = (await Call("GET", path + $"/memberships/{GuidFor(4)}", admin)).Json!["membership"]!["balance"]!.ToJsonString();
        foreach (var years in new[] { 0, 2 })
        {
            var result = await Call("PATCH", path, admin, new { carryoverEnabled = true, carryoverYears = years });
            Assert.That(result.Status, Is.EqualTo(200));
            Assert.That(result.Json!["settings"]!["carryoverYears"]!.GetValue<int>(), Is.EqualTo(years));
            Assert.That((await Call("GET", path + $"/memberships/{GuidFor(4)}", admin)).Json!["membership"]!["balance"]!.ToJsonString(), Is.EqualTo(balance));
        }
        foreach (var body in new object[] { new { carryoverYears = -1 }, new { carryoverYears = 1.5 }, new { carryoverEnabled = (bool?)null }, new { requireVacationApproval = (bool?)null } })
        {
            Assert.That((await Call("PATCH", path, admin, body)).Status, Is.EqualTo(400));
        }
        Assert.That((await Call("GET", path, admin)).Json!["settings"]!["carryoverYears"]!.GetValue<int>(), Is.EqualTo(2));
        var employee = await Login("maya");
        Assert.That((await Call("PATCH", path, employee, new { carryoverEnabled = true })).Status, Is.EqualTo(404));
    }

    [Test]
    public async Task all_seed_accounts_and_aliases_authenticate_but_local_person_headers_do_not()
    {
        foreach (var alias in new[] { "leah", "ravi", "noah", "maya", "theo", "iris", "ella", "owen", "zoe", "daria", "nora", "sam", "user", "admin" })
        {
            var token = await Login(alias);
            var result = await Call("GET", "auth/sessions/current", token);
            Assert.That(result.Status, Is.EqualTo(200));
            Assert.That(DateTimeOffset.Parse(result.Json!["profile"]!["createdAt"]!.ToString()).Offset, Is.EqualTo(TimeSpan.Zero));
        }
        Assert.That((await Call("GET", "auth/sessions/current", "maya")).Status, Is.EqualTo(401));
        Assert.That((await Call("POST", "auth/sessions", body: new
        {
            username = "user",
            password = "admin"
        })).Status, Is.EqualTo(401));
    }

    [Test]
    public async Task development_sign_in_is_disabled_by_default()
    {
        Configure(false);
        Assert.That((await Call("POST", "auth/sessions", body: new { username = "maya", password = "maya" })).Status, Is.EqualTo(404));
    }

    [Test]
    public async Task numeric_keys_are_not_accepted_as_public_resource_identifiers()
    {
        var token = await Login("nora");
        foreach (var path in new[] { "users/4", "organizations/1", $"organizations/{Company}/departments/1", $"organizations/{Company}/teams/1", $"organizations/{Company}/memberships/4" })
        {
            Assert.That((await Call("GET", path, token)).Status, Is.EqualTo(404), path);
        }

        var user = (await Call("GET", $"users/{GuidFor(11)}", token)).Json!;
        Assert.That(user["id"]!.GetValue<int>(), Is.EqualTo(11));
        Assert.That(user["guid"]!.ToString(), Is.EqualTo(GuidFor(11)));
        var org = (await Call("GET", $"organizations/{Company}", token)).Json!;
        Assert.That(org["id"]!.GetValue<int>(), Is.EqualTo(1));
        Assert.That(org["guid"]!.ToString(), Is.EqualTo(Company));
    }

    [Test]
    public async Task own_profile_patch_is_atomic_server_stamped_and_survives_new_sessions()
    {
        var token = await Login("maya");
        var id = GuidFor(4);
        var initial = (await Call("GET", $"users/{id}", token)).Json!;
        Assert.That((await Call("PATCH", $"users/{id}", token, new
        {
            firstName = "Lost",
            married = true,
            soleCare = true
        })).Status, Is.EqualTo(400));
        Assert.That((await Call("PATCH", $"users/{id}", token, new
        {
            dependentChildren = 1.5
        })).Status, Is.EqualTo(400));
        Assert.That((await Call("PATCH", $"users/{id}", token, new
        {
            status = "disabled"
        })).Status, Is.EqualTo(400));
        Assert.That((await Call("PATCH", $"users/{id}", token, new
        {
            createdAt = "2020-01-01T00:00:00Z"
        })).Status, Is.EqualTo(400));
        var edited = await Call("PATCH", $"users/{id}", token, new
        {
            firstName = "  Edited  ",
            middleName = " ",
            married = false,
            dependentChildren = 0,
            soleCare = false
        });
        Assert.Multiple(() =>
        {
            Assert.That(edited.Status, Is.EqualTo(200));
            Assert.That(edited.Json!["firstName"]!.ToString(), Is.EqualTo("Edited"));
            Assert.That(edited.Json!["middleName"], Is.Null);
            Assert.That(edited.Json!["createdAt"]!.ToString(), Is.EqualTo(initial["createdAt"]!.ToString()));
            Assert.That(DateTimeOffset.Parse(edited.Json!["updatedAt"]!.ToString()), Is.GreaterThan(DateTimeOffset.Parse(initial["updatedAt"]!.ToString())));
        });
        await Call("DELETE", "auth/sessions/current", token);
        Assert.That((await Call("GET", "auth/sessions/current", token)).Status, Is.EqualTo(401));
        Assert.That((await Call("GET", $"users/{id}", await Login("maya"))).Json!["firstName"]!.ToString(), Is.EqualTo("Edited"));
    }

    [Test]
    public async Task colleague_and_admin_views_omit_family_and_private_account_fields()
    {
        foreach (var alias in new[] { "nora", "ravi" })
        {
            var token = await Login(alias);
            var result = await Call("GET", $"users/{GuidFor(4)}", token);
            var expected = new[] { "username", "email", "firstName", "middleName", "lastName", "gender", "jobTitle", "systemRole", "guid", "departmentId", "departmentName", "teamId", "teamName" };
            Assert.That(result.Json!.AsObject().Select(x => x.Key), Is.EquivalentTo(expected));
            Assert.That(result.Json["guid"]!.ToString(), Is.EqualTo(GuidFor(4)));
            Assert.That(result.Json["teamId"]!.ToString(), Is.EqualTo(GuidFor(401)));
            Assert.That(result.Json["teamName"]!.ToString(), Is.Not.Empty);
            Assert.That(result.Json["departmentName"]!.ToString(), Is.Not.Empty);
            Assert.That((await Call("PATCH", $"users/{GuidFor(4)}", token, new
            {
                firstName = "Other"
            })).Status, Is.EqualTo(403));
        }
        var employee = await Login("maya");
        Assert.That((await Call("GET", $"organizations/{Company}", employee)).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", $"organizations/{Company}/memberships", employee)).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", $"organizations/{Company}/memberships/{GuidFor(4)}", employee, new
        {
            priorService = 30
        })).Status, Is.EqualTo(404));
        var admin = await Login("nora");
        Assert.That((await Call("GET", $"organizations/{Company}/memberships", admin)).Json!.ToJsonString(), Does.Not.Contain("soleCare").And.Not.Contain("dependentChildren"));
    }

    [Test]
    public async Task own_team_summary_includes_actor_follows_reassignment_and_omits_private_fields()
    {
        var employee = await Login("maya");
        var admin = await Login("nora");
        var path = $"organizations/{Company}/summary";
        var members = (await Call("GET", path, employee)).Json!["teamMembers"]!.AsArray();
        Assert.That(members.Select(member => member!["username"]!.ToString()),
            Is.EquivalentTo(new[] { "maya@example.invalid", "theo@example.invalid", "iris@example.invalid" }));
        foreach (var member in members)
        {
            Assert.That(member!.AsObject().Select(field => field.Key), Is.EquivalentTo(new[]
            {
                "username", "email", "firstName", "middleName", "lastName", "gender", "jobTitle", "systemRole", "guid", "departmentId", "departmentName", "teamId", "teamName"
            }));
        }

        Assert.That((await Call("PATCH", $"organizations/{Company}/memberships/{GuidFor(4)}", admin,
            new { teamId = GuidFor(400) })).Status, Is.EqualTo(200));
        var reassigned = (await Call("GET", path, employee)).Json!["teamMembers"]!.AsArray();
        Assert.That(reassigned.Select(member => member!["username"]!.ToString()),
            Is.EquivalentTo(new[] { "maya@example.invalid", "leah@example.invalid", "ravi@example.invalid", "noah@example.invalid" }));
        Assert.That((await Call("PATCH", $"organizations/{Company}/memberships/{GuidFor(4)}", admin,
            new { teamId = (string?)null })).Status, Is.EqualTo(200));
        Assert.That((await Call("GET", path, employee)).Json!["teamMembers"]!.AsArray(), Is.Empty);
        Assert.That((await Call("GET", path)).Status, Is.EqualTo(401));
        var foreign = (await Call("POST", "organizations", admin, new { name = "Other company" })).Json!["guid"]!.ToString();
        Assert.That((await Call("GET", $"organizations/{foreign}/summary", employee)).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", $"organizations/{foreign}/memberships", await Login("daria"))).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", $"organizations/{Company}/memberships", employee)).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", $"organizations/{Company}/memberships", await Login("leah"))).Status, Is.EqualTo(404));
    }

    [Test]
    public async Task memberships_validate_references_dates_balances_and_admin_scope()
    {
        var token = await Login("nora");
        var path = $"organizations/{Company}/memberships/{GuidFor(4)}";
        foreach (var patch in new object[] { new { priorService = -1 }, new { teamId = Guid.NewGuid() }, new { managerUserId = 999 }, new { jobRoleId = Guid.NewGuid() }, new { workScheduleId = Guid.NewGuid() }, new { hireDate = "2026-12-01", employmentEndDate = "2026-01-01" }, new { balance = new { used = 0 } }, new { customAllocation = -1 }, new { companyId = Guid.NewGuid() } })
        {
            Assert.That((await Call("PATCH", path, token, patch)).Status, Is.EqualTo(400));
        }

        var result = await Call("PATCH", path, token, new
        {
            priorService = 3.5,
            hireDate = "2024-01-01",
            customAllocation = 27
        });
        Assert.That(result.Status, Is.EqualTo(200));
        Assert.That(result.Json!["membership"]!["priorService"]!.GetValue<double>(), Is.EqualTo(3.5));
        Assert.That(result.Json!["membership"]!["balance"]!["allocation"], Is.Null);
    }

    [Test]
    public async Task accounts_and_memberships_have_api_only_creation_and_soft_delete_lifecycles()
    {
        var token = await Login("nora");
        var created = await Call("POST", "users", token, new
        {
            username = "new@example.invalid",
            firstName = "New",
            lastName = "Example"
        });
        Assert.That(created.Status, Is.EqualTo(201));
        var id = created.Json!["guid"]!.ToString();
        var p = users.FindByGuid(Guid.Parse(id))!;
        Assert.Multiple(() =>
        {
            Assert.That(p.Family.Married, Is.False);
            Assert.That(p.Family.DependentChildren, Is.Zero);
            Assert.That(p.Family.SoleCare, Is.False);
            Assert.That(memberships.Current(p.Id), Is.Null);
        });
        var path = $"organizations/{Company}/memberships/{id}";
        Assert.That((await Call("POST", path, token, new
        {
            systemRoleId = GuidFor(102),
            jobRoleId = GuidFor(200)
        })).Status, Is.EqualTo(201));
        Assert.That((await Call("POST", path, token, new
        {
            systemRoleId = GuidFor(102),
            jobRoleId = GuidFor(200)
        })).Status, Is.EqualTo(409));
        Assert.That((await Call("POST", path + "/deletion-request", token)).Json!["membership"]!["deletedAt"], Is.Null);
        Assert.That((await Call("DELETE", path, token)).Status, Is.EqualTo(204));
        Assert.That((await Call("GET", path, token)).Status, Is.EqualTo(404));
        Assert.That((await Call("POST", path, token, new
        {
            systemRoleId = GuidFor(102),
            jobRoleId = GuidFor(200)
        })).Status, Is.EqualTo(201));
        Assert.That(memberships.History(users.FindByGuid(Guid.Parse(id))!.Id), Has.Count.EqualTo(2));
        Assert.That((await Call("POST", $"users/{id}/deletion-request", token)).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", $"users/{id}", token)).Status, Is.EqualTo(204));
        Assert.That((await Call("GET", $"users/{id}", token)).Status, Is.EqualTo(404));
        Assert.That(users.FindByGuid(Guid.Parse(id))!.DeletedAt, Is.Not.Null);
        Assert.That((await Call("POST", "users", token, new
        {
            username = "new@example.invalid",
            firstName = "New",
            lastName = "Example"
        })).Status, Is.EqualTo(409));
    }

    [Test]
    public async Task removed_membership_revokes_company_access_and_last_admin_cannot_be_removed()
    {
        var admin = await Login("nora");
        var employee = await Login("maya");
        Assert.That((await Call("DELETE", $"organizations/{Company}/memberships/{GuidFor(4)}", admin)).Status, Is.EqualTo(204));
        Assert.That((await Call("GET", $"organizations/{Company}/summary", employee)).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", "auth/sessions/current", employee)).Json!["profile"]!["membership"], Is.Null);
        Assert.That((await Call("DELETE", $"users/{GuidFor(10)}", admin)).Status, Is.EqualTo(204));
        Assert.That((await Call("DELETE", $"users/{GuidFor(11)}", admin)).Status, Is.EqualTo(409));
    }

    [Test]
    public async Task admin_account_updates_revoke_access_and_keep_private_facts_out_of_responses()
    {
        var admin = await Login("nora");
        var user = await Login("maya");
        var path = $"users/{GuidFor(4)}/account";
        Assert.That((await Call("PATCH", path, user, new
        {
            status = "disabled"
        })).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", path, admin, new
        {
            username = "nora@example.invalid"
        })).Status, Is.EqualTo(409));
        var result = await Call("PATCH", path, admin, new
        {
            status = "disabled"
        });
        Assert.That(result.Status, Is.EqualTo(200));
        Assert.That(result.Json!.ToJsonString(), Does.Not.Contain("soleCare"));
        Assert.That((await Call("PATCH", $"users/{GuidFor(10)}/account", admin, new
        {
            status = "disabled"
        })).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", $"users/{GuidFor(10)}", admin)).Status, Is.EqualTo(204), "Removing an already disabled admin cannot remove the remaining active admin.");
        Assert.That((await Call("GET", "auth/sessions/current", user)).Status, Is.EqualTo(401));
        Assert.That((await Call("POST", "auth/sessions", body: new
        {
            username = "maya",
            password = "maya"
        })).Status, Is.EqualTo(401));
        Assert.That((await Call("PATCH", path, admin, new
        {
            status = "active"
        })).Status, Is.EqualTo(200));
        Assert.That((await Call("GET", "auth/sessions/current", user)).Status, Is.EqualTo(401), "Re-enabling an account must not restore a revoked session.");
        Assert.That((await Call("POST", "auth/sessions", body: new
        {
            username = "maya",
            password = "maya"
        })).Status, Is.EqualTo(200));

    }

    [Test]
    public async Task managers_must_be_reassigned_before_removal()
    {
        var admin = await Login("nora");
        var path = $"organizations/{Company}/memberships/{GuidFor(4)}";
        Assert.That((await Call("PATCH", path, admin, new
        {
            managerUserId = GuidFor(4)
        })).Status, Is.EqualTo(400));
        Assert.That((await Call("PATCH", path, admin, new
        {
            managerUserId = GuidFor(1)
        })).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", $"users/{GuidFor(1)}", admin)).Status, Is.EqualTo(409));
    }

    [Test]
    public async Task organization_and_optional_structure_crud_are_tenant_scoped_and_reference_safe()
    {
        var admin = await Login("nora");
        var other = await Login("daria");
        var created = await Call("POST", "organizations", admin, new
        {
            name = "Empty",
            workWeekDays = 6
        });
        Assert.That(created.Status, Is.EqualTo(201));
        var id = created.Json!["guid"]!.ToString();
        var path = $"organizations/{id}";
        Assert.That((await Call("GET", path, other)).Status, Is.EqualTo(404));
        Assert.That((await Call("GET", path, admin)).Json!["teams"]!.AsArray(), Is.Empty);
        Assert.That((await Call("POST", path + "/memberships/" + GuidFor(4), admin, new
        {
            systemRoleId = GuidFor(102),
            jobRoleId = GuidFor(200)
        })).Status, Is.EqualTo(404));
        Assert.That((await Call("PATCH", path, admin, new
        {
            name = "Renamed",
            workWeekDays = 5
        })).Status, Is.EqualTo(200));
        Assert.That((await Call("PATCH", path, admin, new
        {
            name = " ",
            workWeekDays = 6
        })).Status, Is.EqualTo(400));
        var department = await Call("POST", path + "/departments", admin, new
        {
            name = "Optional"
        });
        var deptId = department.Json!["guid"]!.ToString();
        Assert.That((await Call("POST", path + "/teams", admin, new
        {
            name = "Foreign",
            departmentId = GuidFor(300)
        })).Status, Is.EqualTo(400));
        var team = await Call("POST", path + "/teams", admin, new
        {
            name = "Direct team"
        });
        var teamId = team.Json!["guid"]!.ToString();
        Assert.That(team.Json!["departmentId"], Is.Null);
        Assert.That((await Call("PATCH", path + "/teams/" + teamId, admin, new
        {
            name = "Grouped",
            departmentId = deptId
        })).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", path + "/departments/" + deptId, admin)).Status, Is.EqualTo(409));
        Assert.That((await Call("DELETE", path, admin)).Status, Is.EqualTo(409));
        Assert.That((await Call("POST", path + "/teams/" + teamId + "/deletion-request", admin)).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", path + "/teams/" + teamId, admin)).Status, Is.EqualTo(204));
        Assert.That((await Call("PATCH", path + "/departments/" + deptId, admin, new
        {
            name = "Changed"
        })).Status, Is.EqualTo(200));
        Assert.That((await Call("DELETE", path + "/departments/" + deptId, admin)).Status, Is.EqualTo(204));
        Assert.That((await Call("POST", path + "/deletion-request", admin)).Json!["deletedAt"], Is.Null);
        Assert.That((await Call("DELETE", path, admin)).Status, Is.EqualTo(204));
        Assert.That((await Call("GET", path, admin)).Status, Is.EqualTo(404));
    }
}
