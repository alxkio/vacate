using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Users.Commands;
using Vacate.Domain.Users;

namespace Vacate.Application.Users;

public sealed class UserService(IUserRepository users, IMembershipRepository memberships, IProvisioningAccess provisioning,
    ISessionStore sessions, IUnitOfWork unitOfWork, AccessPolicy access, RecordMapper mapper, TimeProvider clock)
{
    public IReadOnlyList<DirectoryUserRecord> List(int actorId) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        var companyId = memberships.Current(actorId)?.CompanyId ?? throw new ServiceException(ServiceError.NotFound, "Organization unavailable.");
        access.RequireMember(actorId, companyId);
        return (IReadOnlyList<DirectoryUserRecord>)memberships.ForOrganization(companyId).Select(m => users.Find(m.UserId)).Where(u => u is { IsDeleted: false }).Select(u => mapper.Directory(u!)).ToArray();
    });

    public object Get(int actorId, Guid guid) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        var user = access.User(guid);
        if (actorId == user.Id)
        {
            return (object)mapper.User(user);
        }

        var companyId = access.AssignmentScope(user.Id);
        if (!access.IsAdmin(actorId, companyId) && memberships.Current(actorId)?.CompanyId != companyId)
        {
            throw new ServiceException(ServiceError.NotFound, "User unavailable.");
        }

        return mapper.Directory(user);
    });

    public AccountCreated Create(int actorId, CreateUser command) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        var org = command.CompanyId is { } companyGuid ? access.RequireAdmin(actorId, companyGuid) : access.RequireAdmin(actorId,
            memberships.Current(actorId)?.CompanyId ?? throw new ServiceException(ServiceError.Forbidden, "Company administrator required."));
        var user = new User(users.NextId(), Guid.NewGuid(), UniqueUsername(command.Username), new(command.FirstName, command.MiddleName, command.LastName),
            command.Gender, new(command.Married, command.DependentChildren, command.SoleCare), clock.GetUtcNow());
        users.Add(user);
        provisioning.Invite(user.Id, org.Id);
        return new AccountCreated(user.Id, user.Guid, user.Username, user.CreatedAt);
    });

    public UserRecord Update(int actorId, UpdateUser command) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        var user = access.User(command.Guid);
        if (actorId != user.Id)
        {
            var company = access.AssignmentScope(user.Id);
            if (!access.IsAdmin(actorId, company) && memberships.Current(actorId)?.CompanyId != company)
            {
                throw new ServiceException(ServiceError.NotFound, "User unavailable.");
            }

            throw new ServiceException(ServiceError.Forbidden, "Only the account holder can edit profile fields.");
        }
        var name = new PersonName(command.FirstName.Or(user.Name.FirstName), command.MiddleName.Or(user.Name.MiddleName), command.LastName.Or(user.Name.LastName));
        var family = new FamilyInformation(command.Married.Or(user.Family.Married), command.DependentChildren.Or(user.Family.DependentChildren), command.SoleCare.Or(user.Family.SoleCare));
        user.UpdateProfile(name, command.Gender.Or(user.Gender), family, clock.GetUtcNow());
        return mapper.User(user);
    });

    public AccountState UpdateAccount(int actorId, UpdateUserAccount command) => unitOfWork.Execute(() =>
    {
        var user = access.User(command.Guid);
        access.RequireAdmin(actorId, access.AssignmentScope(user.Id));
        var username = UniqueUsername(command.Username.Or(user.Username), user.Id);
        var status = command.Status.Or(user.Status);
        if (status == "disabled")
        {
            access.EnsureMayRemoveAdmin(user, memberships.Current(user.Id));
        }

        user.UpdateAccount(username, status, clock.GetUtcNow());
        if (status == "disabled")
        {
            sessions.RevokeForUser(user.Id);
        }

        return new AccountState(user.Id, user.Guid, user.Username, user.Status, user.UpdatedAt);
    });

    public DeletionRequest RequestDeletion(int actorId, RequestUserDeletion command) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        var user = access.User(command.Guid);
        if (actorId != user.Id)
        {
            access.RequireAdmin(actorId, access.AssignmentScope(user.Id));
        }

        user.RequestDeletion(clock.GetUtcNow());
        return new DeletionRequest(user.Id, user.Guid, user.DeleteRequestedAt);
    });

    public void Delete(int actorId, DeleteUser command) => unitOfWork.Execute(() =>
    {
        var user = access.User(command.Guid);
        access.RequireAdmin(actorId, access.AssignmentScope(user.Id));
        var member = memberships.Current(user.Id);
        access.EnsureMayRemoveAdmin(user, member);
        access.EnsureNotManager(user);
        var now = clock.GetUtcNow();
        member?.Delete(now);
        user.Delete(now);
        sessions.RevokeForUser(user.Id);
        return true;
    });

    private string UniqueUsername(string username, int? except = null)
    {
        var normalized = User.NormalizeUsername(username);
        if (users.All().Any(u => u.Id != except && u.Username == normalized))
        {
            throw new ServiceException(ServiceError.Conflict, "Username is reserved.");
        }

        return normalized;
    }
}
