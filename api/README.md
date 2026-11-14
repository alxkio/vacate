# Vacate API

The .NET 10 API uses the Azure Functions isolated worker with ASP.NET Core HTTP types. The always-available public endpoint is `GET /api/health`, returning liveness and an assembly build version. It does not check database availability. Resource persistence defaults to InMemory. Accepted ADR-0004 adds explicit SqlServer mode through Infrastructure adapters; migrations run only through the separate operator tool, never at host startup. Development sign-in remains separately opt-in and is not production identity.

## Development

Install the .NET 10 SDK specified by the root `global.json` and Azure Functions Core Tools 4.16.0 (the version used by CI). Core Tools 4.0.4483 is too old for this `Azure.Functions.Sdk` project: it cannot infer the project language or load its isolated-worker configuration, even when `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated` is set. Do not downgrade the project SDK or target framework to work around that tooling incompatibility.

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
- `Vacate.Infrastructure`: resource/session adapters, optional development credentials and fictional seeding. `Persistence/Seeds/fictional-users.json` supplies twelve accounts. SqlServer resource and shared-session adapters are opt-in; migration and fictional import are explicit operator commands.
- `Vacate.Api`: thin feature Functions, payload parsing and composition. Public routes/references use GUIDs; internal relationships use numeric keys.

See [ADR-0003](../docs/adr/0003-domain-and-application-services.md) and the [API contract](../docs/contracts/api.md).

