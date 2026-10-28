using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Vacate.Application.Common;
using Vacate.Application.Identity;
using Vacate.Application.Memberships;
using Vacate.Application.Organizations;
using Vacate.Application.Users;
using Vacate.Infrastructure;

var builder = FunctionsApplication.CreateBuilder(args);
builder.ConfigureFunctionsWebApplication();
builder.Services.AddInMemoryPersistence();
builder.Services.AddSingleton<RecordMapper>();
builder.Services.AddSingleton<AccessPolicy>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<MembershipService>();
builder.Services.AddSingleton<OrganizationService>();
builder.Services.AddSingleton<AuthenticationService>();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Worker logs use the Functions host pipeline and its host.json filters.
// Avoid a separate exporter that bypasses host filtering or collects success traces.
// Persistence is not registered until database infrastructure is agreed.
await builder.Build().RunAsync();
