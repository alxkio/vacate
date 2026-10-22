# Cloud validation — 2026-10-22

## Current outcome

The latest [validation retry](https://github.com/alxkio/vacate/actions/runs/39679059590) succeeded with the original `dev`, `apply=false` inputs after the Azure IAM updates. All jobs succeeded: compilation, frontend checks, backend checks and deployment validation/preview. Azure login and resource-group deployment permissions are now verified for this run. The Azure what-if summary reports **10 resources to create** in `rg-vacate-dev`.

No infrastructure or application deployment was performed. The verified commit remains `96e4632`; the local Node 24 action updates described below have not been pushed or exercised by this run. The next deployment can run with `environment=dev`, `apply=true` after the intended workflow updates are committed/pushed. Deployed runtime/storage, browser behavior and company isolation remain unverified. No product decision changed.

## Evidence

Pushed commit: `96e4632ce52128e44c63ee328793ea1a087b2cbe`, branch `master`.

- [CI run](https://github.com/alxkio/vacate/actions/runs/39678322223): success.
- [Deploy Azure validation run](https://github.com/alxkio/vacate/actions/runs/39679059590): dispatched with `environment=dev`, `apply=false`. Bicep compilation, frontend checks and backend checks succeeded. The first attempt failed at `azure/login@v2` with **No subscriptions found**. Azure resource validation/what-if was not reached. Infrastructure and applications were not deployed by this run.

This confirms hosted Angular build/tests and Functions build/tests/package/HTTP checks that were previously pending in the preparation report. It does not establish Azure runtime, storage access, company isolation or release approval.

## Retry after IAM setup

The failed jobs were rerun on 2026-10-22 with the original `apply=false` inputs. Azure client-secret login succeeded and selected the designated subscription. Validation then failed with `InvalidTemplateDeployment`: the deployment service principal (object ID `fd774f91-443c-46be-984f-49fa5289614d`) lacks effective `Microsoft.Authorization/roleAssignments/write` permission for the storage role assignment under `rg-vacate-dev`.

The retry was initially blocked pending: grant or correction of **Role Based Access Control Administrator** for the same deployment service principal at `rg-vacate-dev` scope. Any delegation condition must permit assigning **Storage Blob Data Owner** to the Function App's managed identity. Contributor alone does not grant role-assignment writes. At that failed attempt, no infrastructure deployment was attempted and what-if was not reached. This permission blocker was resolved before the successful retry recorded above.

## Original login blocker (resolved on retry)

The error means the selected deployment identity did not see an accessible subscription during login. ASSUMPTION pending Azure-side verification: its resource-group role assignments are missing, reference a different principal, have not propagated, or the credential tenant differs from the subscription directory. The error alone does not distinguish these causes.

Verify that the service principal matching `AZURE_CREDENTIALS.clientId` has Contributor and Role Based Access Control Administrator on `rg-vacate-dev` in subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, and that `AZURE_CREDENTIALS.tenantId` matches that subscription's directory. App registration ownership and API permissions do not grant Azure resource access. No Azure IAM or secret values were changed in this check. The deployment remains configured for client-secret login.

## Workflow maintenance

Updated CI and deployment workflow actions to versions whose official manifests use Node 24: checkout v7, setup-node v7, setup-dotnet v5, upload-artifact v7, download-artifact v8 and Azure/login v3. These changes address action-runtime deprecation warnings independently of the Azure login blocker. Functions artifacts retain hidden files, and artifact names and inputs used by these workflows are preserved.

Acceptance: CI/deployment actions use Node 24 while preserving the existing package and artifact flow; deployment still rejects credentials for a different subscription. Tenant-isolation tests are not applicable to these workflow-only changes because no customer data paths changed.

Verification: official action manifests and used inputs reviewed, workflow YAML parsed, helper shell syntax and `git diff --check` passed. The updated action versions have not yet run in GitHub and need a new push. No product or hosting decision changed.

Source documents changed: `infra/README.md` (login troubleshooting), this report. Workflow sources changed: `.github/workflows/ci.yml`, `.github/workflows/azure-infrastructure.yml`.

Sources checked 2026-10-22: [Azure role assignment](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal), [service-principal secret login](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-secret), [checkout manifest](https://github.com/actions/checkout/blob/v7/action.yml), [setup-node manifest](https://github.com/actions/setup-node/blob/v7/action.yml), [setup-dotnet manifest](https://github.com/actions/setup-dotnet/blob/v5/action.yml), [upload-artifact manifest](https://github.com/actions/upload-artifact/blob/v7/action.yml), [download-artifact manifest](https://github.com/actions/download-artifact/blob/v8/action.yml), [Azure/login manifest](https://github.com/Azure/login/blob/v3/action.yml).

## Reduced logging configuration (not yet cloud-validated)

Following the cost review, dev retains warnings/errors, exceptions and failed executions using the default worker → Functions host → Application Insights pipeline. Successful request telemetry, invocation aggregates, dependency tracking, performance counters and live metrics are disabled. The separate worker OpenTelemetry exporter and its dependencies were removed. Retained diagnostics are not sampled; the workspace cap can still stop collection. The logging filters apply to both the worker and the host.

Bicep keeps monitoring enabled by default but reduces the quota from 1 GB/day to 0.01 GB/day (10 MB). `enableMonitoring=false` conditionally omits the workspace and Insights component and clears the app's Insights connection setting, for eight resources on a fresh deployment. An incremental deployment does not delete old monitoring resources. Standard platform metrics and deployment smoke checks remain; retained application diagnostics require monitoring enabled. No alternate log sink was introduced.

Acceptance scenarios: with monitoring enabled, a controlled warning/error is retained while a successful health execution does not produce normal request telemetry; with monitoring disabled, no Insights connection is configured and a fresh deployment omits both monitoring resources. Azure ingestion/retention and daily-cap behavior still require deployed verification. Customer tenant-isolation tests are not applicable because no customer data path changed; operational messages must not contain employee identifiers, sickness details or request bodies.

Verification: NuGet lockfiles refreshed, API Release build passed with zero warnings/errors, both health contract tests passed and Release publish passed. All environment parameter files and a monitoring-disabled profile compiled. Compiled ARM was inspected for conditional monitoring and an empty connection-string fallback when disabled. These checks do not verify Azure log delivery, quota acceptance or cap enforcement. No cloud configuration was changed.

Source documents updated: `api/README.md`, `infra/README.md`, `infra/cost-estimate.md` and this report. No new product decision was required; production diagnostic and recovery requirements remain open. Sources checked 2026-10-22: [host log categories and failed executions](https://learn.microsoft.com/en-us/azure/azure-functions/configure-monitoring), [host.json telemetry settings](https://learn.microsoft.com/en-us/azure/azure-functions/functions-host-json), [default isolated worker log relay](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide#application-insights), [daily-cap behavior](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/daily-cap).
