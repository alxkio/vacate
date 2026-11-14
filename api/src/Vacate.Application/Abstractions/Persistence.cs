using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Application.Abstractions;

public interface IUserRepository
{
    User? Find(int id);

    User? FindByGuid(Guid guid);

    IReadOnlyList<User> All();

    int NextId();

    void Add(User user);
}

public interface IMembershipRepository
{
    Membership? Current(int userId);

    IReadOnlyList<Membership> History(int userId);

    IReadOnlyList<Membership> ForOrganization(int organizationId);

    int NextId();

    void Add(Membership membership);
}

public interface IOrganizationRepository
{
    Organization? Find(int id);

    Organization? FindByGuid(Guid guid);

    IReadOnlyList<Organization> All();

    int NextId();

    int NextDepartmentId();

    int NextTeamId();

    void Add(Organization organization);
}

public sealed record RoleReference(int Id, Guid Guid, string Name, int? CompanyId = null);

public interface IRoleCatalog
{
    IReadOnlyList<RoleReference> SystemRoles();

    IReadOnlyList<RoleReference> JobRoles(int companyId);

    IReadOnlyList<RoleReference> WorkSchedules();

    int NextJobRoleId();

    void AddJobRole(RoleReference role);
}

public interface IProvisioningAccess
{
    void Invite(int userId, int organizationId);

    bool WasInvited(int userId, int organizationId);

    int? InvitationOrganization(int userId);

    void Grant(int userId, int organizationId);

    bool CanProvision(int userId, int organizationId);
}

public interface IUnitOfWork
{
    T Execute<T>(Func<T> operation);
}

public interface ICredentialValidator
{
    bool Enabled { get; }
    int? Validate(string username, string password);

    IReadOnlyList<DevelopmentAccount> Accounts() => [];
}

public sealed record SessionTicket(string AccessToken, DateTimeOffset ExpiresAt);

public interface ISessionStore
{
    SessionTicket Issue(int userId, DateTimeOffset expiresAt);

    int? Resolve(string token, DateTimeOffset now);

    void Revoke(string token);

    void RevokeForUser(int userId);
}

public sealed record DevelopmentAccount(string Id, string Name, string Label, string Team);
