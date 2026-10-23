# Azure infrastructure

Bicep and GitHub Actions follow the layout of the local `alcalc` reference project inspected on 2026-10-21. Vacate uses .NET 10 Flex Consumption, managed-identity storage and repository-secret Azure service-principal login, matching `alcalc`. Reference project credentials, pricing claims and application endpoints were not copied.

## Resources and configuration

See the [dev resource inventory and cost estimate](cost-estimate.md), checked 2026-10-22, before applying the first deployment.

`main.bicep` targets an existing resource group. It provisions Angular hosting in Static Web Apps, a Linux Flex Consumption Function App (.NET 10 isolated), private blob containers in a storage account, a user-assigned identity and storage-scoped Blob Data Owner assignment, plus optional Log Analytics and Application Insights. Public network endpoints remain enabled; anonymous blob access and storage shared keys are disabled. CORS allows only the generated frontend origin and does not enable credentials. CORS does not authorise API access.

Edit `parameters/{dev,staging,prod}.bicepparam` for region, naming prefix, Static Web Apps tier and Functions scale limit. Use separate resource groups and target/parameter files for each deployment environment. The workflow does not require GitHub Environments. Names derive from subscription, resource group and environment. Prefixes must be lowercase letters/digits, begin with a letter, and have 2–7 characters. West Europe is a configurable starting assumption; region capacity and subscription quotas are UNVERIFIED until Azure validation/deployment. Production uses Standard SWA; dev/staging use Free. This is an initial configuration, not an availability or zero-cost commitment. Monitoring is enabled by default with 30-day retention and a 0.025 GB/day (25 MB/day) ingestion cap, which is not a spending ceiling. Worker warning/error logs flow through the Functions host to Application Insights; do not log employee identity, sickness information or request bodies.

SQL, application identity/login, custom domains, email, private endpoints and policy rules are not provisioned. Database selection and company isolation remain open under ADR-0001.

## Minimal diagnostics and cheaper option

Dev defaults to `enableMonitoring = true`, `monitoringDailyCapGb = '0.025'`. Azure rejected the earlier 0.01 GB setting on 2026-10-22 because the quota must exceed 0.023 GB; allowed Bicep values now exclude that invalid setting. Host and worker keep warning/error logs, exceptions and failed host executions. Successful request records, invocation aggregates, automatic dependency tracking, performance counters and live metrics are disabled. The separate worker exporter is removed; no success tracing bypasses these host filters. Retained error telemetry is not sampled, but the daily cap stops further ingestion until reset and may overshoot. This removes successful-request history and related Application Insights charts. It does not suppress standard Azure platform metrics.

At 25 MB/day, about 0.775 GB/month would fit under the cap in a 31-day month, before overshoot. This fits the billing account's 5 GB free monthly ingestion allowance if it remains available. If that allowance is already used, 0.775 GB at the checked West Europe rate is about EUR 2.04; neither the volume nor that cost is a hard ceiling. See [the updated estimate](cost-estimate.md).

For zero Application Insights/Log Analytics ingestion from this app, set this in the selected `.bicepparam`:

```bicep
param enableMonitoring = false
```

On a fresh deployment this omits the workspace and Insights component, reducing the inventory from ten to eight resources, and explicitly clears the app's Insights connection string. Platform metrics and deployment HTTP smoke checks remain, but there is no retained searchable application log/exception history. Platform metrics alone do not replace debugging logs. A Blob/custom log sink or another hosted product would need additional code, retention/access controls and its own cost review; it is not added here.

Incremental deployment does not delete existing monitoring resources or historical data when the switch is turned off. No resources have been removed by this change. The new quota and cloud log routing still need Azure validation and a deployed ingestion check; their successful compilation is not proof of provider acceptance or runtime export.

## One-time Azure and GitHub setup

Use **repository secrets**, following `alcalc`. No GitHub Environment, federated credential, or separate client/tenant variable is required. The first dev target is subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, resource group `rg-vacate-dev`, in `targets/dev.json` (subscription confirmed 2026-10-21; resource-group name corrected by the founder 2026-10-22).

### Manual portal setup

