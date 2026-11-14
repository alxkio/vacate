using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Application.Abstractions;
using Vacate.Infrastructure.Persistence;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Testing;

internal static class InMemoryFixture
{
    public static IServiceCollection AddInMemoryTestFixtures(this IServiceCollection services)
    {
        var database = new InMemoryDatabase();
        var aliases = new Dictionary<string, int>();
        Apply(database, aliases);
        services.AddSingleton(database);
        services.AddSingleton<ICredentialValidator>(provider => new FixtureCredentials(database,
            provider.GetRequiredService<IConfiguration>(), provider.GetRequiredService<IUserRepository>(), aliases));
        return services;
    }

    private static void Apply(InMemoryDatabase database, Dictionary<string, int> aliases)
    {
        using var stream = typeof(InMemoryFixture).Assembly.GetManifestResourceStream("Vacate.Testing.fictional-users.json")!;
        var seed = JsonNode.Parse(stream)!;

        static int Id(JsonNode n, string key = "id") => n[key]!.GetValue<int>();

        static Guid Uuid(JsonNode n) => Guid.Parse(n["guid"]!.ToString());

        static int? OptionalId(JsonNode n, string key) => n[key]?.GetValue<int>();

        static DateOnly? Date(JsonNode n, string key) => n[key] is null ? null : DateOnly.Parse(n[key]!.ToString());
        foreach (var n in seed["organizations"]!.AsArray().Select(x => x!))
        {
            var now = DateTimeOffset.Parse(n["createdAt"]!.ToString());
            var org = new Organization(Id(n), Uuid(n), n["name"]!.ToString(), Id(n, "workWeekDays"), now);
            if (n["settings"] is { } settings)
            {
                org.Update(org.Name, org.WorkWeekDays, now, new(settings["requireVacationApproval"]!.GetValue<bool>(),
                    settings["departmentLeadSettingsEnabled"]!.GetValue<bool>(), settings["teamLeadSettingsEnabled"]!.GetValue<bool>(),
                    settings["carryoverEnabled"]!.GetValue<bool>(), settings["carryoverYears"]!.GetValue<int>(),
                    settings["timeZone"]?.ToString() ?? "UTC", settings["countryCode"]?.ToString()));
            }
            foreach (var d in n["departments"]!.AsArray().Select(x => x!))
            {
                org.AddDepartment(Id(d), Uuid(d), d["name"]!.ToString(), now);
            }

            foreach (var t in n["teams"]!.AsArray().Select(x => x!))
            {
                org.AddTeam(Id(t), Uuid(t), t["name"]!.ToString(), OptionalId(t, "departmentId"), now);
            }

            database.Organizations.Add(org.Id, org);
        }
        foreach (var r in seed["jobRoles"]!.AsArray().Select(x => x!))
        {
            database.JobRoles.Add(new(Id(r), Uuid(r), r["name"]!.ToString(), Id(r, "companyId")));
        }

        foreach (var r in seed["workSchedules"]!.AsArray().Select(x => x!))
        {
            database.WorkSchedules.Add(new(Id(r), Uuid(r), r["name"]!.ToString()));
        }

        foreach (var item in seed["users"]!.AsArray().Select(x => x!))
        {
            var p = item["profile"]!;
            var now = DateTimeOffset.Parse(p["createdAt"]!.ToString());
            var user = new User(Id(p), Uuid(p), p["username"]!.ToString(), new(p["firstName"]!.ToString(), p["middleName"]?.ToString(), p["lastName"]!.ToString()),
                p["gender"]!.ToString(), new(p["married"]?.GetValue<bool>(), p["dependentChildren"]?.GetValue<int>(), p["soleCare"]?.GetValue<bool>()), now);
            database.Users.Add(user.Id, user);
            var alias = item["alias"]!.ToString();
            aliases.Add(alias, user.Id);
            if (p["membership"] is not { } m)
            {
                continue;
            }

            var config = new MembershipConfiguration(Id(m, "systemRoleId"), Id(m, "jobRoleId"), OptionalId(m, "departmentId"), OptionalId(m, "teamId"), OptionalId(m, "managerUserId"),
                Date(m, "hireDate"), Date(m, "employmentEndDate"), m["priorService"]?.GetValue<decimal>(), OptionalId(m, "workScheduleId"), OptionalId(m, "holidayCalendarId"), OptionalId(m, "leavePolicyId"));
            var b = m["balance"]!;
            var balance = new AnnualBalance(DateOnly.Parse(b["periodStart"]!.ToString()), DateOnly.Parse(b["periodEnd"]!.ToString()), DateOnly.Parse(b["asOf"]!.ToString()),
                b["policyVersion"]?.ToString(), b["policyMinimum"]?.GetValue<decimal>(), b["customAllocation"]?.GetValue<decimal>(), b["used"]!.GetValue<decimal>(), b["pending"]!.GetValue<decimal>());
            var settingsRole = item["settingsRole"] is { } role ? Enum.Parse<SettingsRole>(role.ToString()) : SettingsRole.Employee;
            database.Memberships.Add(new(Id(m), Uuid(m), user.Id, Id(m, "companyId"), config, balance, now, settingsRole));
            database.Invitations.Add(user.Id, Id(m, "companyId"));
        }
        // Explicit fictional fixture assignment; production companies remain unconfigured.
        var nora = database.Users.Values.Single(u => u.Username.StartsWith("nora"));
        var noraMember = database.Memberships.Single(m => m.UserId == nora.Id);
        var company = database.Organizations[noraMember.CompanyId];
        database.CompanyCalendars[company.Id] = new([], [], [new("organization", company.Guid, nora.Guid)]);
    }
}
