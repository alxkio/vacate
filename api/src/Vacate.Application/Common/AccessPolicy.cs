using Vacate.Application.Abstractions;
using Vacate.Domain.Memberships;
using Vacate.Domain.Organizations;
using Vacate.Domain.Users;

namespace Vacate.Application.Common;

public sealed class AccessPolicy(IUserRepository users, IMembershipRepository memberships,
    IOrganizationRepository organizations, IProvisioningAccess provisioning)
{
    public User User(Guid guid) => users.FindByGuid(guid) is { IsDeleted: false } user ? user : throw new ServiceException(ServiceError.NotFound, "User unavailable.");

    public User Actor(int id) => users.Find(id) is { CanSignIn: true } user ? user : throw new ServiceException(ServiceError.Unauthenticated, "Sign in again.");

    public Organization Organization(int id) => organizations.Find(id) is { IsDeleted: false } org ? org : throw new ServiceException(ServiceError.NotFound, "Organization unavailable.");

    public Organization Organization(Guid guid) => organizations.FindByGuid(guid) is { IsDeleted: false } org ? org : throw new ServiceException(ServiceError.NotFound, "Organization unavailable.");

    public bool IsAdmin(int actorId, int companyId)
    {
        if (users.Find(actorId)?.CanSignIn != true || organizations.Find(companyId) is not { IsDeleted: false })
        {
            return false;
        }

        var m = memberships.Current(actorId);
        return m?.CompanyId == companyId && m.IsAdmin || provisioning.CanProvision(actorId, companyId);
    }

    public Organization RequireAdmin(int actorId, Guid companyGuid) => RequireAdmin(actorId, Organization(companyGuid).Id);

    public Organization RequireAdmin(int actorId, int companyId)
    {
        Actor(actorId);
        if (!IsAdmin(actorId, companyId))
        {
            throw new ServiceException(ServiceError.NotFound, "Organization unavailable.");
        }

        return Organization(companyId);
    }

    public Organization RequireMember(int actorId, Guid companyGuid) => RequireMember(actorId, Organization(companyGuid).Id);

    public Organization RequireMember(int actorId, int companyId)
    {
        Actor(actorId);
        if (memberships.Current(actorId)?.CompanyId != companyId)
        {
            throw new ServiceException(ServiceError.NotFound, "Organization unavailable.");
        }

        return Organization(companyId);
    }

    public bool MayConfigureDepartment(int actorId, Organization org, int departmentId)
    {
        if (IsAdmin(actorId, org.Id))
        {
            return true;
        }

        var member = memberships.Current(actorId);
        return users.Find(actorId)?.CanSignIn == true && member?.CompanyId == org.Id
            && org.Settings.DepartmentLeadSettingsEnabled && member.SettingsRole == SettingsRole.DepartmentLead
            && member.Configuration.DepartmentId == departmentId;
    }

    public bool MayConfigureTeam(int actorId, Organization org, int teamId)
    {
        if (IsAdmin(actorId, org.Id))
        {
            return true;
        }

        var member = memberships.Current(actorId);
        var team = org.Teams.SingleOrDefault(t => !t.IsDeleted && t.Id == teamId);
        return users.Find(actorId)?.CanSignIn == true && member?.CompanyId == org.Id && team is not null
            && (org.Settings.TeamLeadSettingsEnabled && member.SettingsRole == SettingsRole.TeamLead && member.Configuration.TeamId == teamId
                || org.Settings.DepartmentLeadSettingsEnabled && member.SettingsRole == SettingsRole.DepartmentLead
                && member.Configuration.DepartmentId is not null && member.Configuration.DepartmentId == team.DepartmentId);
    }

    public Organization RequireStructureSettings(int actorId, Guid organizationGuid, bool team, Guid nodeGuid)
    {
        var org = Organization(organizationGuid);
        Actor(actorId);
        var allowed = team
            ? org.Teams.Any(t => !t.IsDeleted && t.Guid == nodeGuid && MayConfigureTeam(actorId, org, t.Id))
            : org.Departments.Any(d => !d.IsDeleted && d.Guid == nodeGuid && MayConfigureDepartment(actorId, org, d.Id));
        return allowed ? org : throw new ServiceException(ServiceError.NotFound, "Settings unavailable.");
    }

    public int AssignmentScope(int userId) => memberships.Current(userId)?.CompanyId ?? provisioning.InvitationOrganization(userId)
        ?? throw new ServiceException(ServiceError.Forbidden, "Company administrator required.");

    public void EnsureMayRemoveAdmin(User target, Membership? member)
    {
        if (!target.CanSignIn || member?.IsAdmin != true)
        {
            return;
        }

        if (memberships.ForOrganization(member.CompanyId).Count(m => m.IsAdmin && users.Find(m.UserId)?.CanSignIn == true) < 2)
        {
            throw new ServiceException(ServiceError.Conflict, "Keep an active organization administrator.");
        }
    }

    public void EnsureNotManager(User target)
    {
        if (users.All().Where(u => !u.IsDeleted && u.Id != target.Id).Any(u => memberships.Current(u.Id)?.Configuration.ManagerUserId == target.Id))
        {
            throw new ServiceException(ServiceError.Conflict, "Reassign reports before removing their manager.");
        }
    }
}
