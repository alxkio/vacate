using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Application.Identity;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class SessionFunctions(AuthenticationService authentication)
{
    [Function("Sessions")]
    public Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "delete", Route = "auth/sessions/{*path}")] HttpRequest request, string? path) => Execute(request, body =>
    {
        var parts = Path(path);
        if (parts.Length == 0 && request.Method == "POST")
        {
            Allow(body, "username", "password");
            return Ok(authentication.SignIn(Required<string>(body, "username"), Required<string>(body, "password")));
        }
        if (parts.SequenceEqual(new[] { "current" }))
        {
            if (request.Method == "GET")
            {
                return Ok(authentication.Current(Token(request)));
            }

            if (request.Method == "DELETE")
            {
                authentication.SignOut(Token(request));
                return new NoContentResult();
            }
        }
        throw MethodUnavailable();
    });
}
