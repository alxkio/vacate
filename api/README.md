# Vacate API

The .NET 10 API uses the Azure Functions isolated worker with ASP.NET Core HTTP types. The only public endpoint is `GET /api/health`, returning liveness and an assembly build version. It does not check database availability. Persistence projects remain in the solution; the host does not register a database connection until that infrastructure and the application authentication design are agreed.

## Development

Install .NET from the root `global.json` and Azure Functions Core Tools 4.16.0 (matching CI). From `api/src/Vacate.Api`, copy `local.settings.example.json` to ignored `local.settings.json`, then run `func start --port 7071`. Angular's development proxy forwards `/api` to that port. `dotnet run` alone does not start the Functions runtime. Storage is intentionally blank for this HTTP-only local host; timer/queue/storage bindings will require local or Azure storage configuration.

```sh
dotnet restore api/Vacate.slnx --locked-mode
dotnet build api/Vacate.slnx --configuration Release --no-restore
dotnet test api/Vacate.slnx --configuration Release --no-build --no-restore
dotnet publish api/src/Vacate.Api --configuration Release --output artifacts/api
```

The publish directory itself is the package root: `host.json`, `functions.metadata`, `worker.config.json` and hidden `.azurefunctions/` content must be retained. Local settings and `appsettings*.json` must not be published. Cloud app settings come from Bicep, with managed identity for runtime/deployment storage. Worker logs are relayed through the Functions host to Application Insights when its connection string is configured. Host and worker filters retain warnings/errors; failed host executions remain, while successful request telemetry, dependency tracing, performance counters and live metrics are disabled. The separate worker OpenTelemetry exporter was removed so it cannot bypass the host filters. Sampling is disabled for the retained error diagnostics; the workspace daily cap can still stop ingestion. The first release handles no employee payloads.

Contract tests check the health result and binding. CI additionally starts the actual Functions runtime from the published directory and verifies the HTTP response and build revision. No database or customer-isolation behavior is claimed by these checks. Anonymous authorization applies only to liveness; future personal-data functions require server-side account and company authorization before release.

[Cloud deployment](../infra/README.md) describes the shared build, infrastructure, publish and smoke-check workflow. Sources checked 2026-10-21: [isolated worker guide](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide), [Functions GitHub Action](https://github.com/Azure/functions-action).
