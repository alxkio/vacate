using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Vacate.Application.Common;
using Vacate.Application.Identity;
using Vacate.Application.Leave;
using Vacate.Application.Memberships;
using Vacate.Application.Organizations;
using Vacate.Application.Users;
using Vacate.Infrastructure;

var builder = FunctionsApplication.CreateBuilder(args);
builder.ConfigureFunctionsWebApplication();
builder.Services.AddPersistence(builder.Configuration);
#if VACATE_TEST_FIXTURES
// This branch and the fixture files exist only in an explicit, non-publishable test build.
if (builder.Configuration["TestFixtures:Enabled"] == "true")
{
    if (builder.Configuration["Persistence:Provider"] is not (null or "InMemory"))
    {
        throw new InvalidOperationException("Test fixtures require disposable InMemory persistence.");
    }

    Vacate.Testing.InMemoryFixture.AddInMemoryTestFixtures(builder.Services);
}
#endif
builder.Services.AddScoped<RecordMapper>();
builder.Services.AddScoped<AccessPolicy>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<MembershipService>();
builder.Services.AddScoped<OrganizationService>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddScoped<LeaveService>();
builder.Services.AddScoped<AdminLeaveService>();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Worker logs use the Functions host pipeline and its host.json filters.
// Avoid a separate exporter that bypasses host filtering or collects success traces.
// SQL mode is explicit; migrations and business-data scripts never run at host startup.
await builder.Build().RunAsync();
