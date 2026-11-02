using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Vacate.Application.Abstractions;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Infrastructure.Persistence.Sql;

internal sealed class SqlUsers(SqlSession session) : IUserRepository
{
    private IQueryable<UserRow> Rows => session.Context.Set<UserRow>().Include(x => x.PrivateProfile);

    public User? Find(int id) => session.TrackedUsers.SingleOrDefault(x => x.Id == id)
        ?? (Rows.SingleOrDefault(x => x.Id == id) is { } row ? session.Track(row) : null);

    public User? FindByGuid(Guid guid) => session.TrackedUsers.SingleOrDefault(x => x.Guid == guid)
        ?? (Rows.SingleOrDefault(x => x.Guid == guid) is { } row ? session.Track(row) : null);

    public IReadOnlyList<User> All() => Rows.ToArray().Select(session.Track).Concat(session.TrackedUsers).DistinctBy(x => x.Id).ToArray();

    public int NextId() => session.Next("UserIds");

    public void Add(User user) => session.Add(user);
}

internal sealed class SqlMemberships(SqlSession session) : IMembershipRepository
{
    private IQueryable<MembershipRow> Rows => session.Context.Set<MembershipRow>().Include(x => x.Entitlement).Include(x => x.Leaves).AsSplitQuery();

    public Membership? Current(int userId) => History(userId).SingleOrDefault(x => !x.IsDeleted);

    public IReadOnlyList<Membership> History(int userId) => Rows.Where(x => x.UserId == userId).ToArray()
        .Select(session.Track).Concat(session.TrackedMemberships.Where(x => x.UserId == userId)).DistinctBy(x => x.Id).ToArray();

    public IReadOnlyList<Membership> ForOrganization(int organizationId)
    {
        session.Company(organizationId);
        return Rows.Where(x => x.CompanyId == organizationId).ToArray().Select(session.Track)
            .Concat(session.TrackedMemberships.Where(x => x.CompanyId == organizationId)).DistinctBy(x => x.Id).Where(x => !x.IsDeleted).ToArray();
    }

    public int NextId() => session.Next("MembershipIds");

    public void Add(Membership membership) => session.Add(membership);
}

internal sealed class SqlOrganizations(SqlSession session) : IOrganizationRepository
{
    private IQueryable<OrganizationRow> Rows => session.Context.Set<OrganizationRow>().Include(x => x.Departments).Include(x => x.Teams).AsSplitQuery();

    public Organization? Find(int id)
    {
        session.Company(id);
        return session.TrackedOrganizations.SingleOrDefault(x => x.Id == id)
            ?? (Rows.SingleOrDefault(x => x.Id == id) is { } row ? session.Track(row) : null);
    }

    public Organization? FindByGuid(Guid guid) => session.TrackedOrganizations.SingleOrDefault(x => x.Guid == guid)
        ?? (Rows.SingleOrDefault(x => x.Guid == guid) is { } row ? session.Track(row) : null);

    public IReadOnlyList<Organization> All() => Rows.ToArray().Select(session.Track).Concat(session.TrackedOrganizations).DistinctBy(x => x.Id).ToArray();

    public int NextId() => session.Next("OrganizationIds");

    public int NextDepartmentId() => session.Next("DepartmentIds");

    public int NextTeamId() => session.Next("TeamIds");

    public void Add(Organization organization) => session.Add(organization);
}

internal sealed class SqlRoles(SqlSession session, TimeProvider clock) : IRoleCatalog
{
    public IReadOnlyList<RoleReference> SystemRoles() => session.Context.Set<SystemRoleRow>()
        .Select(x => new RoleReference(x.Id, x.Guid, x.Name, null)).ToArray();

    public IReadOnlyList<RoleReference> JobRoles(int companyId) => session.Context.Set<JobRoleRow>().Where(x => x.CompanyId == companyId)
        .ToArray().Concat(session.Context.Set<JobRoleRow>().Local.Where(x => x.CompanyId == companyId)).DistinctBy(x => x.Id)
        .Select(x => new RoleReference(x.Id, x.Guid, x.Name, x.CompanyId)).ToArray();

    public IReadOnlyList<RoleReference> WorkSchedules() => session.Context.Set<WorkScheduleRow>()
        .Select(x => new RoleReference(x.Id, x.Guid, x.Name, null)).ToArray();

    public int NextJobRoleId() => session.Next("JobRoleIds");

    public void AddJobRole(RoleReference role)
    {
        if (role.CompanyId is not { } companyId)
        {
            throw new DomainValidationException("A company job role is required.");
        }

        session.Company(companyId);
        var now = clock.GetUtcNow();
        session.Context.Add(new JobRoleRow { Id = role.Id, Guid = role.Guid, Name = role.Name, CompanyId = companyId, CreatedAt = now, UpdatedAt = now });
    }
}

internal sealed class SqlDevelopmentAccess(SqlSession session, IConfiguration configuration) : IProvisioningAccess
{
    private bool Enabled => bool.TryParse(configuration["DevelopmentAuthentication:Enabled"], out var enabled) && enabled;

    public void Invite(int userId, int organizationId)
    {
        RequireEnabled();
        foreach (var prior in session.Context.Set<DevelopmentAccessRow>().Where(x => x.UserId == userId && x.Invited))
        {
            prior.Invited = false;
        }

        Row(userId, organizationId).Invited = true;
    }

    public bool WasInvited(int userId, int organizationId) => Enabled && session.Context.Set<DevelopmentAccessRow>().Find(userId, organizationId)?.Invited == true;

    public int? InvitationOrganization(int userId) => !Enabled ? null : session.Context.Set<DevelopmentAccessRow>()
        .Where(x => x.UserId == userId && x.Invited).Select(x => (int?)x.CompanyId).SingleOrDefault();

    public void Grant(int userId, int organizationId)
    {
        RequireEnabled();
        Row(userId, organizationId).CanProvision = true;
    }

    public bool CanProvision(int userId, int organizationId) => Enabled && session.Context.Set<DevelopmentAccessRow>().Find(userId, organizationId)?.CanProvision == true;

    private DevelopmentAccessRow Row(int userId, int companyId)
    {
        var row = session.Context.Set<DevelopmentAccessRow>().Find(userId, companyId);
        if (row is null)
        {
            row = new() { UserId = userId, CompanyId = companyId };
            session.Context.Add(row);
        }

        return row;
    }

    private void RequireEnabled()
    {
        if (!Enabled)
        {
            throw new DomainValidationException("Fictional provisioning is disabled; production onboarding is not configured.");
        }
    }
}