[Cloud deployment](../infra/README.md) describes the shared build, infrastructure, publish and smoke-check workflow. Sources checked 2026-10-21: [isolated worker guide](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide), [Functions GitHub Action](https://github.com/Azure/functions-action).

## API-backed fictional settings · VAC-13

See the [endpoint and access contract](../docs/contracts/api.md). Copy local.settings.example.json to ignored local.settings.json to enable `DevelopmentAuthentication__Enabled=true SeedData__Enabled=true` locally. Development credentials and seed data default off; resource endpoints use the same application services in every environment. The twelve test users and role/structure references are embedded in `Persistence/Seeds/fictional-users.json` in Infrastructure. In-memory adapters hold edits/sessions and reset on host restart. Run one local worker; no multi-instance or real-data claim. Current development cloud enablement and SQL cutover are documented in VAC-26/VAC-35; this is not production identity or readiness.

Run the Angular dev server against the Functions host on port 7071. Profile, membership and organization edits require the running API; there is no browser-only fallback. Read/update flows are available in the web, and create/delete endpoints are API-only. Example: `POST /api/auth/sessions` with `{"username":"nora","password":"nora"}`; use its opaque accessToken as a bearer credential. Sessions have a 30-minute absolute lifetime from issuance; authenticated activity does not renew the expiry. InMemory tickets disappear on restart. SqlServer mode uses hashed shared tickets so upgraded instances using the same database can resolve unexpired sessions. SQL unavailability is not session expiry; the browser retains the ticket and offers reconnection.

## SQL persistence · VAC-26

Full SQL deployments now use the [database deployment gate](../docs/database/deployment.md) (VAC-41): the same-release operator applies pending migrations, refreshes runtime grants and verifies mapped-column access before API/frontend publication. Configure the environment-specific migration credential first; API startup still never migrates or seeds SQL.

See the [Stage A implementation and migration runbook](../docs/database/implementation-stage-a.md). Set Persistence__Provider=SqlServer and ConnectionStrings__Vacate explicitly for that host process. Keep encryption/certificate validation enabled. Default InMemory behavior and public resource schemas/routes remain compatible. SqlServer sessions use the same database and the existing database-first migration/grant gate; sign-in remains development-only. Existing memory tickets cannot migrate: users sign in once after upgrading from process-local sessions. No additional Azure service or production identity integration is introduced.

The operator tool under api/tools/Vacate.Database generates reviewed idempotent SQL, inspects schema counts, applies forward migrations and supports an explicit empty-only fictional import. Do not run startup migrations or seed real employee data. The exact baseline script is versioned under docs/database/migrations/. Actual SQL tests require VACATE_SQL_TEST_CONNECTION and an explicitly authorized migrated test target; without it they are reported skipped, not passed. Existing Functions/API/browser checks still apply to a repository swap.

Generating a migration does not apply it. The user-authorized development cutover uses the existing free SQL database, explicit fictional import and a resolved managed identity with limited table/sequence permissions. SQL free-limit/AutoPause remain mandatory; minimum-cost replacement runtime storage and diagnostics were separately approved. The user later selected initial-development open IPv4 access while retaining Entra-only/TLS, for app/VS Code/portal use. See the development-access and relocation evidence; production recovery/identity/policy/onboarding remain separate.

VAC-36 replaces the initial snapshot table with MembershipEntitlements and Leaves; consumption and remaining values are derived on each membership read, with runtime Leaves access restricted to SELECT. See [mapping and guarded fixture migration](../docs/database/derived-leave-balances.md) and [current verification gaps](../docs/jira/media/VAC-36/verification-2026-11-02.md). No public leave-writing workflow is added.

## Company administration · VAC-43

The administrator calendar endpoints now configure company recurring holidays, explicit administrator approvers and automatic company-closure leave. Assigned approvals and sanitized personnel history are real saved-record projections. See the [administration contract](../docs/contracts/api.md#company-administration--vac-43--2026-11-12) for routes, payloads, privacy boundaries and accounting. The frontend is paired with these contracts; it does not manufacture an approval inbox or recorded closure results.

`20261112210758_CompanyAdministration` adds normalized company-owned holiday/closure/result/assignment tables and request decision/provenance columns. Review the [forward SQL](../docs/database/migrations/0004-company-administration.sql) and apply it only through the explicit database operator before publishing a SQL-backed API. Runtime grants now include the new tables/sequences plus Leaves/LeaveRequests UPDATE for authorized decisions; the grant gate checks these permissions and continues to reject physical DELETE for other resources, schema and migration-history authority. No startup migration or automatic production approver assignment is added. The opt-in fictional fixture explicitly configures Nora; newly created production companies require administrator configuration.

Focused checks:

```sh
dotnet test api/tests/Vacate.IntegrationTests --no-restore -m:1 -nr:false --filter FullyQualifiedName~AdminLeaveTests
python3 scripts/verify-admin.py --help
```

The integration fixture verifies tenant denials, assignment inheritance/rerouting, self-approval, mixed past/future decisions, balance validation, holiday recurrence/history and automatic closure idempotency. Two additional SQL-provider scenarios verify normalized persistence and concurrent accounting only when `VACATE_SQL_TEST_CONNECTION` names an authorized migrated test database. Without that target they are skipped; model/script checks and InMemory passes do not establish SQL execution or release approval. Closure cancellation/history correction and company-holiday editing remain outside the exposed creation workflow.


## Permanent personal leave removal

The current owner-authorized DELETE `/api/organizations/{companyId}/leave/requests/{requestId}` removes personal saved requests and their dates/charges permanently. Only a current company administrator may use it; generated closure leave is protected. See the [deletion contract](../docs/contracts/api.md#permanent-personal-request-deletion--owner-decision--2026-11-13). It returns 204, with repeated/missing or unauthorized requests returning 404 and closure requests 409. Runtime SQL grants must be refreshed through the operator to allow DELETE on Leaves/LeaveRequests only; no schema migration or startup grant is added. Tests against disposable InMemory/SQL targets can use this real endpoint for cleanup; they must never delete pre-existing or generated closure records.


### VAC-42 own cancellation, expiry and fictional history · 2026-11-14

Own cancellation uses `POST /organizations/{companyId}/leave/requests/{requestId}/cancel` with a nonempty unique `dates` array. It preserves history, protects past dates/closures/foreign people/companies and releases approved or pending charges. Admin permanent DELETE remains a separate operation. On access, dated past Pending entries expire in company timezone and leave pending accounting, active coverage and the approval inbox. Undated opening amounts cannot be inferred as past requests. See the [contract](../docs/contracts/api.md#employee-cancellation-and-expiry--vac-42--2026-11-14).

Apply the reviewed forward migration before publishing the API. To add fixed historical examples to an existing known demo database, configure `VACATE_SQL_CONNECTION` for that target, then run `dotnet run --project api/tools/Vacate.Database --no-build -- seed-fictional-history`. It is idempotent, checks demo and fixture GUIDs, skips overlap and converts limited known used opening consumption to dated examples without changing total used leave, and known pending opening totals to the existing October fictional request dates (which expire naturally on access). It never overwrites requests or seeds real companies. Source/model checks do not establish that migration or import ran against SQL.
