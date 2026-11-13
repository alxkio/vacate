using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Leave;
using Vacate.Application.Memberships;
using Vacate.Application.Memberships.Commands;
using Vacate.Application.Organizations;
using Vacate.Application.Users;
using Vacate.Application.Users.Commands;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;
using Vacate.Infrastructure;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Persistence.Sql;

namespace Vacate.IntegrationTests;

[NonParallelizable]
public sealed class SqlPersistenceTests
{
    private ServiceProvider provider = null!;
    private readonly List<Guid> ownedOrganizations = [];
    private Tenant a = null!;
    private Tenant b = null!;

    [SetUp]
    public void Setup()
    {
        var connection = Environment.GetEnvironmentVariable("VACATE_SQL_TEST_CONNECTION");
        if (string.IsNullOrWhiteSpace(connection))
        {
            Assert.Ignore("Set VACATE_SQL_TEST_CONNECTION to an authorized migrated SQL test target.");
        }

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Persistence:Provider"] = "SqlServer",
            ["ConnectionStrings:Vacate"] = connection,
            ["DevelopmentAuthentication:Enabled"] = "true",
            ["SeedData:Enabled"] = "false"
        }).Build();
        var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration).AddPersistence(configuration);
        services.AddScoped<RecordMapper>();
        services.AddScoped<AccessPolicy>();
        services.AddScoped<UserService>();
        services.AddScoped<MembershipService>();
        services.AddScoped<OrganizationService>();
        services.AddScoped<LeaveService>();
        services.AddScoped<AdminLeaveService>();
        provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
        a = CreateTenant();
        b = CreateTenant();
    }

    [TearDown]
    public void Cleanup()
    {
        if (provider is null)
        {
            return;
        }

        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        using var transaction = context.Database.BeginTransaction();
        // Only roots allocated by this test and their dependent rows are removed.
        var companyIds = context.Set<OrganizationRow>().Where(x => ownedOrganizations.Contains(x.Guid)).Select(x => x.Id).ToArray();
        var userIds = context.Set<MembershipRow>().Where(x => companyIds.Contains(x.CompanyId)).Select(x => x.UserId)
            .Concat(context.Set<DevelopmentAccessRow>().Where(x => companyIds.Contains(x.CompanyId)).Select(x => x.UserId)).Distinct().ToArray();
        context.Set<DevelopmentAccessRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<CompanyClosureResultRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<CompanyHolidayRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<CompanyApproverRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<LeaveRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<CoveredSubmissionRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<LeaveRequestRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<CompanyClosureRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<LeaveEntitlementRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<MembershipEntitlementRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<MembershipRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<TeamRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<DepartmentRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<JobRoleRow>().Where(x => companyIds.Contains(x.CompanyId)).ExecuteDelete();
        context.Set<PrivateProfileRow>().Where(x => userIds.Contains(x.UserId)).ExecuteDelete();
        context.Set<UserRow>().Where(x => userIds.Contains(x.Id)).ExecuteDelete();
        context.Set<OrganizationRow>().Where(x => companyIds.Contains(x.Id)).ExecuteDelete();
        transaction.Commit();
        provider.Dispose();
        provider = null!;
        ownedOrganizations.Clear();
    }

    [Test]
    public void Resource_edits_survive_new_context_with_unicode_and_utc_lifecycle()
    {
        var changed = Use(services => services.GetRequiredService<UserService>().Update(a.MemberId,
            new(a.MemberGuid, new(true, "Ελλάδα Åsa Søren"), default, default, default, default, default, default)));
        var reloaded = Use(services => (UserRecord)services.GetRequiredService<UserService>().Get(a.MemberId, a.MemberGuid));
        Assert.Multiple(() =>
        {
            Assert.That(reloaded.FirstName, Is.EqualTo("Ελλάδα Åsa Søren"));
            Assert.That(reloaded.Guid, Is.EqualTo(a.MemberGuid));
            Assert.That(reloaded.CreatedAt, Is.EqualTo(changed.CreatedAt));
            Assert.That(reloaded.UpdatedAt, Is.EqualTo(changed.UpdatedAt));
            Assert.That(reloaded.UpdatedAt.Offset, Is.EqualTo(TimeSpan.Zero));
            Assert.That(reloaded.DeleteRequestedAt, Is.Null);
        });
    }

    [Test]
    public void Foreign_reads_and_relationship_updates_are_denied_without_mutation()
    {
        Assert.Throws<ServiceException>(() => Use(s => s.GetRequiredService<UserService>().Get(a.AdminId, b.MemberGuid)));
        var foreignTeam = Use(s => s.GetRequiredService<IOrganizationRepository>().Find(b.CompanyId)!.Teams.Single().Guid);
        Assert.Throws<DomainValidationException>(() => Use(s => s.GetRequiredService<MembershipService>().Update(a.AdminId,
            new(a.CompanyGuid, a.MemberGuid, new(TeamId: new(true, foreignTeam))))));
        Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Configuration.TeamId), Is.EqualTo(a.TeamId));
    }

    [Test]
    public void Demo_marker_defaults_false_and_survives_edits_without_granting_company_access()
    {
        using (var scope = provider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
            var row = context.Set<OrganizationRow>().Single(x => x.Id == a.CompanyId);
            Assert.That(row.IsDemo, Is.False);
            row.IsDemo = true;
            context.SaveChanges();
        }

        Use(s => s.GetRequiredService<OrganizationService>().Update(a.AdminId,
            new(a.CompanyGuid, Name: new(true, "Demo company edited"))));
        Assert.Throws<ServiceException>(() => Use(s => s.GetRequiredService<OrganizationService>().Get(b.AdminId, a.CompanyGuid)));
        using var reloaded = provider.CreateScope();
        var database = reloaded.ServiceProvider.GetRequiredService<VacateDbContext>();
        Assert.Multiple(() =>
        {
            Assert.That(database.Set<OrganizationRow>().Single(x => x.Id == a.CompanyId).IsDemo, Is.True);
            Assert.That(database.Set<OrganizationRow>().Single(x => x.Id == b.CompanyId).IsDemo, Is.False);
        });
    }

    [Test]
    public void Private_profile_fields_stay_out_of_colleague_projection()
    {
        var colleague = Use(s => s.GetRequiredService<UserService>().Get(a.AdminId, a.MemberGuid));
        var json = System.Text.Json.JsonSerializer.Serialize(colleague, colleague.GetType());
        Assert.Multiple(() =>
        {
            Assert.That(json, Does.Not.Contain("Married"));
            Assert.That(json, Does.Not.Contain("DependentChildren"));
            Assert.That(json, Does.Not.Contain("SoleCare"));
        });
    }

    [Test]
    public void Failed_transaction_discards_mutated_aggregates_and_private_rows()
    {
        var before = Use(s => s.GetRequiredService<IUserRepository>().Find(a.MemberId)!.Name.FirstName);
        Assert.Throws<DomainConflictException>(() => Use<bool>(s =>
        {
            s.GetRequiredService<IUserRepository>().Find(a.MemberId)!.UpdateProfile(new("Rejected", null, "Name"), "woman", new(), DateTimeOffset.UtcNow);
            throw new DomainConflictException("Injected rollback.");
        }));
        Assert.That(Use(s => s.GetRequiredService<IUserRepository>().Find(a.MemberId)!.Name.FirstName), Is.EqualTo(before));
    }

    [Test]
    public void Sql_foreign_key_rejects_cross_company_team_and_rolls_back()
    {
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        var row = context.Set<MembershipRow>().Single(x => x.UserId == a.MemberId && x.DeletedAt == null);
        row.TeamId = b.TeamId;
        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
        Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Configuration.TeamId), Is.EqualTo(a.TeamId));
    }

    [Test]
    public void Sql_rowversion_rejects_an_independent_stale_writer()
    {
        using var first = provider.CreateScope();
        using var second = provider.CreateScope();
        var one = first.ServiceProvider.GetRequiredService<VacateDbContext>();
        var two = second.ServiceProvider.GetRequiredService<VacateDbContext>();
        var original = one.Set<UserRow>().Single(x => x.Id == a.MemberId);
        var stale = two.Set<UserRow>().Single(x => x.Id == a.MemberId);
        original.FirstName = "Winner";
        one.SaveChanges();
        stale.FirstName = "Stale";
        Assert.Throws<DbUpdateConcurrencyException>(() => two.SaveChanges());
    }

    [Test]
    public async Task Two_concurrent_admin_disables_cannot_remove_both_admins()
    {
        Use(s =>
        {
            var membership = s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!;
            membership.Update(membership.Configuration with { SystemRoleId = SystemRoles.Admin }, null, DateTimeOffset.UtcNow);
            return true;
        });
        using var start = new ManualResetEventSlim(false);
        Task<bool> Disable(int target, Guid guid) => Task.Run(() =>
        {
            start.Wait();
            try
            {
                Use(s => s.GetRequiredService<UserService>().UpdateAccount(target, new(guid, default, new(true, "disabled"))));
                return true;
            }
            catch (ServiceException error) when (error.Kind == ServiceError.Conflict)
            {
                return false;
            }
        });
        var tasks = new[] { Disable(a.AdminId, a.AdminGuid), Disable(a.MemberId, a.MemberGuid) };
        start.Set();
        var results = await Task.WhenAll(tasks);
        Assert.That(results.Count(x => x), Is.EqualTo(1));
        Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().ForOrganization(a.CompanyId)
            .Count(m => m.IsAdmin && s.GetRequiredService<IUserRepository>().Find(m.UserId)!.CanSignIn)), Is.EqualTo(1));
    }

    [Test]
    public void Global_username_uniqueness_and_single_active_membership_are_database_constraints()
    {
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        var existing = context.Set<UserRow>().Single(x => x.Id == a.MemberId);
        var duplicate = new UserRow
        {
            Id = int.MaxValue - 1,
            Guid = Guid.NewGuid(),
            Username = existing.Username,
            FirstName = "Duplicate",
            LastName = "Test",
            Gender = "unspecified",
            Status = "active",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            PrivateProfile = new() { UserId = int.MaxValue - 1 }
        };
        context.Add(duplicate);
        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
        context.ChangeTracker.Clear();
        var member = context.Set<MembershipRow>().Single(x => x.UserId == a.MemberId);
        context.Entry(member).State = EntityState.Detached;
        member.Id = int.MaxValue - 2;
        member.Guid = Guid.NewGuid();
        context.Add(member);
        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Test]
    public void Unrepresentable_service_precision_is_rejected_atomically()
    {
        Assert.Throws<DomainValidationException>(() => Use(s =>
        {
            var m = s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!;
            m.Update(m.Configuration with { PriorService = 1.123456789m }, null, DateTimeOffset.UtcNow);
            return true;
        }));
        Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Configuration.PriorService), Is.Null);
    }

    [Test]
    public void Balance_is_derived_from_leave_rows_and_configuration_edits_do_not_rewrite_consumption()
    {
        using (var scope = provider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
            context.AddRange(Leave(a, "Used", 3), Leave(a, "Pending", 2), Leave(a, "Cancelled", 9), Leave(b, "Used", 7));
            context.SaveChanges();
        }

        var before = Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Balance);
        Assert.Multiple(() =>
        {
            Assert.That(before.Used, Is.EqualTo(3));
            Assert.That(before.Pending, Is.EqualTo(2));
            Assert.That(before.AvailableFor(true), Is.EqualTo(19));
            Assert.That(before.AvailableFor(false), Is.EqualTo(17));
        });
        Use(s =>
        {
            var member = s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!;
            member.Update(member.Configuration, 25, DateTimeOffset.UtcNow);
            return true;
        });
        var membershipId = Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Id);
        using (var scope = provider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
            var pending = context.Set<LeaveRow>().Single(x => x.MembershipId == membershipId && x.Status == "Pending");
            pending.Status = "Cancelled";
            pending.UpdatedAt = DateTimeOffset.UtcNow;
            context.SaveChanges();
        }

        var after = Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Balance);
        Assert.Multiple(() =>
        {
            Assert.That(after.Used, Is.EqualTo(3));
            Assert.That(after.Pending, Is.Zero);
            Assert.That(after.Available, Is.EqualTo(22));
            Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().Current(b.MemberId)!.Balance.Used), Is.EqualTo(7));
        });
    }

    [Test]
    public void Leave_foreign_company_attribution_and_duplicate_openings_are_database_rejected()
    {
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        var invalid = Leave(a, "Used", 1);
        invalid.CompanyId = b.CompanyId;
        context.Add(invalid);
        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
        context.ChangeTracker.Clear();
        var opening = Leave(a, "Used", 1);
        opening.EntryKind = "ImportedOpening";
        opening.StartDate = null;
        opening.EndDate = null;
        context.Add(opening);
        context.SaveChanges();
        var duplicate = Leave(a, "Used", 1);
        duplicate.EntryKind = "ImportedOpening";
        duplicate.StartDate = null;
        duplicate.EndDate = null;
        context.Add(duplicate);
        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [TestCase("quantity")]
    [TestCase("dates")]
    [TestCase("origin")]
    [TestCase("status")]
    public void Invalid_leave_quantity_dates_origin_or_status_are_rejected(string invalidField)
    {
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        var row = Leave(a, "Used", 1);
        switch (invalidField)
        {
            case "quantity":
                row.QuantityDays = 0;
                break;
            case "dates":
                row.EndDate = row.StartDate!.Value.AddDays(-1);
                break;
            case "origin":
                row.EntryKind = "ImportedOpening";
                break;
            case "status":
                row.Status = "Unreviewed";
                break;
        }

        context.Add(row);
        Assert.Throws<DbUpdateException>(() => context.SaveChanges());
    }

    [Test]
    public void Leave_rowversion_and_unknown_allocation_preserve_read_time_semantics()
    {
        Guid guid;
        using (var scope = provider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
            var row = Leave(a, "Used", 1);
            guid = row.Guid;
            context.Add(row);
            context.Set<MembershipEntitlementRow>().Single(x => x.MembershipId == row.MembershipId).PolicyMinimum = null;
            context.SaveChanges();
        }

        using var first = provider.CreateScope();
        using var second = provider.CreateScope();
        var one = first.ServiceProvider.GetRequiredService<VacateDbContext>();
        var two = second.ServiceProvider.GetRequiredService<VacateDbContext>();
        var winner = one.Set<LeaveRow>().Single(x => x.Guid == guid);
        var stale = two.Set<LeaveRow>().Single(x => x.Guid == guid);
        winner.QuantityDays = 2;
        one.SaveChanges();
        stale.QuantityDays = 3;
        Assert.Throws<DbUpdateConcurrencyException>(() => two.SaveChanges());
        var balance = Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Balance);
        Assert.Multiple(() =>
        {
            Assert.That(balance.Used, Is.EqualTo(2));
            Assert.That(balance.Allocation, Is.Null);
            Assert.That(balance.Available, Is.Null);
        });
    }

    private LeaveRow Leave(Tenant tenant, string status, decimal quantity)
    {
        var membershipId = Use(s => s.GetRequiredService<IMembershipRepository>().Current(tenant.MemberId)!.Id);
        var now = DateTimeOffset.UtcNow;
        return new LeaveRow
        {
            Guid = Guid.NewGuid(),
            CompanyId = tenant.CompanyId,
            MembershipId = membershipId,
            EntryKind = "RecordedLeave",
            Status = status,
            QuantityDays = quantity,
            StartDate = new(2026, 2, 2),
            EndDate = new(2026, 2, 3),
            Source = "synthetic-provider-test",
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private T Use<T>(Func<IServiceProvider, T> action)
    {
        using var scope = provider.CreateScope();
        var services = scope.ServiceProvider;
        return services.GetRequiredService<IUnitOfWork>().Execute(() => action(services));
    }

    [Test]
    public void Request_dates_are_durable_authorized_and_concurrent_overlap_is_charged_once()
    {
        var draft = new LeaveDraft("annual", "days", "range", new(2026, 1, 4), new(2026, 1, 6), null);
        var submissions = Enumerable.Range(0, 2).AsParallel().Select(_ => Use(s =>
            s.GetRequiredService<LeaveService>().Submit(a.MemberId, a.CompanyGuid, draft, Guid.NewGuid()))).ToArray();
        Assert.That(submissions.Select(x => x.Outcome), Is.EquivalentTo(new[] { "created", "already-covered" }));
        var requests = Use(s => s.GetRequiredService<LeaveService>().Requests(a.MemberId, a.CompanyGuid));
        Assert.That(requests, Has.Count.EqualTo(1));
        Assert.That(requests.Single().Dates.Select(d => d.Date), Is.EqualTo(new[] { new DateOnly(2026, 1, 5), new DateOnly(2026, 1, 6) }));
        Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Balance.Used), Is.EqualTo(2));
        Assert.Throws<ServiceException>(() => Use(s => s.GetRequiredService<LeaveService>().Requests(b.MemberId, a.CompanyGuid)));
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        Assert.That(context.Set<LeaveRow>().Count(x => x.CompanyId == a.CompanyId), Is.EqualTo(2));
        Assert.That(context.Set<LeaveRow>().Where(x => x.CompanyId == a.CompanyId).All(x => x.StartDate == x.EndDate && x.QuantityDays == 1 && x.RequestId != null), Is.True);
    }

    [Test]
    public void Company_calendar_is_durable_tenant_scoped_and_clear_restore_preserves_assignment_history()
    {
        var holiday = Use(s => s.GetRequiredService<AdminLeaveService>().AddHoliday(a.AdminId, a.CompanyGuid, "Annual company day", 2, 29));
        Use(s => s.GetRequiredService<AdminLeaveService>().SetApprover(a.AdminId, a.CompanyGuid, "organization", a.CompanyGuid, a.AdminGuid));
        Use(s => s.GetRequiredService<AdminLeaveService>().SetApprover(a.AdminId, a.CompanyGuid, "organization", a.CompanyGuid, null));
        Use(s => s.GetRequiredService<AdminLeaveService>().SetApprover(a.AdminId, a.CompanyGuid, "organization", a.CompanyGuid, a.AdminGuid));
        var calendar = Use(s => s.GetRequiredService<AdminLeaveService>().Calendar(a.AdminId, a.CompanyGuid));
        Assert.That(calendar.Holidays.Single().Guid, Is.EqualTo(holiday.Guid));
        Assert.That(calendar.Approvers.Single().ApproverGuid, Is.EqualTo(a.AdminGuid));
        Assert.Throws<ServiceException>(() => Use(s => s.GetRequiredService<AdminLeaveService>().Calendar(b.AdminId, a.CompanyGuid)));
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<VacateDbContext>();
        Assert.That(context.Set<CompanyApproverRow>().Count(x => x.CompanyId == a.CompanyId), Is.EqualTo(2));
        Assert.That(context.Set<CompanyApproverRow>().Count(x => x.CompanyId == a.CompanyId && x.DeletedAt != null), Is.EqualTo(1));
    }

    [Test]
    public void Company_closure_retries_and_concurrent_assigned_decisions_are_durable_exactly_once()
    {
        Use(s => s.GetRequiredService<AdminLeaveService>().SetApprover(a.AdminId, a.CompanyGuid, "organization", a.CompanyGuid, a.AdminGuid));
        var key = Guid.NewGuid();
        var draft = new ClosureDraft("Office closure", new(2026, 1, 5), new(2026, 1, 5), true);
        var closures = Enumerable.Range(0, 2).AsParallel().Select(_ => Use(s =>
            s.GetRequiredService<AdminLeaveService>().PublishClosure(a.AdminId, a.CompanyGuid, draft, key))).ToArray();
        Assert.That(closures.Select(c => c.Guid).Distinct().Count(), Is.EqualTo(1));
        var requestGuid = Guid.NewGuid();
        Use(s =>
        {
            var member = s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!;
            s.GetRequiredService<ILeaveRepository>().Add(new(a.CompanyId, member.Id, Guid.NewGuid(), "synthetic-provider-test",
                new(requestGuid, "annual", DateTimeOffset.UtcNow, [new(new(2026, 1, 6), "Pending", 2026)], a.AdminGuid)));
            return true;
        });
        var decisions = Enumerable.Range(0, 2).AsParallel().Select(_ =>
        {
            try
            {
                Use(s => s.GetRequiredService<AdminLeaveService>().Decide(a.AdminId, a.CompanyGuid, requestGuid, "approve"));
                return "approved";
            }
            catch (DomainConflictException)
            {
                return "conflict";
            }
        }).ToArray();
        Assert.That(decisions, Is.EquivalentTo(new[] { "approved", "conflict" }));
        Assert.That(Use(s => s.GetRequiredService<IMembershipRepository>().Current(a.MemberId)!.Balance.Used), Is.EqualTo(2));
        Assert.Throws<ServiceException>(() => Use(s => s.GetRequiredService<AdminLeaveService>().Decide(b.AdminId, a.CompanyGuid, requestGuid, "decline")));
    }

    private Tenant CreateTenant() => Use(s =>
    {
        var organizations = s.GetRequiredService<IOrganizationRepository>();
        var users = s.GetRequiredService<IUserRepository>();
        var memberships = s.GetRequiredService<IMembershipRepository>();
        var roles = s.GetRequiredService<IRoleCatalog>();
        var now = DateTimeOffset.UtcNow;
        var org = new Organization(organizations.NextId(), Guid.NewGuid(), "SQL acceptance " + Guid.NewGuid(), 5, now);
        var department = org.AddDepartment(organizations.NextDepartmentId(), Guid.NewGuid(), "Department", now);
        var team = org.AddTeam(organizations.NextTeamId(), Guid.NewGuid(), "Team", department.Id, now);
        organizations.Add(org);
        ownedOrganizations.Add(org.Guid);
        var job = new RoleReference(roles.NextJobRoleId(), Guid.NewGuid(), "Test member", org.Id);
        roles.AddJobRole(job);
        User AddUser(bool admin)
        {
            var user = new User(users.NextId(), Guid.NewGuid(), $"sql-{Guid.NewGuid():N}@vacate.invalid", new("Test", null, "User"), "unspecified", new(false, 1, false), now);
            users.Add(user);
            memberships.Add(new(memberships.NextId(), Guid.NewGuid(), user.Id, org.Id,
                new(admin ? SystemRoles.Admin : SystemRoles.Employee, job.Id, department.Id, team.Id),
                new(new(2026, 1, 1), new(2026, 12, 31), new(2026, 11, 2), "synthetic-test", 22, null, 0, 0), now));
            return user;
        }

        var admin = AddUser(true);
        var member = AddUser(false);
        return new Tenant(org.Id, org.Guid, admin.Id, admin.Guid, member.Id, member.Guid, department.Id, team.Id);
    });

    private sealed record Tenant(int CompanyId, Guid CompanyGuid, int AdminId, Guid AdminGuid, int MemberId, Guid MemberGuid, int DepartmentId, int TeamId);
}