1. In Azure Portal, create resource group `rg-vacate-dev` in the designated subscription, in West Europe.
2. In that subscription's Entra directory, create an app registration named `alxkio-vacate-dev-deploy`, with single-directory account type and no redirect URI. Record the Application (client) ID and Directory (tenant) ID.
3. In the app registration, open **Certificates & secrets → Client secrets → New client secret**. Copy the secret **Value** when created, and record its expiry. The Secret ID is not the credential value.
4. On **rg-vacate-dev → Access control (IAM)**, grant the app's service principal **Contributor** and **Role Based Access Control Administrator** at resource-group scope. The second role is needed for Bicep's storage role assignment. Role-assignment conditions may restrict delegation to Storage Blob Data Owner for service principals.
5. In the subscription's **Resource providers**, register `Microsoft.Web`, `Microsoft.Storage`, `Microsoft.ManagedIdentity`, `Microsoft.OperationalInsights` and `Microsoft.Insights` if needed.
6. Open **Vacate → Settings → Secrets and variables → Actions → New repository secret**. Name it `AZURE_CREDENTIALS` and enter this JSON, replacing the three placeholders:

```json
{
  "clientId": "APPLICATION_CLIENT_ID",
  "clientSecret": "CLIENT_SECRET_VALUE",
  "tenantId": "DIRECTORY_TENANT_ID",
  "subscriptionId": "07d79495-1f4f-40fd-9fdf-84605214e5e6"
}
```

This is a deployment identity; it does not change customer account authentication. Renew its client secret and update `AZURE_CREDENTIALS` before expiry. Repository secrets apply to deployment runs across configured environments; separate deployment credentials can be introduced when another environment is actually needed.

`SWA_DEPLOYMENT_TOKEN` is also supported as an optional repository secret, matching the name in `alcalc`. It must belong to the **Vacate** Static Web App. If absent, the workflow retrieves and masks the provisioned Vacate site's token using the Azure login. This lets the first deployment provision and publish the frontend in one run. The `alcalc` site's token must not be reused for Vacate.

### Optional setup helper

After `az login`, an administrator with Azure resource, application and role-assignment permissions can run:

```sh
bash scripts/setup-azure-deploy.sh dev alxkio/vacate
```

The helper creates/reuses the group and deployment app, registers providers, grants the required group-scoped roles, and appends a one-year client secret. It saves the `AZURE_CREDENTIALS` JSON to an owner-only temporary file and prints its path. Save its contents as the repository secret, then remove that local file. The helper does not deploy resources inside the group or modify GitHub settings, and has not been run here. Re-running appends a credential; existing credentials are preserved.

## Azure login troubleshooting

The first hosted attempt and its outcome are recorded in [cloud validation evidence](../docs/cloud-validation-2026-10-22.md).

