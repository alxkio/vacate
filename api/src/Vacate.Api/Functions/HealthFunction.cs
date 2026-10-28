using System.Reflection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace Vacate.Api.Functions;

public sealed class HealthFunction
{
    // Anonymous liveness only. No employee, company, database or configuration data.

    [Function("Health")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "health")] HttpRequest request)
    {
        var version = typeof(HealthFunction).Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
        return new OkObjectResult(new
        {
            status = "healthy",
            version
        });
    }
}
