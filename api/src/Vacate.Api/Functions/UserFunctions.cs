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
    [Function("ListUsers")]
    public Task<IActionResult> List([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users")] HttpRequest request) =>
        WithActor(request, (_, actor) => Ok(users.List(actor)));

    [Function("CreateUser")]
    public Task<IActionResult> Create([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "users")] HttpRequest request) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body, [.. ProfileFields, "username", "companyId"]);
            var created = users.Create(actor, new(Required<string>(body, "username"), Required<string>(body, "firstName"), Field<string?>(body, "middleName").Or(null), Required<string>(body, "lastName"),
                Field<string>(body, "gender").Or("unspecified"), Field<bool?>(body, "married").Or(false), Field<int?>(body, "dependentChildren").Or(0), Field<bool?>(body, "soleCare").Or(false), Field<Guid?>(body, "companyId").Or(null)));
            return Created($"users/{created.Guid}", created);
        });

    [Function("GetUser")]
    public Task<IActionResult> Get([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users/{userId}")] HttpRequest request, string userId) =>
        WithActor(request, (_, actor) => Ok(users.Get(actor, Id(userId))));

    [Function("UpdateUser")]
    public Task<IActionResult> Update([HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "users/{userId}")] HttpRequest request, string userId) =>
        WithActor(request, (body, actor) => Ok(users.Update(actor, ReadUserUpdate(Id(userId), body))));

    [Function("DeleteUser")]
    public Task<IActionResult> Delete([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "users/{userId}")] HttpRequest request, string userId) =>
        WithActor(request, (_, actor) =>
        {
            users.Delete(actor, new DeleteUser(Id(userId)));
            return new NoContentResult();
        });

    [Function("UpdateUserAccount")]
    public Task<IActionResult> UpdateAccount([HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "users/{userId}/account")] HttpRequest request, string userId) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body, "username", "status");
            return Ok(users.UpdateAccount(actor, new UpdateUserAccount(Id(userId), Field<string>(body, "username"), Field<string>(body, "status"))));
        });

    [Function("RequestUserDeletion")]
    public Task<IActionResult> RequestDeletion([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "users/{userId}/deletion-request")] HttpRequest request, string userId) =>
        WithActor(request, (body, actor) =>
        {
            Allow(body);
            return Ok(users.RequestDeletion(actor, new RequestUserDeletion(Id(userId))));
        });

    private Task<IActionResult> WithActor(HttpRequest request, Func<System.Text.Json.Nodes.JsonObject, int, IActionResult> operation) =>
        Execute(request, body => operation(body, authentication.RequireActor(Token(request))));
}
