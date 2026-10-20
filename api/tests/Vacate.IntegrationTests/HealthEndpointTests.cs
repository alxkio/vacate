using Microsoft.AspNetCore.Mvc.Testing;

namespace Vacate.IntegrationTests;

public sealed class HealthEndpointTests
{
    [Test]
    public async Task health_endpoint_reports_the_api_is_running()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync("/health");

        // Assert
        Assert.That(response.IsSuccessStatusCode, Is.True);
    }
}
