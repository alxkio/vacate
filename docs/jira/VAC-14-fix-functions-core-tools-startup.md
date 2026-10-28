---
id: VAC-14
type: bug
summary: Fix local Azure Functions startup with supported Core Tools
status: done
created: 2026-10-28
updated: 2026-10-28
parent: null
depends_on: []
---

# VAC-14 — Fix local Azure Functions startup with supported Core Tools

![Bug](badges/bug.svg) **✅ Done** · Owner: Codex

## Description

Starting the .NET 9 isolated-worker API with Azure Functions Core Tools 4.0.4483 reports that it cannot determine the project language and finds no job functions. The current project uses `Azure.Functions.Sdk/1.0.0`.

Reproduction: from `api/src/Vacate.Api`, run `func start` with Core Tools 4.0.4483.

Actual: Core Tools cannot infer the project language and fails to load the `dotnet-isolated` worker configuration.

Expected: with supported Core Tools, the SDK-supported `dotnet run -- --port 7071` command starts the isolated worker and discovers the HTTP functions.

## Scope

Keep the .NET 9 target and current Functions SDK. Correct the local startup guidance to use the Core Tools version pinned by CI and the SDK-supported `dotnet run` entry point; explain that the ignored local settings file is created from the tracked example. Do not change runtime code or add local settings containing developer-specific values.

The local `local.settings.json` is absent and ignored by design. Its tracked example contains `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated` and blank storage, appropriate for the HTTP-only local host. Setting the runtime environment variable explicitly does not resolve the failure with Core Tools 4.0.4483. The current SDK enables worker indexing in `worker.config.json`; a standalone `functions.metadata` file is not expected. The CI package check must validate that worker-indexing configuration and exercise the real host rather than require the static metadata file used by the prior SDK.

## Dependencies

None.

## Acceptance scenarios

- [x] Given the .NET 9 project, when it is published, then its worker configuration identifies `dotnet-isolated` and enables worker indexing, and its extension loader files are packaged.
- [x] Given a developer with Core Tools 4.16.0 and the runtime environment used by CI, when they run `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated AzureWebJobsStorage='' dotnet run --configuration Release --no-build -- --port 7077` from the API project directory, then the host discovers Health, Organizations, Sessions and Users and `GET /api/health` returns healthy.
- [x] Tenant isolation is not exercised: this issue concerns local host discovery and configuration, not API behavior or authorization.

## Subtasks and responsibilities

### UX

Not applicable; no product interface changes.

### UI

Not applicable; no frontend changes.

### Backend

- [x] Preserve the .NET 9 API and worker-indexing configuration.
- [x] Keep local settings out of source control and published output.

### Database

Not applicable; no database behavior changes.

### QA and other responsibilities

- [x] Document the supported Core Tools version, SDK-supported startup command and local settings setup.
- [x] Make CI validate the current worker-indexing metadata and remove its stale `functions.metadata` assumption.
- [x] Verify host startup with Core Tools 4.16.0.

## Attachments and sources

- [API development instructions](../../api/README.md)
- [Functions project](../../api/src/Vacate.Api/Vacate.Api.csproj)
- [Local settings example](../../api/src/Vacate.Api/local.settings.example.json)
- [CI host verification](../../.github/workflows/ci.yml)

## Comments

C-1 · 2026-10-28 · Codex: Reproduced the language-detection and isolated-worker-config failure with Core Tools 4.0.4483, including with `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated` supplied in the environment.

C-2 · 2026-10-28 · Codex: Core Tools 4.16.0 with `FUNCTIONS_WORKER_RUNTIME=dotnet-isolated AzureWebJobsStorage='' dotnet run` discovered all four functions and served the health endpoint. The newer SDK uses worker indexing and does not emit a standalone `functions.metadata`; CI now checks `worker.config.json` and starts through the source project.

## Decisions

D-1 · 2026-10-28 · Codex: Retain the .NET 9 target and current Azure Functions SDK; use the Core Tools 4.16.0 version selected by CI instead of trying to make this project compatible with the obsolete local tool.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis |
|---|---|---|---|---|---|
| W-1 | 2026-10-28 | Codex / assistant recorded | Investigate startup discovery, update setup guidance, build and inspect worker-indexing output | Unknown | Session work; no complete issue duration measured |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-28 · Codex: Created as In progress for startup investigation; moved to QA after project build and worker-indexing checks passed.

H-2 · 2026-10-28 · Codex: Moved to Done after Core Tools 4.16.0 discovered all four source functions and the health endpoint returned healthy.

## Verification and release

`dotnet build api/Vacate.slnx --configuration Release --no-restore` passed with zero warnings and errors; all 20 unit and integration tests passed. The published `worker.config.json` declares `dotnet-isolated` and `workerIndexing: true`; `.azurefunctions/function.deps.json` is present and `functions.metadata` is absent as expected for this SDK. Core Tools 4.0.4483 startup was reproduced as failing. With Core Tools 4.16.0 and the runtime environment used by CI, `dotnet run --configuration Release --no-build -- --port 7077` discovered all four functions and `GET /api/health` returned `{"status":"healthy", ...}`. CI now runs the same SDK-supported host path after validating the published package structure. No deployment or release is claimed.

## Open questions and follow-up

Directly starting the published package with Core Tools 4.16.0 did not discover functions in this local host context; the current SDK uses worker indexing and emits no static `functions.metadata`. CI therefore validates package contents separately and exercises startup through the source-project `dotnet run` path. Azure deployment/runtime behavior remains unverified and is outside this local-startup fix. No product or authorization questions are introduced.
