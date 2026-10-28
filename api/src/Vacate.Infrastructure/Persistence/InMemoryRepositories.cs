using Vacate.Application.Abstractions;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Infrastructure.Persistence;

public sealed class InMemoryUnitOfWork(InMemoryDatabase database) : IUnitOfWork
{
    public T Execute<T>(Func<T> operation)
    {
        lock (database.Gate)
        {
            return operation();
        }
    }
}

public sealed class UserRepository(InMemoryDatabase database) : IUserRepository
{
    public User? Find(int id) => database.Users.GetValueOrDefault(id);

    public User? FindByGuid(Guid guid) => database.Users.Values.SingleOrDefault(u => u.Guid == guid);

    public IReadOnlyList<User> All() => database.Users.Values.ToArray();

    public int NextId() => database.Users.Values.Select(u => u.Id).DefaultIfEmpty(0).Max() + 1;

    public void Add(User user)
    {
        if (database.Users.Values.Any(u => u.Username == user.Username))
        {
            throw new DomainConflictException("Username is reserved.");
        }

        database.Users.Add(user.Id, user);
    }
}

public sealed class MembershipRepository(InMemoryDatabase database) : IMembershipRepository
{
    public Membership? Current(int userId) => database.Memberships.SingleOrDefault(m => !m.IsDeleted && m.UserId == userId);

    public IReadOnlyList<Membership> History(int userId) => database.Memberships.Where(m => m.UserId == userId).ToArray();

    public IReadOnlyList<Membership> ForOrganization(int companyId) => database.Memberships.Where(m => !m.IsDeleted && m.CompanyId == companyId).ToArray();

    public int NextId() => database.Memberships.Select(m => m.Id).DefaultIfEmpty(0).Max() + 1;

    public void Add(Membership membership)
    {
        if (Current(membership.UserId) is not null)
        {
            throw new DomainConflictException("A membership is already assigned.");
        }

        database.Memberships.Add(membership);
    }
}

public sealed class OrganizationRepository(InMemoryDatabase database) : IOrganizationRepository
{
    public Organization? Find(int id) => database.Organizations.GetValueOrDefault(id);

    public Organization? FindByGuid(Guid guid) => database.Organizations.Values.SingleOrDefault(o => o.Guid == guid);

    public int NextId() => database.Organizations.Keys.DefaultIfEmpty(0).Max() + 1;

    public int NextDepartmentId() => database.Organizations.Values.SelectMany(o => o.Departments).Select(n => n.Id).DefaultIfEmpty(0).Max() + 1;

    public int NextTeamId() => database.Organizations.Values.SelectMany(o => o.Teams).Select(n => n.Id).DefaultIfEmpty(0).Max() + 1;

    public IReadOnlyList<Organization> All() => database.Organizations.Values.ToArray();

    public void Add(Organization organization) => database.Organizations.Add(organization.Id, organization);
}

public sealed class RoleCatalog(InMemoryDatabase database) : IRoleCatalog
{
    public IReadOnlyList<RoleReference> SystemRoles() => [new(Domain.Memberships.SystemRoles.Admin, Guid.Parse("20000000-0000-4000-8000-000000000101"), "admin"), new(Domain.Memberships.SystemRoles.Employee, Guid.Parse("20000000-0000-4000-8000-000000000102"), "employee")];

    public IReadOnlyList<RoleReference> JobRoles(int companyId) => database.JobRoles.Where(r => r.CompanyId == companyId).ToArray();

    public IReadOnlyList<RoleReference> WorkSchedules() => database.WorkSchedules.ToArray();

    public int NextJobRoleId() => database.JobRoles.Select(r => r.Id).DefaultIfEmpty(0).Max() + 1;

    public void AddJobRole(RoleReference role) => database.JobRoles.Add(role);
}

public sealed class ProvisioningAccess(InMemoryDatabase database) : IProvisioningAccess
{
    public void Invite(int userId, int companyId) => database.Invitations[userId] = companyId;

    public bool WasInvited(int userId, int companyId) => database.Invitations.GetValueOrDefault(userId) == companyId;

    public int? InvitationOrganization(int userId) => database.Invitations.TryGetValue(userId, out var id) ? id : null;

    public void Grant(int userId, int companyId) => database.ProvisioningGrants.Add((userId, companyId));

    public bool CanProvision(int userId, int companyId) => database.ProvisioningGrants.Contains((userId, companyId));
}

public sealed class UserPresentationCatalog(InMemoryDatabase database) : IUserPresentationCatalog
{
    public UserPresentation? Find(int userId) => database.Presentation.GetValueOrDefault(userId);
}
