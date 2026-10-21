using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Api.Functions;

namespace Vacate.IntegrationTests;

// Function contract checks; CI also starts the real Functions host and tests HTTP.
public sealed class HealthEndpointTests
{
    [Test]
    public void liveness_returns_only_status_and_build_version_without_database_configuration()
    {
        var function = new HealthFunction();
        var result = function.Run(new DefaultHttpContext().Request) as OkObjectResult;

        Assert.That(result, Is.Not.Null);
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(result!.Value));
        Assert.Multiple(() =>
        {
            Assert.That(json.RootElement.GetProperty("status").GetString(), Is.EqualTo("healthy"));
            Assert.That(json.RootElement.GetProperty("version").GetString(), Is.Not.Empty);
            Assert.That(json.RootElement.EnumerateObject().Count(), Is.EqualTo(2));
        });
    }

    [Test]
    public void health_is_an_anonymous_get_function_at_the_expected_route()
    {
        var method = typeof(HealthFunction).GetMethod(nameof(HealthFunction.Run))!;
        var trigger = method.GetParameters()[0].GetCustomAttributes(typeof(HttpTriggerAttribute), false)
            .Cast<HttpTriggerAttribute>().Single();
        Assert.Multiple(() =>
        {
            Assert.That(trigger.AuthLevel, Is.EqualTo(AuthorizationLevel.Anonymous));
            Assert.That(trigger.Methods, Is.EqualTo(new[] { "get" }));
            Assert.That(trigger.Route, Is.EqualTo("health"));
        });
    }
}
