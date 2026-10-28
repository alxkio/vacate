# Vacate API

The .NET 9 API uses the Azure Functions isolated worker with ASP.NET Core HTTP types. The always-available public endpoint is `GET /api/health`, returning liveness and an assembly build version. It does not check database availability. Persistence projects remain in the solution; the host does not register a database connection until that infrastructure and the application authentication design are agreed.

## Development

Install .NET from the root `global.json` and Azure Functions Core Tools 4.16.0 (the version used by CI). Core Tools 4.0.4483 is too old for this `Azure.Functions.Sdk` project: it cannot infer the project language or load its isolated-worker configuration, even when `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated` is set. Do not downgrade the project SDK or target framework to work around that tooling incompatibility.

From `api/src/Vacate.Api`, run `cp local.settings.example.json local.settings.json` to create the ignored local settings file, then run `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated AzureWebJobsStorage='' dotnet run -- --port 7071`. Pass the worker runtime explicitly to the SDK/Core Tools launch; CI uses the same environment. The SDK invokes Core Tools from the correct build output directory; invoking `func start` directly from the project directory can skip required extension loading. The example also sets `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated`; `AzureWebJobsStorage` is intentionally blank for this HTTP-only local host. Angular's development proxy forwards `/api` to that port. Timer/queue/storage bindings will require local or Azure storage configuration.

```sh
dotnet restore api/Vacate.slnx --locked-mode
dotnet build api/Vacate.slnx --configuration Release --no-restore
dotnet test api/Vacate.slnx --configuration Release --no-build --no-restore
dotnet publish api/src/Vacate.Api --configuration Release --output artifacts/api
```

The publish directory itself is the package root: retain `host.json`, `worker.config.json` and hidden `.azurefunctions/` content. This SDK enables worker indexing, so function discovery metadata is supplied by the isolated worker and a standalone `functions.metadata` file is not expected. Local settings and `appsettings*.json` must not be published. CI validates this package structure and starts the source project through `dotnet run`, the SDK-supported local host path. Cloud app settings come from Bicep, with managed identity for runtime/deployment storage. Worker logs are relayed through the Functions host to Application Insights when its connection string is configured. Host and worker filters retain warnings/errors; failed host executions remain, while successful request telemetry, dependency tracing, performance counters and live metrics are disabled. The separate worker OpenTelemetry exporter was removed so it cannot bypass the host filters. Sampling is disabled for the retained error diagnostics; the workspace daily cap can still stop ingestion. The first release handled no employee payloads. Development sign-in and seed adapters support fictional data only.

Health contract tests check the result and binding. Domain tests cover invariants and dependency direction; resource integration tests cover authorization, tenant isolation, GUID addressing and lifecycle behavior. CI also starts the published Functions host and drives the built Angular app through HTTP. Resource Functions have anonymous trigger bindings with explicit session authorization in application services. Production identity/provider integration remains open.

The complete route and method inventory is documented in [OpenAPI](../docs/contracts/openapi.yaml), with one Azure Function trigger per operation. The specification is documentation-only; the Functions host does not expose Swagger UI.

For interactive examples, import the [Postman collection](../docs/contracts/vacate-api.postman_collection.json). Set `DevelopmentAuthentication__Enabled=true` and `SeedData__Enabled=true` for local runs, then send **Sign in** before authenticated requests. Collection variables include local defaults and capture IDs from create responses; review soft-delete targets before sending cleanup requests.

## Structure

- `Vacate.Domain`: typed entities, value objects and invariants. Every entity has numeric `Id` plus immutable `Guid`; no storage/HTTP dependency.
- `Vacate.Application`: user, membership and organization services, use-case records (`CreateUser`, `UpdateUser`, etc.), repository ports and authorized read projections.
- `Vacate.Infrastructure`: in-memory repositories, sessions, optional development credentials and fictional seeding. `Persistence/Seeds/fictional-users.json` supplies twelve accounts. Database registration remains undecided.
- `Vacate.Api`: thin feature Functions, payload parsing and composition. Public routes/references use GUIDs; internal relationships use numeric keys.

See [ADR-0003](../docs/adr/0003-domain-and-application-services.md) and the [API contract](../docs/contracts/api.md).

[Cloud deployment](../infra/README.md) describes the shared build, infrastructure, publish and smoke-check workflow. Sources checked 2026-10-21: [isolated worker guide](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide), [Functions GitHub Action](https://github.com/Azure/functions-action).

## API-backed fictional settings · VAC-13

See the [endpoint and access contract](../docs/contracts/api.md). Copy local.settings.example.json to ignored local.settings.json to enable `DevelopmentAuthentication__Enabled=true SeedData__Enabled=true` locally. Development credentials and seed data default off; resource endpoints use the same application services in every environment. The twelve test users and role/structure references are embedded in `Persistence/Seeds/fictional-users.json` in Infrastructure. In-memory adapters hold edits/sessions and reset on host restart. Run one local worker; no multi-instance or real-data claim. No cloud enablement or deployment is included.

Run the Angular dev server against the Functions host on port 7071. Profile, membership and organization edits require the running API; there is no browser-only fallback. Read/update flows are available in the web, and create/delete endpoints are API-only. Example: `POST /api/auth/sessions` with `{"username":"nora","password":"nora"}`; use its opaque accessToken as a bearer credential.
