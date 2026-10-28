---
id: VAC-17
type: bug
summary: Resolve the Azure Functions runtime mismatch blocking deployed API health
status: qa
created: 2026-10-28
updated: 2026-10-28
parent: null
depends_on: []
---

# VAC-17 — Resolve the Azure Functions runtime mismatch blocking deployed API health

![Bug](badges/bug.svg) **🔍 QA** · Owner: Unassigned

## Description

The deployment workflow published both the Functions API package and Angular frontend successfully, but its deployed-endpoint verification failed. On run [40707600753](https://github.com/alxkio/vacate/actions/runs/40707600753), all 24 attempts to read the API health endpoint ended with HTTP 404, HTTP 502 or request timeouts. The deployed frontend returned HTTP 200 and served the Angular shell.

At the failed deployment's source commit `f53bf299cad42fc44e4e1453300ef2b4b7acea6a`, the API targeted `net9.0` while `infra/main.bicep` declared the Azure Functions Flex Consumption runtime as `dotnet-isolated` version `10.0`. Accepted [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md) specify .NET 10. The difference is a credible cause of worker startup/indexing failure, but the GitHub deployment smoke output does not include Azure worker startup diagnostics; causal confirmation remains UNVERIFIED.

The product lead selected .NET 10 to match the accepted architecture and Azure runtime. The failed run's logs confirm `Azure/functions-action@v1` deployed the Functions package using One Deploy, but the Azure portal screenshot showed only the Health function. This keeps worker indexing as an unresolved part of the failure; package deployment success alone does not prove that the worker indexed all 38 triggers.

Reproduction:

1. Run the Deploy Azure workflow with `environment=dev`, `apply=true`, and `deploy_backend=true`.
2. Observe the API artifact publish and frontend publish complete.
3. Observe **Verify deployed endpoints** fail while requesting `https://vacate-dev-wv5pdctnrzamu-api.azurewebsites.net/api/health`.

Actual: the deployed health endpoint returns intermittent 404/502 or times out; the smoke check fails.

Expected: the deployed worker indexes the API functions and `/api/health` returns healthy with the deployed revision.

## Scope

Align the application build and Azure Functions runtime with the accepted .NET 10 decision, add a CI guard against runtime/target drift, and verify local .NET 10 development and host indexing. A deployed health response is still required before claiming the Azure deployment is ready. Do not change Azure resources or re-run deployment without explicit authorization.

The local machine has .NET SDK 10.0.403 installed. Updating the repository SDK pin to that installed version allows local .NET 10 builds and Functions-host runs; the API must still be verified through the supported Core Tools 4.16.0 launch path.

## Dependencies

None.

## Acceptance scenarios

- [x] Given the accepted .NET 10 decision, when the API and infrastructure are built, then the project target and Azure Functions runtime version match and CI rejects future mismatch.
- [x] Given the .NET 10 SDK and supported Core Tools are installed, when the API is built, tested, published and started locally, then the host indexes the expected explicit HTTP triggers and the health endpoint responds.
- [ ] Given the aligned package is deployed to the authorized dev target, when `GET /api/health` is called, then it returns HTTP 200 with `status=healthy` and the expected build revision.
- Tenant isolation is not exercised: this failure concerns Functions host startup and health routing, not business-resource authorization. Existing tenant-isolation tests remain required by CI.

## Subtasks and responsibilities

### UX

Not applicable; no product interface change.

### UI

Not applicable; the deployed frontend served successfully and is not implicated by the API health failure.

### Backend

- [x] Align the API target framework after the product decision.
- [ ] Confirm deployed worker indexing and health response.

### Database

Not applicable; no database behavior is involved.

### QA and other responsibilities

- [x] Add a CI check that the Azure Functions runtime version matches the API target framework.
- [ ] Capture host startup diagnostics and verify the deployed API health endpoint after authorized deployment.

## Attachments and sources

- [Deploy Azure failure, run 12](https://github.com/alxkio/vacate/actions/runs/40707600753)
- [Azure deployment workflow](../../.github/workflows/azure-infrastructure.yml)
- [API CI workflow](../../.github/workflows/ci.yml)
- [Functions infrastructure](../../infra/main.bicep)
- [API target framework](../../api/Directory.Build.props)
- [Accepted product technology decision](../adr/0001-company-first-web-api.md)
- [Accepted Azure hosting decision](../adr/0002-azure-static-web-app-and-functions.md)
- [Azure Functions isolated worker supported versions](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide)

## Comments

C-1 · 2026-10-28 · Codex: Workflow logs show the Bicep deployment, Functions package publish, and frontend publish succeeded; the 24-attempt deployed-endpoint check failed against API health. The public frontend returned HTTP 200. A direct API health request from this workstation timed out. The app root returned Azure's default Functions page. No Azure host startup logs have yet been collected.

C-2 · 2026-10-28 · Codex: Source inspection confirms .NET target/runtime mismatch: API `net9.0`, Bicep `dotnet-isolated` `10.0`. This is a credible but not yet causally confirmed explanation for the missing/unavailable function route.

C-3 · 2026-10-28 · Codex: Detailed run logs confirm the Functions publish action initiated One Deploy and reported the package successfully deployed. The founder's portal screenshot shows only Health. The local Azure CLI has no authenticated account, so remote function inventory and host diagnostics could not be queried. No new Azure deployment was attempted.

## Decisions

D-1 · 2026-10-28 · Product lead: Upgrade the API to .NET 10 to match accepted ADR-0001/ADR-0002 and the Azure Functions runtime in `infra/main.bicep`. This supersedes [VAC-14](VAC-14-fix-functions-core-tools-startup.md)'s earlier target-preservation decision; its Core Tools 4.16.0 local launch guidance remains applicable.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis |
|---|---|---|---|---|---|
| W-1 | 2026-10-28 | Codex / assistant recorded | Inspect failed deployment logs, verify public endpoints and compare API target/runtime configuration | Unknown | GitHub Actions run 40707600753 and read-only source inspection; no complete issue duration measured |
| W-2 | 2026-10-28 | Codex / assistant recorded | Align API target, SDK pin, lockfiles, CI runtime guard and documentation; build, test, publish and run the local Functions host | Unknown | Successful .NET 10 restore/build/test/publish; local Core Tools 4.16.0 indexed 38 HTTP triggers and served healthy; no complete issue duration measured |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-28 · Codex: Created as Specification while awaiting a product decision on the conflicting .NET target versions.
H-2 · 2026-10-28 · Codex: Product lead selected .NET 10; moved to In progress to implement the target/runtime alignment and verify local execution.
H-3 · 2026-10-28 · Codex: Local .NET 10 build, tests, package publish, 38-trigger Functions-host indexing and health response passed; moved to QA. Cloud validation remains pending because no Azure deployment was authorized and this workstation is not authenticated.

## Verification and release

Local verification: `dotnet restore api/Vacate.slnx --locked-mode`, Release build, full solution tests (7 unit and 14 integration tests), and publish passed on SDK 10.0.403. Core Tools 4.16.0 started the published package on port 7072, indexed all 38 explicit HTTP triggers, and returned HTTP 200 from `/api/health` with the expected revision. The CI target/runtime comparison passed. The published package contains `host.json`, worker-indexing configuration and `.azurefunctions/function.deps.json`; a standalone `functions.metadata` file is correctly absent for this worker-indexing setup.

Cloud verification remains open: GitHub Actions run 40707600753 reported successful One Deploy package publishing but failed **Verify deployed endpoints** after 24 API-health attempts (404, 502 and timeouts); the founder's portal screenshot showed only Health. The local Azure CLI is not authenticated, so remote function inventory and startup diagnostics could not be collected. No new Azure deployment was performed.

## Open questions and follow-up

- **UNVERIFIED:** The deployed app's indexed function inventory and worker startup diagnostics are unavailable because this workstation is not authenticated to Azure. The portal screenshot shows only Health despite the successful One Deploy package publish. Confirm all expected functions and the health endpoint after an explicitly authorized deployment; do not infer that the runtime mismatch is the only cause.
