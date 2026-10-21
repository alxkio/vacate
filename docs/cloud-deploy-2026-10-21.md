# First cloud deployment preparation — 2026-10-21

## Scope and sources

Implements the founder's request to adapt both apps to the Azure hosting accepted in [ADR-0002](adr/0002-azure-static-web-app-and-functions.md). The local `alcalc` deployment remains a structural reference. The founder designated subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6` and resource group `rg-vacate-dev` for the first deployment; these values are in `infra/targets/dev.json`. The resource-group name reflects the founder correction on 2026-10-22. West Europe remains an ASSUMPTION, configurable in that target file.

## Changes and decisions

- Migrated `api/src/Vacate.Api` to the .NET 10 isolated Functions worker, using ASP.NET Core HTTP types. Its only endpoint is anonymous `GET /api/health`, exposing liveness and assembly revision. Replaced the ASP.NET WebApplicationFactory check with health/binding contract tests; CI additionally exercises the real Functions runtime over HTTP.
- Added `host.json`, ignored local-settings support and an example settings file; removed unused ASP.NET exception handling. Published output excludes machine configuration and retains hidden Functions extension content. No database dependency is registered for this first release. Existing persistence/application/domain projects are retained.
- Added Functions worker OpenTelemetry export when Application Insights is configured. No employee-data endpoints, logging payloads or legal-policy rules were added.
- Angular now loads public runtime API configuration before startup; the API client uses the configured HTTPS API base URL. Added missing/invalid configuration and request-origin checks. Added Static Web Apps deep-link fallback and no-store runtime configuration. Local `/api` proxy now targets Functions on port 7071.
- CI builds/tests both apps on Ubuntu, publishes artifacts, checks the Functions package, and runs HTTP liveness against the real Functions host. The deployment workflow reuses these checks, applies Bicep, publishes both artifacts, sets frontend API configuration from infrastructure outputs, and polls deployed revision, routing and CORS checks. Preview does not publish or apply.
- Added a one-time Azure setup helper for the designated group, deployment app, group-scoped roles and a new client secret saved to an owner-only temporary file. It has not been executed. GitHub configuration remains manual; existing credentials are not copied from the reference project.

Source documents updated: root `README.md`, `api/README.md`, `web/README.md`, `TechChoices.md`, ADR-0002, `infra/README.md`, and this report. The ADR index and source infrastructure originate from the preceding round. Existing unrelated working-tree changes were preserved.

## Acceptance scenarios

1. With no database configured, the published Functions package starts and `GET /api/health` returns status and the expected Git revision.
2. Given a provisioned API origin, the deployed Angular configuration uses that origin plus `/api`; missing or invalid settings stop startup visibly. Direct navigation to a feature route serves the SPA.
3. Given a valid repository `AZURE_CREDENTIALS` secret, deployment targets the recorded subscription/group. A conflicting GitHub target setting fails before Azure login. Only the configured frontend origin receives API CORS access.
4. Both published apps identify the same Git commit. A failed build, host check or deployment smoke check fails the workflow. There is no automatic atomic rollback across hosts.

Tenant-isolation tests do not apply to the liveness/static-hosting changes: no customer data access was introduced. Tenant isolation for future business endpoints remains UNVERIFIED and required before release of personal-data features.

## Verification

- API locked dependency graph refreshed successfully for the Functions host.
- API Release build: passed, zero warnings/errors.
- API tests: 2/2 contract tests passed. The business unit-test project still has no tests.
- Functions Release publish: passed; generated function metadata includes the anonymous GET health binding, `.azurefunctions/function.deps.json` and `worker.config.json` are present, and local/appsettings files are absent.
- Angular application and test TypeScript checks: passed. Full Angular production build and test execution remain pending on Ubuntu because this Mac cannot run the installed native build dependency, as recorded in the preceding build report.
- Bicep template and updated dev parameter configuration: compiled successfully. Staging/prod parameter files were compiled in the preceding infrastructure round.
- Workflow YAML parsed successfully; setup helper passes `bash -n`; `git diff --check` passed.
- Real Functions runtime check: passed using temporary Core Tools 4.16.0 against the published package. The HTTP smoke script verified `/api/health` and the exact build revision. The local host reports its storage readiness as unhealthy because local storage is intentionally unconfigured; this liveness check does not verify Azure storage access. The preinstalled Core Tools 4.0.4483 is too old for this package. CI pins 4.16.0.
- Azure deployment/validation and cloud smoke checks: not run. No cloud resources, IAM configuration or GitHub settings were changed.

## Remaining setup and open questions

Run the [manual Azure/repository-secret setup or optional helper](../infra/README.md), then commit/push to make the workflow available and dispatch **Deploy Azure** for `dev`. The GitHub repository needs `AZURE_CREDENTIALS`; subscription/group come from the checked-in target. No GitHub Environment or federation is required. An optional `SWA_DEPLOYMENT_TOKEN` is supported, with automatic retrieval when absent. The local shell has no Azure or GitHub CLI available, so this session cannot inspect those account configurations.

Authentication, username/recovery implementation, database selection, policy rules and company isolation remain open as recorded in the product charter/ADR-0001. This release is a cloud walking skeleton, not a usable absence-management pilot or release approval.

## Deployment authentication alignment

Deployment authentication follows the requested `alcalc` reference. The workflow and setup documentation use `azure/login` with the repository secret `AZURE_CREDENTIALS`. GitHub Environments and OIDC configuration were removed from the deployment path. Azure runtime storage continues to use managed identity. Acceptance: a matching credentials JSON can authenticate deployment; missing/invalid credentials or another subscription fail before login. Workflow YAML, extracted shell syntax and credential validation were checked locally; Azure login and deployment remain UNVERIFIED.
