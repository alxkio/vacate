using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Application.Identity;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class SessionFunctions(AuthenticationService authentication)
{
    [Function("GetDevelopmentAccounts")]
    public Task<IActionResult> Accounts([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/development-accounts")] HttpRequest request) =>
        Execute(request, _ => Ok(authentication.Accounts()));

    [Function("CreateSession")]
    public Task<IActionResult> Create([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/sessions")] HttpRequest request) =>
        Execute(request, body =>
        {
            Allow(body, "username", "password");
            return Ok(authentication.SignIn(Required<string>(body, "username"), Required<string>(body, "password")));
        });

    [Function("GetCurrentSession")]
    public Task<IActionResult> GetCurrent([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/sessions/current")] HttpRequest request) =>
        Execute(request, _ => Ok(authentication.Current(Token(request))));

    [Function("DeleteCurrentSession")]
    public Task<IActionResult> DeleteCurrent([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "auth/sessions/current")] HttpRequest request) =>
        Execute(request, _ =>
        {
            authentication.SignOut(Token(request));
            return new NoContentResult();
        });
}
