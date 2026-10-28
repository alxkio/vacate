using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Memberships.Commands;
using Vacate.Domain.Common;
using Vacate.Domain.Memberships;

namespace Vacate.Application.Memberships;

public sealed class MembershipService(IUserRepository users, IMembershipRepository memberships, IRoleCatalog roles,
    IProvisioningAccess provisioning, IUnitOfWork unitOfWork, AccessPolicy access, RecordMapper mapper, TimeProvider clock)
{
    public IReadOnlyList<MembershipDetails> List(int actorId, Guid companyGuid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, companyGuid);
        return (IReadOnlyList<MembershipDetails>)memberships.ForOrganization(org.Id).Where(m => users.Find(m.UserId) is { IsDeleted: false })
            .Select(m => mapper.Member(users.Find(m.UserId)!, m)).ToArray();
    });

    public MembershipDetails Get(int actorId, Guid companyGuid, Guid userGuid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, companyGuid);
        var user = access.User(userGuid);
        return mapper.Member(user, Current(org.Id, user.Id));
    });

    public MembershipDetails Create(int actorId, CreateMembership command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.CompanyGuid);
        var user = access.User(command.UserGuid);
        if (memberships.Current(user.Id) is { } assigned)
        {
            if (assigned.CompanyId != org.Id)
            {
                throw new ServiceException(ServiceError.NotFound, "Membership unavailable.");
            }

            throw new ServiceException(ServiceError.Conflict, "A membership is already assigned.");
        }
        if (!provisioning.WasInvited(user.Id, org.Id))
        {
            throw new ServiceException(ServiceError.NotFound, "Invitee unavailable in this company.");
        }

        var configuration = Resolve(org, command.Changes, new(0, 0));
        ValidateReferences(org.Id, user.Id, configuration);
        var now = clock.GetUtcNow();
        // Keep the allocation unresolved until a trusted experience policy is configured.
        var balance = new AnnualBalance(
            periodStart: new(now.Year, 1, 1),
            periodEnd: new(now.Year, 12, 31),
            asOf: DateOnly.FromDateTime(now.UtcDateTime),
            policyVersion: null,
            policyMinimum: null,
            customAllocation: command.Changes.CustomAllocation.Or(null),
            used: 0,
            pending: 0);
        var member = new Membership(
            memberships.NextId(), Guid.NewGuid(), user.Id, org.Id, configuration, balance, now);

        memberships.Add(member);
        return mapper.Member(user, member);
    });

    public MembershipDetails Update(int actorId, UpdateMembership command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.CompanyGuid);
        var user = access.User(command.UserGuid);
        var member = Current(org.Id, user.Id);
        var candidate = Resolve(org, command.Changes, member.Configuration);
        ValidateReferences(org.Id, user.Id, candidate);
        if (member.IsAdmin && candidate.SystemRoleId != SystemRoles.Admin)
        {
            access.EnsureMayRemoveAdmin(user, member);
        }

        member.Update(candidate, command.Changes.CustomAllocation.Or(member.Balance.CustomAllocation), clock.GetUtcNow());
        return mapper.Member(user, member);
    });

    public MembershipDetails RequestDeletion(int actorId, RequestMembershipDeletion command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.CompanyGuid);
        var user = access.User(command.UserGuid);
        var member = Current(org.Id, user.Id);
        member.RequestDeletion(clock.GetUtcNow());
        return mapper.Member(user, member);
    });

    public void Delete(int actorId, DeleteMembership command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.CompanyGuid);
        var user = access.User(command.UserGuid);
        var member = Current(org.Id, user.Id);
        access.EnsureMayRemoveAdmin(user, member);
        access.EnsureNotManager(user);
        member.Delete(clock.GetUtcNow());
        return true;
    });

    private Membership Current(int companyId, int userId) =>
        memberships.Current(userId) is { } member && member.CompanyId == companyId
            ? member
            : throw new ServiceException(ServiceError.NotFound, "Membership unavailable.");

    private MembershipConfiguration Resolve(Domain.Organizations.Organization org, MembershipChanges c, MembershipConfiguration old)
    {
        static int Role(Change<Guid> change, int prior, IReadOnlyList<RoleReference> list) =>
            !change.IsSpecified
                ? prior
                : list.SingleOrDefault(role => role.Guid == change.Value)?.Id
                    ?? throw new DomainValidationException("Unknown company role.");

        int? Department(Change<Guid?> change, int? prior) =>
            !change.IsSpecified ? prior : change.Value is null ? null
                : org.Departments.SingleOrDefault(department => !department.IsDeleted && department.Guid == change.Value)?.Id
                    ?? throw new DomainValidationException("Department unavailable in this organization.");

        int? Team(Change<Guid?> change, int? prior) =>
            !change.IsSpecified ? prior : change.Value is null ? null
                : org.Teams.SingleOrDefault(team => !team.IsDeleted && team.Guid == change.Value)?.Id
                    ?? throw new DomainValidationException("Team unavailable in this organization.");

        int? Manager(Change<Guid?> change, int? prior) =>
            !change.IsSpecified ? prior : change.Value is null ? null
                : users.FindByGuid(change.Value.Value)?.Id
                    ?? throw new DomainValidationException("Manager unavailable in this organization.");

        int? Schedule(Change<Guid?> change, int? prior) =>
            !change.IsSpecified ? prior : change.Value is null ? null
                : roles.WorkSchedules().SingleOrDefault(schedule => schedule.Guid == change.Value)?.Id
                    ?? throw new DomainValidationException("Unknown work schedule.");
        if (c.HolidayCalendarId is { IsSpecified: true, Value: not null } || c.LeavePolicyId is { IsSpecified: true, Value: not null })
        {
            throw new DomainValidationException("No calendar or experience policy is configured.");
        }

        return new MembershipConfiguration(
            SystemRoleId: Role(c.SystemRoleId, old.SystemRoleId, roles.SystemRoles()),
            JobRoleId: Role(c.JobRoleId, old.JobRoleId, roles.JobRoles(org.Id)),
            DepartmentId: Department(c.DepartmentId, old.DepartmentId),
            TeamId: Team(c.TeamId, old.TeamId),
            ManagerUserId: Manager(c.ManagerUserId, old.ManagerUserId),
            HireDate: c.HireDate.Or(old.HireDate),
            EmploymentEndDate: c.EmploymentEndDate.Or(old.EmploymentEndDate),
            PriorService: c.PriorService.Or(old.PriorService),
            WorkScheduleId: Schedule(c.WorkScheduleId, old.WorkScheduleId),
            HolidayCalendarId: null,
            LeavePolicyId: null);
    }

    private void ValidateReferences(int companyId, int userId, MembershipConfiguration c)
    {
        c.Validate();
        var org = access.Organization(companyId);
        org.ValidateDepartment(c.DepartmentId);
        if (c.TeamId is { } teamId && c.DepartmentId is not null && org.Team(teamId).DepartmentId != c.DepartmentId)
        {
            throw new DomainValidationException("Team does not belong to this department.");
        }

        if (c.ManagerUserId is { } managerId)
        {
            if (users.Find(managerId) is not { IsDeleted: false } manager || memberships.Current(managerId)?.CompanyId != companyId)
            {
                throw new DomainValidationException("Manager unavailable in this organization.");
            }

            if (manager.Id == userId)
            {
                throw new DomainValidationException("An employee cannot manage themselves.");
            }
        }
    }
}
