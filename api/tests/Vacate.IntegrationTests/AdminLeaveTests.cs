using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Api.Functions;
using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Identity;
using Vacate.Application.Leave;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Infrastructure;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Persistence.Sql;

namespace Vacate.IntegrationTests;

public sealed class AdminLeaveTests
{
    private ServiceProvider provider = null!;
    private InMemoryDatabase database = null!;
    private AdminLeaveService admin = null!;
    private LeaveService leave = null!;
    private AdminLeaveFunctions functions = null!;
    private AuthenticationService authentication = null!;
    private readonly Guid company = Guid.Parse("20000000-0000-4000-8000-000000000100");
    private int nora;
    private int maya;
    private int otherAdmin;
    private int companyId;

    [SetUp]
    public void Setup()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SeedData:Enabled"] = "true", ["DevelopmentAuthentication:Enabled"] = "true"
        }).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(config).AddInMemoryPersistence();
        services.AddSingleton<AccessPolicy>();
        services.AddSingleton<RecordMapper>();
        services.AddSingleton<AuthenticationService>();
        services.AddSingleton<LeaveService>();
        services.AddSingleton<AdminLeaveService>();
        services.AddSingleton<AdminLeaveFunctions>();
        services.AddSingleton<TimeProvider>(new FixedClock());
        provider = services.BuildServiceProvider();
        database = provider.GetRequiredService<InMemoryDatabase>();
        admin = provider.GetRequiredService<AdminLeaveService>();
        leave = provider.GetRequiredService<LeaveService>();
        authentication = provider.GetRequiredService<AuthenticationService>();
        functions = provider.GetRequiredService<AdminLeaveFunctions>();
        nora = database.CredentialAliases["nora"];
        maya = database.CredentialAliases["maya"];
        companyId = database.Memberships.Single(m => m.UserId == nora).CompanyId;
        var secondary = database.Memberships.First(m => m.CompanyId == companyId && m.UserId != nora && m.UserId != maya);
        secondary.Update(secondary.Configuration with { SystemRoleId = SystemRoles.Admin }, secondary.Balance.CustomAllocation, DateTimeOffset.UtcNow);
        otherAdmin = secondary.UserId;
    }

    [TearDown]
    public void Cleanup() => provider.Dispose();

    private Membership Member(int actor) => database.Memberships.Single(m => m.UserId == actor && !m.IsDeleted);

    private Guid UserGuid(int actor) => database.Users[actor].Guid;

    private static LeaveDraft Draft(string start, string end) => new("annual", "days", "range", DateOnly.Parse(start), DateOnly.Parse(end), null);

    private HttpRequest Request(string method, string actor, object body, string contentType = "application/json")
    {
        var request = new DefaultHttpContext().Request;
        request.Method = method;
        request.ContentType = contentType;
        var session = authentication.SignIn(actor, actor);
        request.Headers.Authorization = $"Bearer {session.AccessToken}";
        request.Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(body)));
        return request;
    }

    private static int Status(IActionResult result) => result is ObjectResult obj ? obj.StatusCode ?? 200 : ((StatusCodeResult)result).StatusCode;

    [Test]
    public async Task Approver_put_parses_JSON_rejects_unknown_fields_and_content_type_and_denies_employee()
    {
        var body = new { scope = "organization", scopeGuid = company, approverGuid = UserGuid(nora) };
        Assert.That(Status(await functions.Approver(Request("PUT", "nora", body), company.ToString())), Is.EqualTo(200));
        Assert.That(Status(await functions.Approver(Request("PUT", "nora", body, "text/plain"), company.ToString())), Is.EqualTo(415));
        Assert.That(Status(await functions.Approver(Request("PUT", "nora", new { scope = "organization", scopeGuid = company, approverGuid = UserGuid(nora), hacked = true }), company.ToString())), Is.EqualTo(400));
        Assert.That(Status(await functions.Approver(Request("PUT", "maya", body), company.ToString())), Is.EqualTo(404));
    }

    [Test]
    public void Assigned_admin_can_self_approve_and_other_admin_cannot_decide()
    {
        var request = leave.Submit(nora, company, Draft("2026-11-10", "2026-11-10"), Guid.NewGuid()).Request!;
        Assert.That(admin.Inbox(nora, company).Select(r => r.RequestGuid), Does.Contain(request.Guid));
        Assert.That(admin.Inbox(otherAdmin, company), Is.Empty);
        Assert.Throws<ServiceException>(() => admin.Decide(otherAdmin, company, request.Guid, "approve"));
        var decided = admin.Decide(nora, company, request.Guid, "approve");
        Assert.That(decided.Dates.Single().Status, Is.EqualTo("Approved"));
        Assert.That(decided.DecidedAt, Is.EqualTo(new FixedClock().GetUtcNow()));
        Assert.Throws<DomainConflictException>(() => admin.Decide(nora, company, request.Guid, "approve"));
    }

    [Test]
    public void Approval_changes_only_pending_dates_and_decline_preserves_approved_past_days()
    {
        var request = leave.Submit(maya, company, Draft("2026-11-05", "2026-11-06"), Guid.NewGuid()).Request!;
        Assert.That(request.Dates.Select(d => d.Status), Is.EqualTo(new[] { "Approved", "Pending" }));
        var decided = admin.Decide(nora, company, request.Guid, "decline");
        Assert.That(decided.Dates.Select(d => d.Status), Is.EqualTo(new[] { "Approved", "Declined" }));
        Assert.That(leave.Calendar(maya, company).Select(d => d.Date), Is.EqualTo(new[] { new DateOnly(2026, 11, 5) }));
    }

    [Test]
    public void Assignment_changes_reroute_legacy_and_new_pending_without_rewriting_completed_decisions()
    {
        var request = leave.Submit(maya, company, Draft("2026-11-10", "2026-11-10"), Guid.NewGuid()).Request!;
        var completed = leave.Submit(maya, company, Draft("2026-11-11", "2026-11-11"), Guid.NewGuid()).Request!;
        admin.Decide(nora, company, completed.Guid, "approve");
        var stored = database.LeaveRequests.Single(r => r.Request.Guid == request.Guid);
        database.LeaveRequests[database.LeaveRequests.IndexOf(stored)] = stored with { Request = request with { ApproverGuid = null } };
        admin.SetApprover(nora, company, "organization", company, UserGuid(otherAdmin));
        Assert.That(admin.Inbox(nora, company), Is.Empty);
        Assert.That(admin.Inbox(otherAdmin, company).Select(r => r.RequestGuid), Is.EqualTo(new[] { request.Guid }));
        Assert.Throws<ServiceException>(() => admin.Decide(nora, company, request.Guid, "approve"));
        Assert.That(leave.Requests(maya, company).Single(r => r.Guid == completed.Guid).ApproverGuid, Is.EqualTo(UserGuid(nora)));
        admin.Decide(otherAdmin, company, request.Guid, "approve");
    }

    [Test]
    public void Team_department_organization_precedence_is_explicit_and_not_manager_based()
    {
        var org = database.Organizations[companyId];
        var member = Member(maya);
        var team = org.Teams.Single(t => t.Id == member.Configuration.TeamId);
        var department = org.Departments.Single(d => d.Id == (team.DepartmentId ?? member.Configuration.DepartmentId));
        admin.SetApprover(nora, company, "department", department.Guid, UserGuid(otherAdmin));
        var first = leave.Submit(maya, company, Draft("2026-11-10", "2026-11-10"), Guid.NewGuid()).Request!;
        Assert.That(first.ApproverGuid, Is.EqualTo(UserGuid(otherAdmin)));
        admin.SetApprover(nora, company, "team", team.Guid, UserGuid(nora));
        Assert.That(admin.Inbox(nora, company).Select(r => r.RequestGuid), Does.Contain(first.Guid));
        admin.SetApprover(nora, company, "team", team.Guid, null);
        Assert.That(admin.Inbox(otherAdmin, company).Select(r => r.RequestGuid), Does.Contain(first.Guid));
    }

    [Test]
    public void Missing_or_revoked_approver_blocks_only_future_requests_with_recovery_and_denies_decisions()
    {
        var request = leave.Submit(maya, company, Draft("2026-11-10", "2026-11-10"), Guid.NewGuid()).Request!;
        var member = Member(nora);
        database.ProvisioningGrants.Add((nora, companyId));
        member.Update(member.Configuration with { SystemRoleId = SystemRoles.Employee }, member.Balance.CustomAllocation, DateTimeOffset.UtcNow);
        Assert.Throws<ServiceException>(() => admin.Decide(nora, company, request.Guid, "approve"));
        Assert.Throws<ServiceException>(() => admin.Inbox(nora, company));
        Assert.That(leave.Preview(maya, company, Draft("2026-11-11", "2026-11-11")).Errors, Has.Some.Contains("No active company approver"));
        Assert.That(leave.Preview(maya, company, Draft("2026-11-04", "2026-11-04")).CanSubmit, Is.True);
        admin.SetApprover(otherAdmin, company, "organization", company, UserGuid(otherAdmin));
        Assert.That(admin.Inbox(otherAdmin, company).Select(r => r.RequestGuid), Does.Contain(request.Guid));
        admin.SetApprover(otherAdmin, company, "organization", company, null);
        Assert.That(leave.Preview(maya, company, Draft("2026-11-11", "2026-11-11")).CanSubmit, Is.False);
    }

    [Test]
    public void Holiday_recurrence_is_tenant_owned_leap_year_only_and_new_calculation_does_not_rewrite_history()
    {
        var saved = leave.Submit(maya, company, Draft("2026-11-04", "2026-11-04"), Guid.NewGuid()).Request!;
        var holiday = admin.AddHoliday(nora, company, "Company day", 11, 4);
        Assert.That(holiday.CreatedAt.Offset, Is.EqualTo(TimeSpan.Zero));
        Assert.That(holiday.DeleteRequestedAt, Is.Null);
        Assert.That(leave.Preview(maya, company, Draft("2026-11-04", "2026-11-04")).WorkingDates, Is.Empty);
        Assert.That(leave.Requests(maya, company).Single().Dates, Is.EqualTo(saved.Dates));
        admin.AddHoliday(nora, company, "Leap day", 2, 29);
        var calendar = provider.GetRequiredService<ICompanyCalendarRepository>().Read(companyId);
        var dates = AdminLeaveService.RecurringDates(calendar, 2027, 2028);
        Assert.That(dates, Does.Contain(new DateOnly(2028, 2, 29)));
        Assert.That(dates.Count(d => d.Month == 2), Is.EqualTo(1));
        Assert.Throws<DomainValidationException>(() => admin.AddHoliday(nora, company, "Bad day", 2, 30));
        Assert.Throws<DomainConflictException>(() => admin.AddHoliday(nora, company, "Duplicate", 11, 4));
        Assert.Throws<ServiceException>(() => admin.AddHoliday(maya, company, "Unauthorized", 10, 1));
    }

    [Test]
    public void Closure_automatic_annual_leave_skips_insufficient_employees_and_replays_once_without_double_charge()
    {
        Member(maya).Update(Member(maya).Configuration, 0, DateTimeOffset.UtcNow);
        var draft = new ClosureDraft("Office closed", new(2026, 11, 10), new(2026, 11, 10), true);
        var key = Guid.NewGuid();
        var before = Member(nora).Balance.Used;
        var published = admin.PublishClosure(nora, company, draft, key);
        Assert.That(published.Results.Single(r => r.UserGuid == UserGuid(maya)).Outcome, Is.EqualTo("skipped"));
        Assert.That(leave.Requests(maya, company), Is.Empty);
        Assert.That(Member(nora).Balance.Used, Is.EqualTo(before + 1));
        var own = leave.Requests(nora, company).Single();
        Assert.That(own.Source, Is.EqualTo("CompanyClosure"));
        Assert.That(own.ClosureGuid, Is.EqualTo(published.Guid));
        Assert.That(own.Dates.Single().Status, Is.EqualTo("Approved"));
        Assert.That(admin.PublishClosure(nora, company, draft, key).Guid, Is.EqualTo(published.Guid));
        var repeated = admin.PublishClosure(nora, company, draft, Guid.NewGuid());
        Assert.That(repeated.Results.Single(r => r.UserGuid == UserGuid(nora)).Outcome, Is.EqualTo("already-covered"));
        Assert.That(Member(nora).Balance.Used, Is.EqualTo(before + 1));
        Assert.Throws<DomainConflictException>(() => admin.PublishClosure(nora, company, draft with { Name = "Changed" }, key));
    }

    [Test]
    public void Non_deducting_closure_is_visible_without_any_balance_impact_and_excludes_holidays()
    {
        admin.AddHoliday(nora, company, "Company holiday", 11, 10);
        var before = Member(maya).Balance.Used;
        var draft = new ClosureDraft("Closure", new(2026, 11, 10), new(2026, 11, 11), false);
        admin.PublishClosure(nora, company, draft, Guid.NewGuid());
        var record = leave.Requests(maya, company).Single();
        Assert.That(record.LeaveTypeId, Is.EqualTo("company-closure"));
        Assert.That(record.Dates.Select(d => d.Date), Is.EqualTo(new[] { new DateOnly(2026, 11, 11) }));
        Assert.That(Member(maya).Balance.Used, Is.EqualTo(before));
        Assert.That(admin.PreviewClosure(nora, company, draft with { EndDate = draft.StartDate }).Results.All(r => r.Outcome == "skipped"), Is.True);
    }

    [Test]
    public void Concurrent_closure_publication_and_decision_never_duplicate_consumption()
    {
        var draft = new ClosureDraft("Closure", new(2026, 11, 10), new(2026, 11, 10), true);
        var key = Guid.NewGuid();
        var results = Enumerable.Range(0, 5).AsParallel().Select(_ => admin.PublishClosure(nora, company, draft, key)).ToArray();
        Assert.That(results.Select(r => r.Guid).Distinct().Count(), Is.EqualTo(1));
        Assert.That(leave.Requests(nora, company), Has.Count.EqualTo(1));
        var pending = leave.Submit(maya, company, Draft("2026-11-11", "2026-11-11"), Guid.NewGuid()).Request!;
        var outcomes = Enumerable.Range(0, 5).AsParallel().Select(_ =>
        {
            try
            {
                admin.Decide(nora, company, pending.Guid, "approve");
                return "approved";
            }
            catch (DomainConflictException)
            {
                return "conflict";
            }
        }).ToArray();
        Assert.That(outcomes.Count(o => o == "approved"), Is.EqualTo(1));
    }

    [Test]
    public void Personnel_and_calendar_projections_preserve_privacy_and_reject_foreign_company()
    {
        var opening = Member(maya).Balance.Used;
        leave.Submit(maya, company, Draft("2026-11-04", "2026-11-04"), Guid.NewGuid());
        var person = admin.Personnel(nora, company, 2026).Single(p => p.UserGuid == UserGuid(maya));
        Assert.That(person.OpeningUsed, Is.EqualTo(opening));
        Assert.That(person.Used, Is.EqualTo(opening + 1));
        Assert.That(person.Requests, Has.Count.EqualTo(1));
        Member(maya).Update(Member(maya).Configuration, null, DateTimeOffset.UtcNow);
        var unknown = admin.Personnel(nora, company, 2026).Single(p => p.UserGuid == UserGuid(maya));
        Assert.That(unknown.Allocation, Is.Null);
        Assert.That(unknown.Available, Is.Null);
        Assert.That(unknown.Used, Is.EqualTo(opening + 1));
        Assert.That(unknown.OpeningUsed, Is.EqualTo(opening));
        Assert.Throws<ServiceException>(() => admin.Personnel(maya, company, 2026));
        var foreign = new Vacate.Domain.Organizations.Organization(900001, Guid.NewGuid(), "Foreign company", 5, DateTimeOffset.UtcNow);
        database.Organizations.Add(foreign.Id, foreign);
        Assert.Throws<ServiceException>(() => admin.Calendar(nora, foreign.Guid));
        Assert.Throws<ServiceException>(() => admin.MemberCalendar(nora, foreign.Guid));
        Assert.Throws<ServiceException>(() => admin.PublishClosure(nora, foreign.Guid, new("Hidden", new(2026, 11, 10), new(2026, 11, 10), false), Guid.NewGuid()));
        Assert.Throws<DomainValidationException>(() => admin.SetApprover(nora, company, "team", Guid.NewGuid(), UserGuid(nora)));

        var json = JsonSerializer.Serialize(admin.MemberCalendar(maya, company));
        Assert.That(json, Does.Not.Contain("Results").And.Not.Contain("Approver").And.Not.Contain("Balance"));
    }

    [Test]
    public void Moving_member_scope_immediately_changes_pending_authority_and_preserves_completed_actor()
    {
        var org = database.Organizations[companyId];
        var member = Member(maya);
        var originalTeam = org.Teams.Single(t => t.Id == member.Configuration.TeamId);
        var alternativeTeam = org.AddTeam(900002, Guid.NewGuid(), "New approval team", null, DateTimeOffset.UtcNow);
        admin.SetApprover(nora, company, "team", originalTeam.Guid, UserGuid(nora));
        admin.SetApprover(nora, company, "team", alternativeTeam.Guid, UserGuid(otherAdmin));
        var completed = leave.Submit(maya, company, Draft("2026-11-10", "2026-11-10"), Guid.NewGuid()).Request!;
        admin.Decide(nora, company, completed.Guid, "approve");
        var pending = leave.Submit(maya, company, Draft("2026-11-11", "2026-11-11"), Guid.NewGuid()).Request!;
        member.Update(member.Configuration with { TeamId = alternativeTeam.Id, DepartmentId = null }, member.Balance.CustomAllocation, DateTimeOffset.UtcNow);
        Assert.That(admin.Inbox(nora, company), Is.Empty);
        Assert.That(admin.Inbox(otherAdmin, company).Single().RequestGuid, Is.EqualTo(pending.Guid));
        Assert.That(admin.Inbox(otherAdmin, company).Single().ApproverGuid, Is.EqualTo(UserGuid(otherAdmin)));
        Assert.Throws<ServiceException>(() => admin.Decide(nora, company, pending.Guid, "approve"));
        var decision = admin.Decide(otherAdmin, company, pending.Guid, "approve");
        Assert.That(decision.ApproverGuid, Is.EqualTo(UserGuid(otherAdmin)));
        Assert.That(leave.Requests(maya, company).Single(r => r.Guid == completed.Guid).ApproverGuid, Is.EqualTo(UserGuid(nora)));
    }

    [Test]
    public void Approval_rechecks_balance_and_rejects_stale_assignment_without_mutation()
    {
        var request = leave.Submit(maya, company, Draft("2026-11-10", "2026-11-10"), Guid.NewGuid()).Request!;
        var member = Member(maya);
        member.Update(member.Configuration, 0, DateTimeOffset.UtcNow);
        Assert.Throws<DomainValidationException>(() => admin.Decide(nora, company, request.Guid, "approve"));
        Assert.That(leave.Requests(maya, company).Single().Dates.Single().Status, Is.EqualTo("Pending"));
        var used = member.Balance.Used;
        admin.SetApprover(nora, company, "organization", company, UserGuid(otherAdmin));
        var outcomes = Enumerable.Range(0, 4).AsParallel().Select(_ =>
        {
            try
            {
                admin.Decide(nora, company, request.Guid, "decline");
                return "decided";
            }
            catch (ServiceException)
            {
                return "denied";
            }
        }).ToArray();
        Assert.That(outcomes, Is.All.EqualTo("denied"));
        Assert.That(member.Balance.Used, Is.EqualTo(used));
        Assert.That(leave.Requests(maya, company).Single().Dates.Single().Status, Is.EqualTo("Pending"));
    }

    [Test]
    public void SQL_model_and_forward_script_include_normalized_company_tables_and_decision_columns()
    {
        using var context = new VacateDbContext(new DbContextOptionsBuilder<VacateDbContext>()
            .UseSqlServer("Server=localhost;Database=Vacate;Integrated Security=true;Encrypt=true;TrustServerCertificate=false").Options);
        foreach (var type in new[] { typeof(CompanyHolidayRow), typeof(CompanyClosureRow), typeof(CompanyClosureResultRow), typeof(CompanyApproverRow) })
        {
            var entity = context.Model.FindEntityType(type)!;
            Assert.That(entity.FindProperty("CompanyId"), Is.Not.Null);
            Assert.That(entity.GetForeignKeys(), Is.Not.Empty);
        }

        var results = context.Model.FindEntityType(typeof(CompanyClosureResultRow))!;
        var closureForeignKey = results.GetForeignKeys().Single(f => f.PrincipalEntityType.ClrType == typeof(CompanyClosureRow));
        Assert.That(closureForeignKey.Properties.Select(p => p.Name), Is.EqualTo(new[] { "CompanyId", "ClosureId" }));
        Assert.That(closureForeignKey.PrincipalKey.Properties.Select(p => p.Name), Is.EqualTo(new[] { "CompanyId", "Id" }));
        Assert.That(results.FindPrimaryKey()!.Properties.Select(p => p.Name), Is.EqualTo(new[] { "CompanyId", "ClosureId", "UserGuid" }));
        foreach (var type in new[] { typeof(CompanyHolidayRow), typeof(CompanyClosureRow), typeof(CompanyApproverRow) })
        {
            var version = context.Model.FindEntityType(type)!.FindProperty("RowVersion")!;
            Assert.That(version.IsConcurrencyToken, Is.True);
            Assert.That(version.ValueGenerated, Is.EqualTo(Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.OnAddOrUpdate));
        }

        var assignment = context.Model.FindEntityType(typeof(CompanyApproverRow))!;
        var activeScope = assignment.GetIndexes().Single(i => i.Properties.Select(p => p.Name).SequenceEqual(new[] { "CompanyId", "Scope", "ScopeGuid" }));
        Assert.That(activeScope.IsUnique, Is.True);
        Assert.That(activeScope.GetFilter(), Is.EqualTo("[DeletedAt] IS NULL"));
        var closure = context.Model.FindEntityType(typeof(CompanyClosureRow))!;
        Assert.That(closure.GetIndexes().Single(i => i.Properties.Select(p => p.Name).SequenceEqual(new[] { "CompanyId", "IdempotencyKey" })).IsUnique, Is.True);

        var script = context.GetService<IMigrator>().GenerateScript("20261105214614_LeaveRequestSubmission", "20261112210758_CompanyAdministration", MigrationsSqlGenerationOptions.Idempotent);
        var root = new DirectoryInfo(TestContext.CurrentContext.TestDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "AGENTS.md")))
        {
            root = root.Parent;
        }

        Assert.That(root, Is.Not.Null, "Find repository root to verify the reviewed incremental SQL artifact.");
        var reviewedScript = File.ReadAllText(Path.Combine(root!.FullName, "docs/database/migrations/0004-company-administration.sql"));
        Assert.That(reviewedScript.Replace("\r\n", "\n").Trim(), Is.EqualTo(script.Replace("\r\n", "\n").Trim()));
        Assert.That(script, Does.Contain("FOREIGN KEY ([CompanyId], [ClosureId]) REFERENCES [CompanyClosures] ([CompanyId], [Id])"));
        Assert.That(script, Does.Contain("ApproverGuid").And.Contain("ClosureGuid").And.Contain("DecidedAt"));
        Assert.That(script, Does.Not.Match(@"(?im)^\s*(DROP|DELETE|TRUNCATE)\s"));
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 6, 12, 0, 0, TimeSpan.Zero);
    }
}
