using Vacate.Application.Abstractions;
using Vacate.Application.Common;
using Vacate.Application.Leave;
using Vacate.Application.Organizations.Commands;
using Vacate.Domain.Common;
using Vacate.Domain.Organizations;

namespace Vacate.Application.Organizations;

public enum StructureKind
{
    Department, Team
}

public sealed class OrganizationService(IOrganizationRepository organizations, IUserRepository users, IMembershipRepository memberships,
    IRoleCatalog roles, IProvisioningAccess provisioning, IUnitOfWork unitOfWork, AccessPolicy access, RecordMapper mapper, TimeProvider clock, ILeaveRepository leaves)
{
    public IReadOnlyList<OrganizationRecord> List(int actorId) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        return (IReadOnlyList<OrganizationRecord>)organizations.All().Where(o => !o.IsDeleted && access.IsAdmin(actorId, o.Id)).Select(mapper.Organization).ToArray();
    });

    public OrganizationRecord Get(int actorId, Guid guid) => unitOfWork.Execute(() => mapper.Organization(access.RequireAdmin(actorId, guid)));

    public OrganizationSummary Summary(int actorId, Guid guid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireMember(actorId, guid);
        var m = memberships.Current(actorId)!;
        return new OrganizationSummary(org.Id, org.Guid, org.Name, org.WorkWeekDays,
            org.Departments.SingleOrDefault(n => !n.IsDeleted && n.Id == m.Configuration.DepartmentId)?.Name, org.Teams.SingleOrDefault(n => !n.IsDeleted && n.Id == m.Configuration.TeamId)?.Name,
            m.Configuration.TeamId is { } teamId
                ? memberships.ForOrganization(org.Id).Where(member => member.Configuration.TeamId == teamId)
                    .Select(member => users.Find(member.UserId)).Where(user => user is { IsDeleted: false })
                    .Select(user => mapper.Directory(user!)).ToArray()
                : [],
            new SettingsAccessRecord(access.IsAdmin(actorId, org.Id) ? m.SettingsRole is Domain.Memberships.SettingsRole.Owner ? "owner" : m.SettingsRole is Domain.Memberships.SettingsRole.Hr ? "hr" : "admin"
                    : m.SettingsRole.ToString(), access.IsAdmin(actorId, org.Id), org.VacationApprovalRequired(m.Configuration.TeamId, m.Configuration.DepartmentId),
                org.Departments.Where(d => !d.IsDeleted && access.MayConfigureDepartment(actorId, org, d.Id)).Select(RecordMapper.Department).ToArray(),
                org.Teams.Where(t => !t.IsDeleted && access.MayConfigureTeam(actorId, org, t.Id)).Select(t => RecordMapper.Team(org, t)).ToArray()));
    });

    public IReadOnlyList<DirectoryUserRecord> Directory(int actorId, Guid guid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireMember(actorId, guid);
        return (IReadOnlyList<DirectoryUserRecord>)memberships.ForOrganization(org.Id).Select(m => users.Find(m.UserId)).Where(u => u is { IsDeleted: false }).Select(u => mapper.Directory(u!)).ToArray();
    });

    public MemberWorkspace Workspace(int actorId, Guid guid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireMember(actorId, guid);
        var activeMembers = memberships.ForOrganization(org.Id).Where(m => users.Find(m.UserId) is { IsDeleted: false }).ToArray();
        var availability = activeMembers.SelectMany(member => leaves.Requests(org.Id, member.Id)
            .SelectMany(request => request.Request.Dates.Where(date => date.Status is "Approved" or "Pending")
                .Select(date => new MemberAvailability(users.Find(member.UserId)!.Guid, date.Date))))
            .Distinct().OrderBy(date => date.Date).ToArray();
        return new MemberWorkspace(org.Guid, org.Settings.CountryCode,
            org.Departments.Where(d => !d.IsDeleted).Select(RecordMapper.Department).ToArray(),
            org.Teams.Where(t => !t.IsDeleted).Select(t => RecordMapper.Team(org, t)).ToArray(),
            activeMembers.Select(m => mapper.Directory(users.Find(m.UserId)!)).ToArray(), availability);
    });

    public OrganizationReferences References(int actorId, Guid guid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, guid);
        static ReferenceRecord Map(RoleReference r) => new(r.Id, r.Guid, r.Name);
        return new OrganizationReferences(roles.SystemRoles().Select(Map).ToArray(), roles.JobRoles(org.Id).Select(Map).ToArray(), roles.WorkSchedules().Select(Map).ToArray());
    });

    public OrganizationRecord Create(int actorId, CreateOrganization command) => unitOfWork.Execute(() =>
    {
        access.Actor(actorId);
        var membership = memberships.Current(actorId) ?? throw new ServiceException(ServiceError.Forbidden, "Organization administrator required.");
        access.RequireAdmin(actorId, membership.CompanyId);
        var org = new Organization(organizations.NextId(), Guid.NewGuid(), command.Name, command.WorkWeekDays, clock.GetUtcNow());
        organizations.Add(org);
        roles.AddJobRole(new(roles.NextJobRoleId(), Guid.NewGuid(), "Member", org.Id));
        provisioning.Grant(actorId, org.Id);
        return mapper.Organization(org);
    });

    public OrganizationRecord Update(int actorId, UpdateOrganization command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.Guid);
        var settings = org.Settings;
        var updatedSettings = new VacationSettings(command.RequireVacationApproval.Or(settings.RequireVacationApproval),
            command.DepartmentLeadSettingsEnabled.Or(settings.DepartmentLeadSettingsEnabled), command.TeamLeadSettingsEnabled.Or(settings.TeamLeadSettingsEnabled),
            command.CarryoverEnabled.Or(settings.CarryoverEnabled), command.CarryoverYears.Or(settings.CarryoverYears), command.TimeZone.Or(settings.TimeZone), command.CountryCode.Or(settings.CountryCode));
        if (updatedSettings.CountryCode == "GR" && (updatedSettings.CarryoverEnabled != settings.CarryoverEnabled
            || updatedSettings.CarryoverYears != settings.CarryoverYears))
        {
            throw new DomainValidationException("Greek annual carryover uses the read-only 31 March deadline; legacy carryover controls cannot override it.");
        }

        org.Update(command.Name.Or(org.Name), command.WorkWeekDays.Or(org.WorkWeekDays), clock.GetUtcNow(), updatedSettings);
        return mapper.Organization(org);
    });

    public OrganizationRecord RequestDeletion(int actorId, RequestOrganizationDeletion command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.Guid);
        org.RequestDeletion(clock.GetUtcNow());
        return mapper.Organization(org);
    });

    public void Delete(int actorId, DeleteOrganization command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.Guid);
        if (memberships.ForOrganization(org.Id).Any(m => users.Find(m.UserId) is { IsDeleted: false }))
        {
            throw new ServiceException(ServiceError.Conflict, "Remove members before deleting the organization.");
        }

        org.Delete(clock.GetUtcNow());
        return true;
    });

    public IReadOnlyList<object> ListStructure(int actorId, Guid organizationGuid, StructureKind kind) => unitOfWork.Execute(() =>
    {
        var org = access.Organization(organizationGuid);
        if (!access.IsAdmin(actorId, org.Id))
        {
            access.RequireMember(actorId, organizationGuid);
        }

        if (!access.IsAdmin(actorId, org.Id) && !org.Departments.Any(d => !d.IsDeleted && access.MayConfigureDepartment(actorId, org, d.Id))
            && !org.Teams.Any(t => !t.IsDeleted && access.MayConfigureTeam(actorId, org, t.Id)))
        {
            throw new ServiceException(ServiceError.NotFound, "Settings unavailable.");
        }
        return kind == StructureKind.Team ? org.Teams.Where(n => !n.IsDeleted && access.MayConfigureTeam(actorId, org, n.Id)).Select(n => (object)RecordMapper.Team(org, n)).ToArray() :
            (IReadOnlyList<object>)org.Departments.Where(n => !n.IsDeleted && access.MayConfigureDepartment(actorId, org, n.Id)).Select(n => (object)RecordMapper.Department(n)).ToArray();
    });

    public object GetStructure(int actorId, Guid organizationGuid, StructureKind kind, Guid guid) => unitOfWork.Execute(() =>
    {
        var org = access.RequireStructureSettings(actorId, organizationGuid, kind == StructureKind.Team, guid);
        var id = NodeId(org, kind, guid);
        return kind == StructureKind.Team ? (object)RecordMapper.Team(org, org.Team(id)) : RecordMapper.Department(org.Department(id));
    });

    public object CreateStructure(int actorId, CreateStructure command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.OrganizationGuid);
        var now = clock.GetUtcNow();
        return command.Kind == StructureKind.Team ? (object)RecordMapper.Team(org, org.AddTeam(organizations.NextTeamId(), Guid.NewGuid(), command.Name, DepartmentId(org, command.DepartmentId), now)) :
            RecordMapper.Department(org.AddDepartment(organizations.NextDepartmentId(), Guid.NewGuid(), command.Name, now));
    });

    public object UpdateStructure(int actorId, UpdateStructure command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireStructureSettings(actorId, command.OrganizationGuid, command.Kind == StructureKind.Team, command.Guid);
        if (!access.IsAdmin(actorId, org.Id) && (command.Name.IsSpecified || command.DepartmentId.IsSpecified))
        {
            throw new ServiceException(ServiceError.NotFound, "Only vacation approval settings are available.");
        }
        var id = NodeId(org, command.Kind, command.Guid);
        var now = clock.GetUtcNow();
        if (command.Kind == StructureKind.Department)
        {
            org.RenameDepartment(id, command.Name.Or(org.Department(id).Name), now);
            if (command.RequireVacationApproval.IsSpecified)
            {
                org.SetDepartmentApproval(id, command.RequireVacationApproval.Value, now);
            }

            return (object)RecordMapper.Department(org.Department(id));
        }
        var team = org.Team(id);
        var parent = command.DepartmentId.IsSpecified ? DepartmentId(org, command.DepartmentId.Value) : team.DepartmentId;
        if (parent != team.DepartmentId && memberships.ForOrganization(org.Id).Any(m => m.Configuration.TeamId == id))
        {
            throw new ServiceException(ServiceError.Conflict, "Move members before changing the team department.");
        }

        org.UpdateTeam(id, command.Name.Or(team.Name), parent, now);
        if (command.RequireVacationApproval.IsSpecified)
        {
            org.SetTeamApproval(id, command.RequireVacationApproval.Value, now);
        }

        return RecordMapper.Team(org, team);
    });

    public object RequestStructureDeletion(int actorId, RequestStructureDeletion command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.OrganizationGuid);
        var id = NodeId(org, command.Kind, command.Guid);
        if (command.Kind == StructureKind.Team)
        {
            org.RequestTeamDeletion(id, clock.GetUtcNow());
            return (object)RecordMapper.Team(org, org.Team(id));
        }
        org.RequestDepartmentDeletion(id, clock.GetUtcNow());
        return RecordMapper.Department(org.Department(id));
    });

    public void DeleteStructure(int actorId, DeleteStructure command) => unitOfWork.Execute(() =>
    {
        var org = access.RequireAdmin(actorId, command.OrganizationGuid);
        var id = NodeId(org, command.Kind, command.Guid);
        if (memberships.ForOrganization(org.Id).Any(m => (command.Kind == StructureKind.Team ? m.Configuration.TeamId : m.Configuration.DepartmentId) == id))
        {
            throw new ServiceException(ServiceError.Conflict, "Remove member references before deleting this structure node.");
        }

        if (command.Kind == StructureKind.Team)
        {
            org.DeleteTeam(id, clock.GetUtcNow());
        }
        else
        {
            org.DeleteDepartment(id, clock.GetUtcNow());
        }

        return true;
    });

    private static int? DepartmentId(Organization org, Guid? guid) => guid is null ? null : org.Departments.SingleOrDefault(n => !n.IsDeleted && n.Guid == guid)?.Id ?? throw new DomainValidationException("Department unavailable in this organization.");

    private static int NodeId(Organization org, StructureKind kind, Guid guid) => (kind == StructureKind.Team ? org.Teams.Where(n => !n.IsDeleted && n.Guid == guid).Select(n => (int?)n.Id).SingleOrDefault() :
        org.Departments.Where(n => !n.IsDeleted && n.Guid == guid).Select(n => (int?)n.Id).SingleOrDefault()) ?? throw new ServiceException(ServiceError.NotFound, "Structure node unavailable.");
}

// Shared availability deliberately excludes request IDs, types, status and private membership/profile fields.
public sealed record MemberAvailability(Guid UserGuid, DateOnly Date);
public sealed record MemberWorkspace(Guid CompanyId, string? CountryCode, IReadOnlyList<DepartmentRecord> Departments,
    IReadOnlyList<TeamRecord> Teams, IReadOnlyList<DirectoryUserRecord> People, IReadOnlyList<MemberAvailability> Availability);
