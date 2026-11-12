using Vacate.Application.Abstractions;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Application.Common;

public sealed class RecordMapper(IUserRepository users, IMembershipRepository memberships, IRoleCatalog roles,
    IOrganizationRepository organizations, IUserPresentationCatalog presentation)
{
    public UserRecord User(User user) => new(user.Id, user.Guid, user.Username, user.Name.FirstName, user.Name.MiddleName, user.Name.LastName, user.Gender,
        user.Family.Married, user.Family.DependentChildren, user.Family.SoleCare, user.Status, memberships.Current(user.Id) is { } m ? Membership(m) : null,
        user.CreatedAt, user.UpdatedAt, user.DeleteRequestedAt, user.DeletedAt);

    public MembershipRecord Membership(Membership member)
    {
        var m = member.Configuration;
        var b = member.Balance;
        var org = organizations.Find(member.CompanyId)!;
        return new(member.Id, member.Guid, org.Guid, roles.SystemRoles().Single(r => r.Id == m.SystemRoleId).Guid, roles.JobRoles(org.Id).Single(r => r.Id == m.JobRoleId).Guid,
            org.Departments.SingleOrDefault(d => d.Id == m.DepartmentId)?.Guid, org.Teams.SingleOrDefault(t => t.Id == m.TeamId)?.Guid,
            m.ManagerUserId is { } managerId ? users.Find(managerId)?.Guid : null, m.HireDate, m.EmploymentEndDate, m.PriorService,
            roles.WorkSchedules().SingleOrDefault(r => r.Id == m.WorkScheduleId)?.Guid, null, null,
            new("annual", b.PeriodStart, b.PeriodEnd, "days", b.AsOf, b.PolicyVersion, b.PolicyMinimum, b.CustomAllocation, b.Allocation, b.Used, b.Pending,
                b.AvailableFor(org.VacationApprovalRequired(m.TeamId, m.DepartmentId))),
            member.CreatedAt, member.UpdatedAt, member.DeleteRequestedAt, member.DeletedAt);
    }

    private string? JobTitle(Membership? m) => m is null ? null : roles.JobRoles(m.CompanyId).SingleOrDefault(r => r.Id == m.Configuration.JobRoleId)?.Name;

    public DirectoryUserRecord Directory(User user)
    {
        var m = memberships.Current(user.Id);
        var org = m is null ? null : organizations.Find(m.CompanyId);
        var department = org?.Departments.SingleOrDefault(d => !d.IsDeleted && d.Id == m?.Configuration.DepartmentId);
        var team = org?.Teams.SingleOrDefault(t => !t.IsDeleted && t.Id == m?.Configuration.TeamId);
        return new(user.Username, user.Username, user.Name.FirstName, user.Name.MiddleName, user.Name.LastName, user.Gender,
            JobTitle(m), m is null ? null : m.IsAdmin ? "admin" : "employee", user.Guid,
            department?.Guid, department?.Name, team?.Guid, team?.Name);
    }

    public PersonRecord Person(User user)
    {
        var m = memberships.Current(user.Id);
        var metadata = presentation.Find(user.Id);
        var key = metadata?.DisplayKey ?? user.Guid.ToString();
        var org = m is null ? null : organizations.Find(m.CompanyId);
        var dept = org?.Departments.SingleOrDefault(d => !d.IsDeleted && d.Id == m?.Configuration.DepartmentId);
        var team = org?.Teams.SingleOrDefault(t => !t.IsDeleted && t.Id == m?.Configuration.TeamId);
        var capability = m?.IsAdmin == true ? "admin" : m is not null && metadata?.IsTeamLead == true ? "lead" : "employee";
        return new(key, key, user.Guid, org?.Guid.ToString() ?? "", user.Name.FirstName, JobTitle(m) ?? "", dept?.Guid.ToString() ?? "", team?.Guid.ToString() ?? "", team?.Name ?? "",
            capability, capability == "admin" ? "Admin" : capability == "lead" ? "Team lead" : "Employee", string.Concat(user.Name.FirstName.Take(2)).ToUpperInvariant(), key, user.Username);
    }

    public MembershipDetails Member(User user, Membership m) => new(user.Id, user.Guid, Person(user), Membership(m));

    public OrganizationRecord Organization(Organization org) => new(org.Id, org.Guid, org.Name, org.WorkWeekDays,
        org.Departments.Where(d => !d.IsDeleted).Select(Department).ToArray(), org.Teams.Where(t => !t.IsDeleted).Select(t => Team(org, t)).ToArray(), org.CreatedAt, org.UpdatedAt, org.DeleteRequestedAt, org.DeletedAt, org.Settings);

    public static DepartmentRecord Department(Department d) => new(d.Id, d.Guid, d.Name, d.CreatedAt, d.UpdatedAt, d.DeleteRequestedAt, d.DeletedAt, d.RequireVacationApproval);

    public static TeamRecord Team(Organization org, Team t) => new(t.Id, t.Guid, t.Name, org.Departments.SingleOrDefault(d => d.Id == t.DepartmentId)?.Guid, t.CreatedAt, t.UpdatedAt, t.DeleteRequestedAt, t.DeletedAt, t.RequireVacationApproval);
}
