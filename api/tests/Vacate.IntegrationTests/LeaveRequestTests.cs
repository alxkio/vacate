using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Leave;
using Vacate.Domain.Common;
using Vacate.Domain.Organizations;
using Vacate.Infrastructure;
using Vacate.Testing;
using Vacate.Infrastructure.Persistence;

namespace Vacate.IntegrationTests;

public sealed class LeaveRequestTests
{
    private ServiceProvider provider = null!;
    private InMemoryDatabase database = null!;
    private LeaveService service = null!;
    private readonly Guid company = Guid.Parse("20000000-0000-4000-8000-000000000100");
    private int actor;
    private int membership;

    [SetUp]
    public void Setup()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(config).AddInMemoryPersistence().AddInMemoryTestFixtures();
        services.AddSingleton<AccessPolicy>();
        services.AddSingleton<LeaveService>();
        services.AddSingleton<TimeProvider>(new FixedClock(new DateTimeOffset(2026, 11, 5, 23, 30, 0, TimeSpan.Zero)));
        provider = services.BuildServiceProvider();
        database = provider.GetRequiredService<InMemoryDatabase>();
        service = provider.GetRequiredService<LeaveService>();
        actor = database.Users.Values.Single(x => x.Username.StartsWith("maya")).Id;
        membership = database.Memberships.Single(x => x.UserId == actor && !x.IsDeleted).Id;
        var org = database.Organizations.Values.Single(x => x.Guid == company);
        org.Update(org.Name, 5, DateTimeOffset.UtcNow, new VacationSettings(timeZone: "UTC", countryCode: "GR"));
    }

    [TearDown]
    public void Cleanup() => provider.Dispose();

    private LeaveDraft Range(string start, string end, string type = "annual") => new(type, "days", "range", DateOnly.Parse(start), DateOnly.Parse(end), null);

    [Test]
    public void Inclusive_duration_and_holiday_exclusions_save_only_working_dates()
    {
        database.PublicHolidays.Add(("GR", new(2026, 1, 6), "Synthetic holiday"));
        var draft = new LeaveDraft("annual", "days", "duration", new(2026, 1, 4), null, 2);
        var preview = service.Preview(actor, company, draft);
        Assert.That(preview.EndDate, Is.EqualTo(new DateOnly(2026, 1, 7)));
        Assert.That(preview.ExcludedDates.Select(x => x.Date), Is.EquivalentTo(new[] { new DateOnly(2026, 1, 4), new DateOnly(2026, 1, 6) }));
        var result = service.Submit(actor, company, draft, Guid.NewGuid());
        Assert.That(result.Request!.Dates.Select(x => x.Date), Is.EquivalentTo(preview.WorkingDates));
        Assert.That(service.Calendar(actor, company), Has.Count.EqualTo(2));
    }

    [Test]
    public void Explicit_allowance_funds_requests_without_inventing_an_unknown_policy_default()
    {
        var member = database.Memberships.Single(m => m.Id == membership);
        Assert.That(member.Balance.PolicyMinimum, Is.Null);
        Assert.That(member.Balance.CustomAllocation, Is.Not.Null);
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-01-05")).CanSubmit, Is.True);

        member.Update(member.Configuration, null, DateTimeOffset.UtcNow);
        var missing = service.Preview(actor, company, Range("2026-01-05", "2026-01-05"));
        Assert.That(missing.CanSubmit, Is.False);
        Assert.That(missing.Errors, Has.Some.Contains("No finite annual balance"));
        Assert.That(service.Requests(actor, company), Is.Empty);
    }

    [Test]
    public void Six_day_schedule_includes_saturday_but_not_sunday()
    {
        var org = database.Organizations.Values.Single(x => x.Guid == company);
        org.Update(org.Name, 6, DateTimeOffset.UtcNow);
        var preview = service.Preview(actor, company, Range("2026-01-03", "2026-01-05"));
        Assert.That(preview.WorkingDates, Is.EquivalentTo(new[] { new DateOnly(2026, 1, 3), new DateOnly(2026, 1, 5) }));
    }

    [Test]
    public void Zero_days_hours_unknown_balances_and_negative_balance_block()
    {
        Assert.That(service.Preview(actor, company, Range("2026-01-04", "2026-01-04")).CanSubmit, Is.False);
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-01-05") with { Unit = "hours" }).CanSubmit, Is.False);
        Assert.That(service.Preview(actor, company, Range("2027-01-05", "2027-01-05")).CanSubmit, Is.False);
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-03-01")).CanSubmit, Is.False);
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-01-05", "sick")).CanSubmit, Is.False);
    }

    [Test]
    public void Past_only_bypasses_approval_using_organization_timezone()
    {
        var draft = Range("2026-11-05", "2026-11-06");
        var utc = service.Submit(actor, company, draft, Guid.NewGuid());
        Assert.That(utc.Request!.Dates.All(d => d.Status == "Pending"), Is.True);
        var org = database.Organizations.Values.Single(x => x.Guid == company);
        org.Update(org.Name, 5, DateTimeOffset.UtcNow, new VacationSettings(timeZone: "Europe/Athens", countryCode: "GR"));
        var other = database.Users.Values.Single(x => x.Username.StartsWith("nora")).Id;
        var local = service.Submit(other, company, draft, Guid.NewGuid());
        Assert.That(local.Request!.Dates.Select(d => d.Status), Is.EqualTo(new[] { "Approved", "Pending" }));
    }

    [Test]
    public void Partial_fully_covered_and_different_type_preserve_original_and_charge_once()
    {
        var orgId = database.Memberships.Single(m => m.Id == membership).CompanyId;
        database.LeaveEntitlements.Clear();
        database.LeaveEntitlements.Add((orgId, membership, new("study", 2026, 5)));
        var original = service.Submit(actor, company, Range("2026-01-05", "2026-01-05"), Guid.NewGuid());
        var partial = service.Submit(actor, company, Range("2026-01-05", "2026-01-06", "study"), Guid.NewGuid());
        Assert.That(partial.Request!.Dates.Select(d => d.Date), Is.EqualTo(new[] { new DateOnly(2026, 1, 6) }));
        var key = Guid.NewGuid();
        var covered = service.Submit(actor, company, Range("2026-01-05", "2026-01-06", "study"), key);
        Assert.That(covered.Outcome, Is.EqualTo("already-covered"));
        Assert.That(service.Requests(actor, company), Has.Count.EqualTo(2));
        Assert.That(service.Requests(actor, company).Single(r => r.Guid == original.Request!.Guid).LeaveTypeId, Is.EqualTo("annual"));
        Assert.Throws<DomainConflictException>(() => service.Submit(actor, company, Range("2026-01-07", "2026-01-07", "study"), key));
    }

    [Test]
    public void Same_key_and_concurrent_overlap_never_duplicate()
    {
        var draft = Range("2026-01-05", "2026-01-06");
        var key = Guid.NewGuid();
        var responses = Enumerable.Range(0, 6).AsParallel().Select(_ => service.Submit(actor, company, draft, key)).ToArray();
        Assert.That(responses.Select(x => x.Request!.Guid).Distinct().Count(), Is.EqualTo(1));
        Assert.That(service.Calendar(actor, company), Has.Count.EqualTo(2));
        Assert.Throws<DomainConflictException>(() => service.Submit(actor, company, draft with { EndDate = new(2026, 1, 7) }, key));
    }

    [Test]
    public void Greek_carryover_is_oldest_first_through_march31_and_years_do_not_borrow()
    {
        var orgId = database.Memberships.Single(m => m.Id == membership).CompanyId;
        database.LeaveEntitlements.Add((orgId, membership, new("annual", 2027, 10)));
        var first = service.Submit(actor, company, Range("2027-03-31", "2027-04-01"), Guid.NewGuid());
        Assert.That(first.Request!.Dates.Select(d => d.EntitlementYear), Is.EqualTo(new[] { 2026, 2027 }));
        Assert.That(service.Preview(actor, company, Range("2028-01-03", "2028-01-03")).CanSubmit, Is.False);
    }

    [Test]
    public void Preview_changes_require_reconfirmation_and_foreign_organization_is_denied()
    {
        var draft = Range("2026-01-05", "2026-01-06");
        var preview = service.Preview(actor, company, draft);
        service.Submit(actor, company, Range("2026-01-05", "2026-01-05"), Guid.NewGuid());
        Assert.Throws<DomainConflictException>(() => service.Submit(actor, company, draft, Guid.NewGuid(), preview.Fingerprint));
        Assert.Throws<ServiceException>(() => service.Preview(actor, Guid.NewGuid(), draft));
    }

    [Test]
    public void Finite_balance_zero_boundary_pending_is_not_deducted_and_cancelled_dates_reopen()
    {
        var orgId = database.Memberships.Single(m => m.Id == membership).CompanyId;
        database.LeaveEntitlements.Add((orgId, membership, new("study", 2026, 3)));
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-01-08", "study")).CanSubmit, Is.False);
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-01-07", "study")).Balances.Single().Projected, Is.Zero);
        Assert.That(service.Preview(actor, company, Range("2026-01-05", "2026-01-06", "study")).Balances.Single().Projected, Is.EqualTo(1));
        var pending = service.Submit(actor, company, Range("2026-11-09", "2026-11-09", "study"), Guid.NewGuid());
        var preview = service.Preview(actor, company, Range("2026-11-10", "2026-11-10", "study"));
        Assert.That(preview.Balances.Single().Pending, Is.EqualTo(1));
        Assert.That(preview.Balances.Single().Available, Is.EqualTo(3));
        var org = database.Organizations.Values.Single(x => x.Guid == company);
        org.Update(org.Name, 5, DateTimeOffset.UtcNow, new VacationSettings(requireVacationApproval: false, countryCode: "GR"));
        Assert.That(service.Preview(actor, company, Range("2026-11-10", "2026-11-10", "study")).Balances.Single().Available, Is.EqualTo(2));
        var stored = database.LeaveRequests.Single(x => x.Request.Guid == pending.Request!.Guid);
        database.LeaveRequests.Remove(stored);
        database.LeaveRequests.Add(stored with { Request = stored.Request with { Dates = [new(new(2026, 11, 9), "Cancelled", 2026)] } });
        Assert.That(service.Preview(actor, company, Range("2026-11-09", "2026-11-09", "study")).CoveredDates, Is.Empty);
    }

    [Test]
    public void Cross_years_require_each_year_and_carryover_splits_old_then_new()
    {
        var orgId = database.Memberships.Single(m => m.Id == membership).CompanyId;
        database.LeaveEntitlements.Add((orgId, membership, new("annual", 2025, 2)));
        var split = service.Submit(actor, company, Range("2026-01-05", "2026-01-07"), Guid.NewGuid());
        Assert.That(split.Request!.Dates.Select(d => d.EntitlementYear), Is.EqualTo(new[] { 2025, 2025, 2026 }));
        database.LeaveEntitlements.Add((orgId, membership, new("study", 2026, 10)));
        database.LeaveEntitlements.Add((orgId, membership, new("study", 2027, 0)));
        Assert.That(service.Preview(actor, company, Range("2026-12-31", "2027-01-01", "study")).CanSubmit, Is.False);
        var foreign = new Organization(500, Guid.NewGuid(), "Other company", 5, DateTimeOffset.UtcNow);
        database.Organizations.Add(foreign.Id, foreign);
        var error = Assert.Throws<ServiceException>(() => service.Preview(actor, foreign.Guid, Range("2026-01-08", "2026-01-08")));
        Assert.That(error!.Kind, Is.EqualTo(ServiceError.NotFound));
    }

    [Test]
    public void Employee_can_cancel_selected_own_future_dates_and_preserve_other_dates_and_timestamps()
    {
        var original = service.Submit(actor, company, Range("2026-11-09", "2026-11-11"), Guid.NewGuid()).Request!;
        var before = database.Memberships.Single(m => m.Id == membership).Balance.Pending;
        var updated = service.Cancel(actor, company, original.Guid, [new(2026, 11, 10)]);
        Assert.Multiple(() =>
        {
            Assert.That(updated.Dates.Select(d => d.Status), Is.EqualTo(new[] { "Pending", "Cancelled", "Pending" }));
            Assert.That(updated.CreatedAt, Is.EqualTo(original.CreatedAt));
            Assert.That(updated.UpdatedAt, Is.Not.Null);
            Assert.That(database.Memberships.Single(m => m.Id == membership).Balance.Pending, Is.EqualTo(before - 1));
            Assert.That(service.Calendar(actor, company).Select(d => d.Date), Does.Not.Contain(new DateOnly(2026, 11, 10)));
            Assert.That(service.Requests(actor, company).Single().Dates[1].CanCancel, Is.False);
        });
    }

    [Test]
    public void Cancellation_rejects_foreign_people_companies_past_dates_and_generated_closures_atomically()
    {
        var own = service.Submit(actor, company, Range("2026-11-04", "2026-11-09"), Guid.NewGuid()).Request!;
        var other = database.Users.Values.Single(x => x.Username.StartsWith("nora")).Id;
        Assert.Throws<ServiceException>(() => service.Cancel(other, company, own.Guid, [new(2026, 11, 9)]));
        var now = DateTimeOffset.UtcNow;
        var foreignOrg = new Organization(900009, Guid.NewGuid(), "Foreign", 5, now);
        var foreignUser = new Vacate.Domain.Users.User(900009, Guid.NewGuid(), "cancel-foreign@example.invalid", new("Foreign", null, "Member"), "unspecified", new(false, 0, false), now);
        database.Organizations.Add(foreignOrg.Id, foreignOrg);
        database.Users.Add(foreignUser.Id, foreignUser);
        database.Memberships.Add(new(900009, Guid.NewGuid(), foreignUser.Id, foreignOrg.Id,
            new(Vacate.Domain.Memberships.SystemRoles.Employee, 900009), new(new(2026, 1, 1), new(2026, 12, 31), new(2026, 1, 1), null, null, 22, 0, 0), now));
        var foreign = foreignUser.Id;
        Assert.Throws<ServiceException>(() => service.Cancel(foreign, company, own.Guid, [new(2026, 11, 9)]));
        Assert.Throws<DomainConflictException>(() => service.Cancel(actor, company, own.Guid, [new(2026, 11, 4), new(2026, 11, 9)]));
        Assert.That(service.Requests(actor, company).Single().Dates.All(d => d.Status is "Approved" or "Pending"), Is.True);
        var repository = provider.GetRequiredService<ILeaveRepository>();
        var stored = repository.Find(database.Memberships.Single(m => m.Id == membership).CompanyId, own.Guid)!;
        repository.Update(stored with { Request = stored.Request with { Source = "CompanyClosure", ClosureGuid = Guid.NewGuid() } });
        Assert.Throws<DomainConflictException>(() => service.Cancel(actor, company, own.Guid, [new(2026, 11, 9)]));
    }

    [Test]
    public void Past_pending_dates_expire_in_company_timezone_and_release_balance_and_calendar()
    {
        var member = database.Memberships.Single(m => m.Id == membership);
        var repository = provider.GetRequiredService<ILeaveRepository>();
        var request = new LeaveRequestRecord(Guid.NewGuid(), "annual", DateTimeOffset.UtcNow,
            [new(new(2026, 11, 4), "Pending", 2026), new(new(2026, 11, 5), "Pending", 2026), new(new(2026, 11, 6), "Pending", 2026)]);
        repository.Add(new(member.CompanyId, member.Id, Guid.NewGuid(), "expiry-test", request));
        var before = member.Balance.Pending;
        var org = database.Organizations[member.CompanyId];
        org.Update(org.Name, 5, DateTimeOffset.UtcNow, new VacationSettings(timeZone: "Europe/Athens", countryCode: "GR"));
        var result = service.Requests(actor, company).Single();
        Assert.That(result.Dates.Select(d => d.Status), Is.EqualTo(new[] { "Expired", "Expired", "Pending" }));
        Assert.That(member.Balance.Pending, Is.EqualTo(before - 2));
        Assert.That(service.Calendar(actor, company).Select(d => d.Date), Is.EqualTo(new[] { new DateOnly(2026, 11, 6) }));
        Assert.That(service.Requests(actor, company).Single().Dates.Take(2).All(d => !d.CanCancel), Is.True);
        Assert.That(service.Requests(actor, company).Single().Dates.Select(d => d.Status), Is.EqualTo(result.Dates.Select(d => d.Status)));
    }

    private sealed class FixedClock(DateTimeOffset instant) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => instant;
    }
}
