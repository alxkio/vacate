using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Api.Http;
using Vacate.Application.Identity;
using Vacate.Application.Users;
using Vacate.Application.Users.Commands;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class UserFunctions(UserService users, AuthenticationService authentication)
{
    [Function("Users")]
    public Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "patch", "delete", Route = "users/{*path}")] HttpRequest request, string? path) => Execute(request, body =>
    {
        var actor = authentication.RequireActor(Token(request));
        var parts = Path(path);
        var method = request.Method;
        if (parts.Length == 0)
        {
            if (method == "GET")
            {
                return Ok(users.List(actor));
            }

            if (method == "POST")
            {
                Allow(body, [.. ProfileFields, "username", "companyId"]);
                var created = users.Create(actor, new(Required<string>(body, "username"), Required<string>(body, "firstName"), Field<string?>(body, "middleName").Or(null), Required<string>(body, "lastName"),
                    Field<string>(body, "gender").Or("unspecified"), Field<bool?>(body, "married").Or(false), Field<int?>(body, "dependentChildren").Or(0), Field<bool?>(body, "soleCare").Or(false), Field<Guid?>(body, "companyId").Or(null)));
                return Created($"users/{created.Guid}", created);
            }
            throw MethodUnavailable();
        }
        var id = Id(parts[0]);
        if (parts.Length == 1)
        {
            if (method == "GET")
            {
                return Ok(users.Get(actor, id));
            }

            if (method == "PATCH")
            {
                return Ok(users.Update(actor, ReadUserUpdate(id, body)));
            }

            if (method == "DELETE")
            {
                users.Delete(actor, new DeleteUser(id));
                return new NoContentResult();
            }
        }
        if (parts.Length == 2 && parts[1] == "account" && method == "PATCH")
        {
            Allow(body, "username", "status");
            return Ok(users.UpdateAccount(actor, new UpdateUserAccount(id, Field<string>(body, "username"), Field<string>(body, "status"))));
        }
        if (parts.Length == 2 && parts[1] == "deletion-request" && method == "POST")
        {
            Allow(body);
            return Ok(users.RequestDeletion(actor, new RequestUserDeletion(id)));
        }
        throw MethodUnavailable();
    });
}
