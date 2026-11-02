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
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddScoped<RecordMapper>();
builder.Services.AddScoped<AccessPolicy>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<MembershipService>();
builder.Services.AddScoped<OrganizationService>();
builder.Services.AddScoped<AuthenticationService>();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Worker logs use the Functions host pipeline and its host.json filters.
// Avoid a separate exporter that bypasses host filtering or collects success traces.
// SQL mode is explicit; migrations and fictional imports are never run at host startup.
await builder.Build().RunAsync();
