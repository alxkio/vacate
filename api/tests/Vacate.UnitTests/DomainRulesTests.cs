using Vacate.Application.Users;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.UnitTests;

public sealed class DomainRulesTests
{
    private static readonly DateTimeOffset Start = DateTimeOffset.Parse("2026-10-22T00:00:00Z");

    private static User User() => new(1, Guid.NewGuid(), "person@example.invalid", new("First", null, "Last"), "unspecified", new(), Start);

    [Test]
    public void unknown_family_attributes_use_confirmed_defaults_and_conflicting_facts_are_rejected()
    {
        var unknown = new FamilyInformation(null, null, null);
        Assert.Multiple(() =>
        {
            Assert.That(unknown.Married, Is.False);
            Assert.That(unknown.DependentChildren, Is.Zero);
            Assert.That(unknown.SoleCare, Is.False);
        });
        Assert.Throws<DomainValidationException>(() => new FamilyInformation(true, 1, true));
        Assert.Throws<DomainValidationException>(() => new FamilyInformation(false, -1, false));
    }

    [Test]
    public void invalid_profile_change_does_not_partially_update_the_account()
    {
        var user = User();
        Assert.Throws<DomainValidationException>(() => user.UpdateProfile(new("Lost", null, "Update"), "invalid", new(), Start.AddDays(1)));
        Assert.Multiple(() =>
        {
            Assert.That(user.Name.FirstName, Is.EqualTo("First"));
            Assert.That(user.UpdatedAt, Is.EqualTo(Start));
        });
        user.UpdateProfile(new("  Saved  ", " ", " Last "), "woman", new(false, 0, false), Start.AddDays(1));
        Assert.That(user.Name, Is.EqualTo(new PersonName("Saved", null, "Last")));
    }

    [Test]
    public void balance_enforces_a_trusted_policy_floor_and_derives_available_days()
    {
        // Synthetic values test equations; no jurisdiction policy is encoded here.
        var balance = new AnnualBalance(new(2026, 1, 1), new(2026, 12, 31), new(2026, 10, 22), "test-policy", 25, null, 3, 2);
        Assert.That(balance.Allocation, Is.EqualTo(25));
        Assert.That(balance.Available, Is.EqualTo(20));
        Assert.Throws<DomainValidationException>(() => balance.WithCustomAllocation(24));
        Assert.That(balance.WithCustomAllocation(30).Available, Is.EqualTo(25));
        var unresolved = new AnnualBalance(new(2026, 1, 1), new(2026, 12, 31), new(2026, 10, 22), null, null, 25, 3, 2);
        Assert.That(unresolved.Allocation, Is.Null);
        Assert.That(unresolved.Available, Is.Null);
    }

    [Test]
    public void employment_configuration_validates_service_and_date_order_without_a_web_host()
    {
        var valid = new MembershipConfiguration(SystemRoles.Employee, 1, HireDate: new(2026, 1, 1), PriorService: 3.5m);
        Assert.DoesNotThrow(valid.Validate);
        Assert.Throws<DomainValidationException>(() => (valid with { PriorService = -1 }).Validate());
        Assert.Throws<DomainValidationException>(() => (valid with { EmploymentEndDate = new(2025, 12, 31) }).Validate());
    }

    [Test]
    public void organization_can_be_flat_and_deletion_respects_optional_structure_references()
    {
        var org = new Organization(1, Guid.NewGuid(), "Flat", 5, Start);
        Assert.That(org.Departments, Is.Empty);
        Assert.That(org.Teams, Is.Empty);
        var department = org.AddDepartment(1, Guid.NewGuid(), "Optional", Start);
        var team = org.AddTeam(1, Guid.NewGuid(), "Team", department.Id, Start);
        Assert.Throws<DomainConflictException>(() => org.DeleteDepartment(department.Id, Start));
        Assert.Throws<DomainValidationException>(() => org.AddTeam(2, Guid.NewGuid(), "Foreign", 999, Start));
        org.DeleteTeam(team.Id, Start);
        org.DeleteDepartment(department.Id, Start);
        var direct = org.AddTeam(2, Guid.NewGuid(), "Direct", null, Start);
        Assert.That(direct.DepartmentId, Is.Null);
        org.DeleteTeam(direct.Id, Start);
        org.Delete(Start.AddDays(1));
        Assert.That(org.IsDeleted, Is.True);
    }

    [Test]
    public void deletion_request_and_deletion_are_distinct_server_owned_utc_lifecycle_transitions()
    {
        var user = User();
        var requested = Start.AddDays(1).ToOffset(TimeSpan.FromHours(2));
        user.RequestDeletion(requested);
        Assert.That(user.DeletedAt, Is.Null);
        Assert.That(user.DeleteRequestedAt!.Value.Offset, Is.EqualTo(TimeSpan.Zero));
        user.Delete(Start.AddDays(2));
        Assert.That(user.DeleteRequestedAt, Is.EqualTo(requested));
        Assert.That(user.CreatedAt, Is.EqualTo(Start));
        Assert.That(user.CanSignIn, Is.False);
        Assert.Throws<DomainConflictException>(() => user.RequestDeletion(Start.AddDays(3)));
    }

    [Test]
    public void domain_and_application_assemblies_do_not_depend_on_http_or_infrastructure()
    {
        foreach (var assembly in new[] { typeof(User).Assembly, typeof(UserService).Assembly })
        {
            var forbidden = assembly.GetReferencedAssemblies().Where(a => a.Name!.Contains("AspNetCore") || a.Name.Contains("Infrastructure") || a.Name == "Vacate.Api" || a.Name.Contains("EntityFrameworkCore"));
            Assert.That(forbidden, Is.Empty, assembly.GetName().Name);
        }
        Assert.That(typeof(User).Assembly.GetReferencedAssemblies().Any(a => a.Name == "System.Text.Json"), Is.False);
    }
}
