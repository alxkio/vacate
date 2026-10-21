# Build and test check — 2026-10-20

## Instructions and scope

Reviewed `AGENTS.md`, accepted `docs/adr/0001-company-first-web-api.md`, `docs/product/product-charter.md`, and the root/web READMEs. This check makes no product or architecture decisions and changes no implementation or dependency versions.

## Current implementation

- `web/`: Angular 22 standalone app, shell navigation and lazy routes for Leave, Approvals, Availability and People. Each feature currently renders only a heading. Two app smoke tests exist.
- `api/`: .NET 10 Domain/Application/Infrastructure/API projects, SQL Server EF Core registration with an empty context, exception handling, development OpenAPI and `/health`. One health integration test exists; the unit-test project has no tests.
- Authentication, business endpoints, leave rules, persistence mappings and company isolation are not implemented. Database connectivity and tenant isolation are unverified. `/health` only checks application liveness.
- An existing untracked `frontend/dist/` directory was left untouched; it is not evidence of a successful build of `web/`.

## Verification

| Check | Result |
| --- | --- |
| Locked Angular dependencies (`npm ci`) | Passed with Node 22.22.3 / npm 10.9.8 after network access was allowed |
| Angular production build (`npm run build`) | Blocked: native dependency reports `Current Mac OS X version 12.0 is lower than minimum supported version 14.0`; cancelled after it stalled |
| Angular tests (`npm test -- --watch=false`) | Blocked by the same platform error; cancelled after it stalled |
| App TypeScript (`tsc --noEmit -p tsconfig.app.json`) | Passed |
| Test TypeScript (`tsc --noEmit -p tsconfig.spec.json`) | Passed |
| API Release build with locked restore | Passed, zero warnings and errors |
| API Release tests | Health integration test passed (1/1); no unit tests discovered |

The default PATH has Node 16 and lacks the required .NET SDK. Used the existing Node installation at `/Users/user208256/.nvm/versions/node/v22.22.3/bin` and installed .NET SDK 10.0.300 temporarily at `/private/tmp/vacate-dotnet`. API commands used `DOTNET_CLI_HOME=/private/tmp/vacate-dotnet-home`:

```sh
/private/tmp/vacate-dotnet/dotnet build api/Vacate.slnx --configuration Release -p:RestoreLockedMode=true
/private/tmp/vacate-dotnet/dotnet test api/Vacate.slnx --configuration Release --no-build --no-restore -m:1
```

Package downloads and the API test runner required execution outside the sandbox; the latter needs local sockets. These checks do not establish browser behavior, SQL Server connectivity or release readiness.

## Remaining work and open questions

Run Angular build/tests on a host meeting the reported macOS requirement or a compatible CI host. No compatible production web build was produced in this check. Company workflow, authentication/recovery, database/deployment isolation and other open product decisions remain as recorded in the product charter and ADR. No new product decision was made.

Source document added: this report only.
