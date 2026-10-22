using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = FunctionsApplication.CreateBuilder(args);
builder.ConfigureFunctionsWebApplication();
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Worker logs use the Functions host pipeline and its host.json filters.
// Avoid a separate exporter that bypasses host filtering or collects success traces.
// Persistence is not registered until database infrastructure is agreed.
await builder.Build().RunAsync();
