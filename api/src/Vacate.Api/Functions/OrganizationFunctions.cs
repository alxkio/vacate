using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Application.Identity;
using Vacate.Application.Memberships;
using Vacate.Application.Memberships.Commands;
using Vacate.Application.Organizations;
using Vacate.Application.Organizations.Commands;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class OrganizationFunctions(OrganizationService organizations, MembershipService memberships, AuthenticationService authentication)
{
    [Function("Organizations")]
    public Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "patch", "delete", Route = "organizations/{*path}")] HttpRequest request, string? path) => Execute(request, body =>
    {
        var actor = authentication.RequireActor(Token(request));
        var parts = Path(path);
        var method = request.Method;
        if (parts.Length == 0)
        {
            if (method == "GET")
            {
                return Ok(organizations.List(actor));
            }

            if (method == "POST")
            {
                Allow(body, "name", "workWeekDays");
                var org = organizations.Create(actor, new CreateOrganization(Required<string>(body, "name"), Field<int>(body, "workWeekDays").Or(5)));
                return Created($"organizations/{org.Guid}", org);
            }
            throw MethodUnavailable();
        }
        var companyId = Id(parts[0]);
        if (parts.Length == 1)
        {
            if (method == "GET")
            {
                return Ok(organizations.Get(actor, companyId));
            }

            if (method == "PATCH")
            {
                Allow(body, "name", "workWeekDays");
                return Ok(organizations.Update(actor, new UpdateOrganization(companyId, Field<string>(body, "name"), Field<int>(body, "workWeekDays"))));
            }
            if (method == "DELETE")
            {
                organizations.Delete(actor, new DeleteOrganization(companyId));
                return new NoContentResult();
            }
            throw MethodUnavailable();
        }
        if (parts.Length == 2)
        {
            if (parts[1] == "summary" && method == "GET")
            {
                return Ok(organizations.Summary(actor, companyId));
            }

            if (parts[1] == "directory" && method == "GET")
            {
                return Ok(organizations.Directory(actor, companyId));
            }

            if (parts[1] == "roles" && method == "GET")
            {
                return Ok(organizations.References(actor, companyId));
            }

            if (parts[1] == "deletion-request" && method == "POST")
            {
                Allow(body);
                return Ok(organizations.RequestDeletion(actor, new RequestOrganizationDeletion(companyId)));
            }
        }
        if (parts[1] == "memberships")
        {
            if (parts.Length == 2 && method == "GET")
            {
                return Ok(memberships.List(actor, companyId));
            }

            if (parts.Length < 3)
            {
                throw MethodUnavailable();
            }

            var userId = Id(parts[2]);
            if (parts.Length == 3)
            {
                if (method == "GET")
                {
                    return Ok(memberships.Get(actor, companyId, userId));
                }

                if (method == "POST")
                {
                    return Created($"organizations/{companyId}/memberships/{userId}", memberships.Create(actor, new CreateMembership(companyId, userId, ReadMembershipChanges(body))));
                }

                if (method == "PATCH")
                {
                    return Ok(memberships.Update(actor, new UpdateMembership(companyId, userId, ReadMembershipChanges(body))));
                }

                if (method == "DELETE")
                {
                    memberships.Delete(actor, new DeleteMembership(companyId, userId));
                    return new NoContentResult();
                }
            }
            if (parts.Length == 4 && parts[3] == "deletion-request" && method == "POST")
            {
                Allow(body);
                return Ok(memberships.RequestDeletion(actor, new RequestMembershipDeletion(companyId, userId)));
            }
            throw MethodUnavailable();
        }
        if (parts[1] is not ("teams" or "departments"))
        {
            throw MethodUnavailable();
        }

        var kind = parts[1] == "teams" ? StructureKind.Team : StructureKind.Department;
        if (parts.Length == 2)
        {
            if (method == "GET")
            {
                return Ok(organizations.ListStructure(actor, companyId, kind));
            }

            if (method == "POST")
            {
                Allow(body, kind == StructureKind.Team ? ["name", "departmentId"] : ["name"]);
                var node = organizations.CreateStructure(actor, new CreateStructure(companyId, kind, Required<string>(body, "name"), Field<Guid?>(body, "departmentId").Or(null)));
                var nodeId = node is Vacate.Application.Common.TeamRecord team ? team.Guid : ((Vacate.Application.Common.DepartmentRecord)node).Guid;
                return Created($"organizations/{companyId}/{parts[1]}/{nodeId}", node);
            }
            throw MethodUnavailable();
        }
        var id = Id(parts[2]);
        if (parts.Length == 3)
        {
            if (method == "GET")
            {
                return Ok(organizations.GetStructure(actor, companyId, kind, id));
            }

            if (method == "PATCH")
            {
                Allow(body, kind == StructureKind.Team ? ["name", "departmentId"] : ["name"]);
                return Ok(organizations.UpdateStructure(actor, new UpdateStructure(companyId, kind, id, Field<string>(body, "name"), Field<Guid?>(body, "departmentId"))));
            }
            if (method == "DELETE")
            {
                organizations.DeleteStructure(actor, new DeleteStructure(companyId, kind, id));
                return new NoContentResult();
            }
        }
        if (parts.Length == 4 && parts[3] == "deletion-request" && method == "POST")
        {
            Allow(body);
            return Ok(organizations.RequestStructureDeletion(actor, new RequestStructureDeletion(companyId, kind, id)));
        }
        throw MethodUnavailable();
    });
}