If `azure/login` reports **No subscriptions found**, the deployment app is not seeing an accessible subscription in the selected tenant. Verify that `AZURE_CREDENTIALS.clientId` identifies the app granted **Contributor** and **Role Based Access Control Administrator** on `rg-vacate-dev`, and that its `tenantId` is the directory containing subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`. Application registration ownership and API permissions do not grant Azure resource access. Allow new role assignments time to propagate, then rerun the failed job. Persistent failures after those checks need Azure-side investigation; this message alone does not prove which setting is wrong.

If login succeeds but validation reports missing **Microsoft.Authorization/roleAssignments/write**, the deployment service principal needs effective **Role Based Access Control Administrator** on the target resource group in addition to Contributor. If that role has a delegation condition, it must allow **Storage Blob Data Owner** assignments to the Function App's managed identity. The deployment identity assigns this role so Functions can access its storage without account keys.

## Deployment

Run **Deploy Azure** in GitHub Actions, select the environment and leave `apply=false` to validate and preview. Run with `apply=true` to validate, show what-if, then apply incrementally to the explicitly selected subscription and group. **Temporarily, `deploy_backend` defaults to `false` for UI-only deploys**; enable the **Build, test and publish API** checkbox for backend changes or the first deployment of a new environment. Workflow runs for the same environment are serialised. Pull requests compile every parameter file without Azure credentials. The workflow prints resource names and URLs, not credentials. Retrying the same configuration should update the same resources; RBAC propagation can briefly delay runtime storage access.

The founder requested this temporary deployment shortcut on 2026-10-23; [VAC-7](../docs/jira/VAC-7-optional-backend-deployment.md) records scope and verification. With `deploy_backend=false`, the deployment's reused CI skips .NET restore/build/tests, Functions host startup, API packaging/upload, API artifact download and API publishing. Frontend build/tests, fixture checks, packaging and Bicep validation/what-if/apply continue. Existing API code stays at its previous version. Infrastructure still applies the selected environment's complete Bicep configuration; this switch controls application build/publishing, not resource provisioning.

Frontend-only smoke checks verify the new web revision, configured API URL, gallery/login/assets, cache headers and Angular deep links without calling API health/CORS or demanding a matching API revision. The deployment summary explicitly says the API checks/publish were skipped. Enable `deploy_backend=true` to restore full API build/tests/package/publish and same-revision API/CORS smoke checks. **Regular push/PR CI retains full backend checks**; only the manual deployment's duplicate backend work is optional. Revisit the temporary default when backend implementation resumes.

Equivalent commands after `az login`:

```sh
az deployment group validate --subscription SUBSCRIPTION_ID --resource-group RESOURCE_GROUP --parameters infra/parameters/dev.bicepparam
az deployment group what-if --subscription SUBSCRIPTION_ID --resource-group RESOURCE_GROUP --parameters infra/parameters/dev.bicepparam
az deployment group create --subscription SUBSCRIPTION_ID --resource-group RESOURCE_GROUP --parameters infra/parameters/dev.bicepparam
```

The CI workflow builds/tests the Functions API and Angular app on Ubuntu, starts the real Functions host for an HTTP liveness check, and uploads both application artifacts. **Deploy Azure** reuses frontend checks for the selected commit before any Azure changes, including backend checks when `deploy_backend=true`. With `apply=true`, it provisions infrastructure, optionally publishes the Functions package (including `.azurefunctions/`), writes public frontend runtime configuration from Bicep outputs, uses the optional repository Static Web Apps token or retrieves and masks the provisioned site token after Azure login, and publishes Angular. No manually maintained deployment token is needed. `apply=false` builds the selected components and previews only.

Post-deploy checks poll for up to 24 attempts. Full deployments verify API liveness and Git revision, the frontend revision and API origin, deep-link routes, and allowed/denied CORS origins. Frontend-only deployments use the limited web checks described above and do not claim API verification. These are HTTP smoke checks, not a full browser or release approval. Static Web Apps remains a separate frontend origin without linked-backend assumptions. Authentication/session/CSRF decisions must precede personal-data endpoints.

## First cloud release

1. Complete the Azure setup and add the `AZURE_CREDENTIALS` repository secret above. Dev uses the checked-in subscription and `rg-vacate-dev`; conflicting repository target variables or a credentials JSON naming another subscription fail before login.
2. Commit and push the changes to the trusted deployment branch so GitHub can discover the workflows. A local uncommitted checkout cannot be dispatched by GitHub.
3. Run **Deploy Azure** for `dev`, first with `apply=false` and **`deploy_backend=true`** for a first/full release. Check compilation, tests, Functions host startup, Azure validation and what-if.
4. Run the same commit with `apply=true`, keeping `deploy_backend=true` for the first/full release. The job summary reports the web URL, API health URL and deployed revision after smoke checks pass. Later UI-only releases can leave `deploy_backend=false` to retain the existing API.
5. Open the web URL and reload `/leave` directly. Confirm the shell and placeholder pages render, `config.json` names the expected API and `/api/health` returns healthy. No employee records are supported by this release.

There is no atomic rollback across Functions and Static Web Apps. If publishing or smoke checks fail, the workflow fails visibly; inspect the failed step, then redeploy a known good commit using the same environment. Do not delete the resource group or roll back database migrations. This first release has no database migrations. Changing environment infrastructure settings must be reviewed independently when redeploying older code.

## Acceptance and verification

- Given a PR modifying infrastructure, all environment parameter files compile without Azure login.
- Given a valid `AZURE_CREDENTIALS` repository secret and an existing target group, preview validates and reports changes without applying them.
- Given `apply=true` and successful build checks, deployment creates/updates infrastructure, publishes the same commit to both hosts and verifies revision and endpoint checks; a repeat run retains stable resource names.
- Azure verification still required: inspect deployment outputs, HTTPS endpoints, exact-origin CORS, identity storage access and repeat-deployment what-if. The published health function must pass the application health check.
- Environment isolation: deploy dev and staging to distinct groups and confirm distinct storage accounts, identities and resource IDs. Customer tenant-isolation tests are not applicable to this health-and-hosting release; no customer data paths were added. Existing app tenant isolation remains UNVERIFIED.

Earlier app and infrastructure verification is recorded in [the first cloud release report](../docs/cloud-deploy-2026-10-21.md) and [cloud validation report](../docs/cloud-validation-2026-10-22.md). The reduced logging configuration has been compiled and locally built/tested; Azure validation and log-ingestion checks for these new settings remain pending. The published package passed local HTTP liveness/revision checks with Core Tools 4.16.0. No resources were created by this change.

Sources checked 2026-10-21: [isolated .NET worker](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide), [Functions publishing action](https://github.com/Azure/functions-action), [Static Web Apps build and publishing](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration), [Functions infrastructure](https://learn.microsoft.com/en-us/azure/azure-functions/functions-infrastructure-as-code), [identity-based host storage](https://learn.microsoft.com/en-us/azure/azure-functions/manage-connections), [Functions runtime versions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions), [Azure service-principal secret login](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-secret).
