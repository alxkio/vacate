using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Api.Http;
using Vacate.Application.Common;
using Vacate.Application.Identity;
using Vacate.Application.Memberships;
using Vacate.Application.Memberships.Commands;
using Vacate.Application.Organizations;
using Vacate.Application.Organizations.Commands;
using Vacate.Domain.Common;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class OrganizationFunctions(
    OrganizationService organizations,
    MembershipService memberships,
    AuthenticationService authentication)
{
    [Function("ListOrganizations")]
    public Task<IActionResult> List([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations")] HttpRequest request) =>
        WithActor(request, (_, actor) => Ok(organizations.List(actor)));

    [Function("CreateOrganization")]
    public Task<IActionResult> Create([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations")] HttpRequest request) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body, "name", "workWeekDays");
            var organization = organizations.Create(actor, new CreateOrganization(Required<string>(body, "name"), Field<int>(body, "workWeekDays").Or(5)));
            return Created($"organizations/{organization.Guid}", organization);
        });

    [Function("GetOrganization")]
    public Task<IActionResult> Get([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => Ok(organizations.Get(actor, Id(companyId))));

    [Function("UpdateOrganization")]
    public Task<IActionResult> Update([HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "organizations/{companyId}")] HttpRequest request, string companyId) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body, "name", "workWeekDays");
            return Ok(organizations.Update(actor, new UpdateOrganization(Id(companyId), Field<string>(body, "name"), Field<int>(body, "workWeekDays"))));
        });

    [Function("DeleteOrganization")]
    public Task<IActionResult> Delete([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{companyId}")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) =>
        {
            organizations.Delete(actor, new DeleteOrganization(Id(companyId)));
            return new NoContentResult();
        });

    [Function("GetOrganizationSummary")]
    public Task<IActionResult> Summary([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/summary")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => Ok(organizations.Summary(actor, Id(companyId))));

    [Function("GetOrganizationDirectory")]
    public Task<IActionResult> Directory([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/directory")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => Ok(organizations.Directory(actor, Id(companyId))));

    [Function("GetOrganizationRoles")]
    public Task<IActionResult> Roles([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/roles")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => Ok(organizations.References(actor, Id(companyId))));

    [Function("RequestOrganizationDeletion")]
    public Task<IActionResult> RequestDeletion([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/deletion-request")] HttpRequest request, string companyId) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body);
            return Ok(organizations.RequestDeletion(actor, new RequestOrganizationDeletion(Id(companyId))));
        });

    [Function("ListMemberships")]
    public Task<IActionResult> ListMemberships([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/memberships")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => Ok(memberships.List(actor, Id(companyId))));

    [Function("GetMembership")]
    public Task<IActionResult> GetMembership([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/memberships/{userId}")] HttpRequest request, string companyId, string userId) =>
        WithActor(request, (_, actor) => Ok(memberships.Get(actor, Id(companyId), Id(userId))));

    [Function("CreateMembership")]
    public Task<IActionResult> CreateMembership([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/memberships/{userId}")] HttpRequest request, string companyId, string userId) =>
        WithActor(request, (body, actor) =>
        {
            var organizationId = Id(companyId);
            var accountId = Id(userId);
            return Created($"organizations/{organizationId}/memberships/{accountId}", memberships.Create(actor, new CreateMembership(organizationId, accountId, ReadMembershipChanges(body))));
        });

    [Function("UpdateMembership")]
    public Task<IActionResult> UpdateMembership([HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "organizations/{companyId}/memberships/{userId}")] HttpRequest request, string companyId, string userId) =>
        WithActor(request, (body, actor) => Ok(memberships.Update(actor, new UpdateMembership(Id(companyId), Id(userId), ReadMembershipChanges(body)))));

    [Function("DeleteMembership")]
    public Task<IActionResult> DeleteMembership([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{companyId}/memberships/{userId}")] HttpRequest request, string companyId, string userId) =>
        WithActor(request, (_, actor) =>
        {
            memberships.Delete(actor, new DeleteMembership(Id(companyId), Id(userId)));
            return new NoContentResult();
        });

    [Function("RequestMembershipDeletion")]
    public Task<IActionResult> RequestMembershipDeletion([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/memberships/{userId}/deletion-request")] HttpRequest request, string companyId, string userId) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body);
            return Ok(memberships.RequestDeletion(actor, new RequestMembershipDeletion(Id(companyId), Id(userId))));
        });

    [Function("ListTeams")]
    public Task<IActionResult> ListTeams([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/teams")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => ListStructure(actor, companyId, StructureKind.Team));

    [Function("CreateTeam")]
    public Task<IActionResult> CreateTeam([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/teams")] HttpRequest request, string companyId) =>
        WithActor(request, (body, actor) => CreateStructure(actor, body, companyId, StructureKind.Team));

    [Function("GetTeam")]
    public Task<IActionResult> GetTeam([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/teams/{nodeId}")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (_, actor) => GetStructure(actor, companyId, nodeId, StructureKind.Team));

    [Function("UpdateTeam")]
    public Task<IActionResult> UpdateTeam([HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "organizations/{companyId}/teams/{nodeId}")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (body, actor) => UpdateStructure(actor, body, companyId, nodeId, StructureKind.Team));

    [Function("DeleteTeam")]
    public Task<IActionResult> DeleteTeam([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{companyId}/teams/{nodeId}")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (_, actor) => DeleteStructure(actor, companyId, nodeId, StructureKind.Team));

    [Function("RequestTeamDeletion")]
    public Task<IActionResult> RequestTeamDeletion([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/teams/{nodeId}/deletion-request")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (body, actor) => RequestStructureDeletion(actor, body, companyId, nodeId, StructureKind.Team));

    [Function("ListDepartments")]
    public Task<IActionResult> ListDepartments([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/departments")] HttpRequest request, string companyId) =>
        WithActor(request, (_, actor) => ListStructure(actor, companyId, StructureKind.Department));

    [Function("CreateDepartment")]
    public Task<IActionResult> CreateDepartment([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/departments")] HttpRequest request, string companyId) =>
        WithActor(request, (body, actor) => CreateStructure(actor, body, companyId, StructureKind.Department));

    [Function("GetDepartment")]
    public Task<IActionResult> GetDepartment([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/departments/{nodeId}")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (_, actor) => GetStructure(actor, companyId, nodeId, StructureKind.Department));

    [Function("UpdateDepartment")]
    public Task<IActionResult> UpdateDepartment([HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "organizations/{companyId}/departments/{nodeId}")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (body, actor) => UpdateStructure(actor, body, companyId, nodeId, StructureKind.Department));

    [Function("DeleteDepartment")]
    public Task<IActionResult> DeleteDepartment([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{companyId}/departments/{nodeId}")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (_, actor) => DeleteStructure(actor, companyId, nodeId, StructureKind.Department));

    [Function("RequestDepartmentDeletion")]
    public Task<IActionResult> RequestDepartmentDeletion([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/departments/{nodeId}/deletion-request")] HttpRequest request, string companyId, string nodeId) =>
        WithActor(request, (body, actor) => RequestStructureDeletion(actor, body, companyId, nodeId, StructureKind.Department));

    private Task<IActionResult> WithActor(HttpRequest request, Func<JsonObject, int, IActionResult> operation) =>
        Execute(request, body => operation(body, authentication.RequireActor(Token(request))));

    private IActionResult ListStructure(int actor, string companyId, StructureKind kind) =>
        Ok(organizations.ListStructure(actor, Id(companyId), kind));

    private IActionResult CreateStructure(int actor, JsonObject body, string companyId, StructureKind kind)
    {
        Allow(body, kind == StructureKind.Team ? ["name", "departmentId"] : ["name"]);
        var organizationId = Id(companyId);
        var node = organizations.CreateStructure(actor, new CreateStructure(organizationId, kind, Required<string>(body, "name"), Field<Guid?>(body, "departmentId").Or(null)));
        var nodeId = node is TeamRecord team ? team.Guid : ((DepartmentRecord)node).Guid;
        var name = kind == StructureKind.Team ? "teams" : "departments";
        return Created($"organizations/{organizationId}/{name}/{nodeId}", node);
    }

    private IActionResult GetStructure(int actor, string companyId, string nodeId, StructureKind kind) =>
        Ok(organizations.GetStructure(actor, Id(companyId), kind, Id(nodeId)));

    private IActionResult UpdateStructure(int actor, JsonObject body, string companyId, string nodeId, StructureKind kind)
    {
        Allow(body, kind == StructureKind.Team ? ["name", "departmentId"] : ["name"]);
        return Ok(organizations.UpdateStructure(actor, new UpdateStructure(Id(companyId), kind, Id(nodeId), Field<string>(body, "name"), Field<Guid?>(body, "departmentId"))));
    }

    private IActionResult DeleteStructure(int actor, string companyId, string nodeId, StructureKind kind)
    {
        organizations.DeleteStructure(actor, new DeleteStructure(Id(companyId), kind, Id(nodeId)));
        return new NoContentResult();
    }

    private IActionResult RequestStructureDeletion(int actor, JsonObject body, string companyId, string nodeId, StructureKind kind)
    {
        Allow(body);
        return Ok(organizations.RequestStructureDeletion(actor, new RequestStructureDeletion(Id(companyId), kind, Id(nodeId))));
    }
}
