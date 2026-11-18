# Azure infrastructure

Bicep and GitHub Actions follow the layout of the local `alcalc` reference project inspected on 2026-10-21. Vacate uses .NET 10 Flex Consumption, managed-identity storage and repository-secret Azure service-principal login, matching `alcalc`. Reference project credentials, pricing claims and application endpoints were not copied.

## Resources and configuration

See the [dev resource inventory and cost estimate](cost-estimate.md), checked 2026-10-22, before applying the first deployment.

`main.bicep` targets an existing resource group. It provisions Angular hosting in Static Web Apps, a Linux Flex Consumption Function App (.NET 10 isolated), private blob containers in a storage account, a user-assigned identity and storage-scoped Blob Data Owner assignment, plus optional Log Analytics and Application Insights. Public network endpoints remain enabled; anonymous blob access and storage shared keys are disabled. CORS allows only the generated frontend origin and does not enable credentials. CORS does not authorise API access.

Edit `parameters/{dev,staging,prod}.bicepparam` for region, naming prefix, Static Web Apps tier and Functions scale limit. Use separate resource groups and target/parameter files for each deployment environment. The workflow does not require GitHub Environments. Names derive from subscription, resource group and environment. Prefixes must be lowercase letters/digits, begin with a letter, and have 2–7 characters. Dev now targets Sweden Central for the regional backend while retaining its Free Static Web App in West Europe. Other environment regions remain configurable; capacity and quotas must be checked before deploying them. Production uses Standard SWA; dev/staging use Free. This is an initial configuration, not an availability or zero-cost commitment. Monitoring is enabled by default with 30-day retention and a 0.025 GB/day (25 MB/day) ingestion cap, which is not a spending ceiling. Worker warning/error logs flow through the Functions host to Application Insights; do not log employee identity, sickness information or request bodies.

SQL resource provisioning is excluded from `main.bicep`. Full SQL backend deployments now run the mandatory [database deployment gate](../docs/database/deployment.md) before publishing application packages; existing database resources remain separately provisioned. The separate [empty SQL free-offer path](../docs/database/azure-sql-operations.md) (VAC-34) uses the separately authorized `sqlLocation: swedencentral` with requested names `vacate-dev-srv` / `vacate-dev-db`; resources live in `modules/sql-free.bicep` behind a SQL-only entry point. SQL-only deployment/readback succeeded after renewed user authorization; the approved Greek/Nordic UTF-8, case-insensitive, accent-sensitive collation is applied and verified. See the runbook/evidence for actual controls and resource IDs. The dev backend is now in Sweden Central; the Free Static Web App and resource-group metadata remain West Europe. ADR-0004 is accepted and the dev API uses SQL resource persistence through managed identity. Production application identity, custom domains, email, private endpoints and policy rules remain outside scope.

## Minimal diagnostics and cheaper option

Dev defaults to `enableMonitoring = true`, `monitoringDailyCapGb = '0.025'`. Azure rejected the earlier 0.01 GB setting on 2026-10-22 because the quota must exceed 0.023 GB; allowed Bicep values now exclude that invalid setting. Host and worker keep warning/error logs, exceptions and failed host executions. Successful request records, invocation aggregates, automatic dependency tracking, performance counters and live metrics are disabled. The separate worker exporter is removed; no success tracing bypasses these host filters. Retained error telemetry is not sampled, but the daily cap stops further ingestion until reset and may overshoot. This removes successful-request history and related Application Insights charts. It does not suppress standard Azure platform metrics.

At 25 MB/day, about 0.775 GB/month would fit under the cap in a 31-day month, before overshoot. This fits the billing account's 5 GB free monthly ingestion allowance if it remains available. If that allowance is already used, 0.775 GB at the checked West Europe rate is about EUR 2.04; neither the volume nor that cost is a hard ceiling. See [the updated estimate](cost-estimate.md).

For zero Application Insights/Log Analytics ingestion from this app, set this in the selected `.bicepparam`:

```bicep
param enableMonitoring = false
```

On a fresh deployment this omits the workspace and Insights component, reducing the inventory from ten to eight resources, and explicitly clears the app's Insights connection string. Platform metrics and deployment HTTP smoke checks remain, but there is no retained searchable application log/exception history. Platform metrics alone do not replace debugging logs. A Blob/custom log sink or another hosted product would need additional code, retention/access controls and its own cost review; it is not added here.

Incremental deployment does not delete existing monitoring resources or historical data when the switch is turned off. VAC-35 explicitly retired the replaced West Europe backend and both unneeded Failure Anomalies alerts after cutover. The Sweden Central workspace quota and deployed warning/error configuration were read back; this verifies configuration, not measured ingestion volume or a hard spending ceiling. See the post-cleanup evidence below.

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

### Database migration identity setup

Follow this one-time setup for the existing dev database before the first full SQL deployment. The [database deployment runbook](../docs/database/deployment.md) owns release ordering, compatibility, verification and recovery. These instructions describe setup; they do not establish that an identity or secret has already been created.

1. In Azure Portal, select the same Entra directory as the SQL server, then open **Microsoft Entra ID → App registrations → New registration**. Name the app `vacate-dev-db-migrator`, select **Accounts in this organizational directory only**, leave the redirect URI empty and register it. Registration creates the tenant's service principal. Copy the **Application (client) ID**; the Object ID is a different value.
2. Open **Certificates & secrets → Client secrets → New client secret**. Choose an expiration and record a rotation reminder. Copy the secret **Value** immediately; the Secret ID cannot authenticate. Keep the value out of chat, source control and logs.
3. Connect as the existing SQL Entra administrator to server `vacate-dev-srv.database.windows.net`, database **`vacate-dev-db`**, through the portal Query editor or VS Code using [these connection instructions](../docs/database/development-access.md). Replace `<APPLICATION-CLIENT-ID>` below with the new app's client ID and run the SQL once:

```sql
IF DB_NAME() <> N'vacate-dev-db'
    THROW 51000, 'Connect to vacate-dev-db before provisioning the migration identity.', 1;

DECLARE @clientId uniqueidentifier = '<APPLICATION-CLIENT-ID>';
DECLARE @sid nvarchar(34) =
    CONVERT(nvarchar(34), CONVERT(varbinary(16), @clientId), 1);

DECLARE @sql nvarchar(max) =
    N'CREATE USER [vacate-dev-db-migrator] WITH SID = '
    + @sid + N', TYPE = E;';

EXEC sys.sp_executesql @sql;

ALTER ROLE [db_owner]
    ADD MEMBER [vacate-dev-db-migrator];
```

This development setup gives the dedicated migrator **full authority within this database** through `db_owner`, including schema/data migrations, permission management and runtime-user impersonation. It is broader than a custom least-privilege role. Do not apply this role to the API runtime identity or treat it as a production permission design. The SID form uses the service principal's client ID directly and does not perform a Microsoft Graph lookup. The migrator does not need a resource-group Contributor role for this SQL-only connection; the existing `AZURE_CREDENTIALS` identity continues to deploy Azure resources.

4. In GitHub, open **Vacate → Settings → Secrets and variables → Actions → New repository secret**. Name it **`AZURE_SQL_MIGRATION_CONNECTION_DEV`**. Set its value to the following connection string, replacing both placeholders:

```text
Server=tcp:vacate-dev-srv.database.windows.net,1433;Database=vacate-dev-db;Authentication=Active Directory Service Principal;User Id=<APPLICATION-CLIENT-ID>;Password="<CLIENT-SECRET-VALUE>";Encrypt=True;TrustServerCertificate=False;Connection Timeout=90;
```

5. Once the workflow changes are merged, run **Deploy Azure** for `dev`, with **`apply=true`** and **`deploy_backend=true`**. Confirm the database step reports migration, runtime-grant and mapped-column verification before the API/frontend publication steps, followed by successful dev database-backed HTTP smoke checks. The workflow never imports fictional fixtures or configures entitlements during deployment; existing records must already be present.

The secret is scoped to the database step and must not be copied into API app settings. Before it expires, create a replacement client secret, update the GitHub connection-string secret and verify a deployment before retiring the old credential. Staging/production need their own identities, database permission review, target connection and `_STAGING`/`_PROD` repository secrets; do not reuse the dev credential.

Sources checked 2026-11-06: [app registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app), [client secret creation](https://learn.microsoft.com/en-us/entra/identity-platform/howto-create-service-principal-portal#option-3-create-a-new-client-secret), [SQL user creation with client ID](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-user-transact-sql#k-create-a-contained-database-user-from-a-microsoft-entra-principal-without-validation), [database role permissions](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/database-level-roles).

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

Run **Deploy Azure** in GitHub Actions, select the environment and leave `apply=false` to compile infrastructure, validate and preview without application builds/tests. Run with `apply=true` from `master` to build fresh deployment packages, validate, show what-if, then apply incrementally to the explicitly selected subscription and group. Application tests run only in PR CI; deployment assumes only green PRs are merged and does not add a post-merge test run. **`deploy_backend` defaults to `true` again for API-backed features (VAC-13)**; retain the **Build and publish API** checkbox for backend changes or the first deployment of a new environment. Workflow runs for the same environment are serialised. Pull requests run one CI workflow, including an infrastructure job that compiles every parameter file without Azure credentials. Deploy Azure is manual-only. The workflow prints resource names and URLs, not credentials. Retrying the same configuration should update the same resources; RBAC propagation can briefly delay runtime storage access.

The founder requested the original temporary deployment shortcut on 2026-10-23; API-backed work on 2026-10-27 restores full delivery by default. [VAC-7](../docs/jira/VAC-7-optional-backend-deployment.md) records the historical scope and verification. With `deploy_backend=false`, the deployment build skips .NET restore/publish, API/database packaging/upload, API artifact download and API publishing. Frontend build/packaging and Bicep validation/what-if/apply continue; application tests and fixture/browser suites remain in PR CI for either deployment mode. Existing API code stays at its previous version. Infrastructure still applies the selected environment's complete Bicep configuration; this switch controls application build/publishing, not resource provisioning.

Frontend-only smoke checks verify the new web revision, configured API URL, Angular entry/bundles/login routes, cache headers and Angular deep links without calling API health/CORS or demanding a matching API revision. The deployment summary explicitly says the API checks/publish were skipped. Enable `deploy_backend=true` to restore API build/package/publish and same-revision API/CORS smoke checks. **Automatic CI runs on PRs only and retains full backend checks**; feature-branch pushes and merge/direct pushes to master do not trigger a second CI run. Superseded validation runs for the same PR are cancelled. Manual deployment builds remain independent and are not cancelled by PR updates.

Equivalent commands after `az login`:

```sh
az deployment group validate --subscription SUBSCRIPTION_ID --resource-group RESOURCE_GROUP --parameters infra/parameters/dev.bicepparam
az deployment group what-if --subscription SUBSCRIPTION_ID --resource-group RESOURCE_GROUP --parameters infra/parameters/dev.bicepparam
az deployment group create --subscription SUBSCRIPTION_ID --resource-group RESOURCE_GROUP --parameters infra/parameters/dev.bicepparam
```

The CI workflow builds/tests the Functions API and Angular app on Ubuntu, starts the real Functions host, and exercises the API/browser journeys. **Deploy Azure** does not call CI: `apply=true` builds fresh packages from the dispatch's `master` commit without unit/integration/browser tests. It consumes only artifacts created by that same deployment run and revision; it never selects the latest artifact from a PR or another run. PR CI and its artifact cleanup remain unchanged. Deployment artifacts have one-day retention and are deleted after success, failure or cancellation on a best-effort basis. Failed or incomplete builds block apply independently of cleanup; leftover artifacts from another run cannot be selected.

With `apply=true`, deployment provisions infrastructure, applies and verifies pending database migrations/runtime grants for a SQL backend, optionally publishes the Functions package (including `.azurefunctions/`), writes public frontend runtime configuration from Bicep outputs, uses the optional repository Static Web Apps token or retrieves and masks the provisioned site token after Azure login, and publishes Angular. `apply=false` skips application builds and previews infrastructure only; successful infrastructure compilation is still required. Failed/cancelled compilation blocks preview, and failed/skipped/cancelled application builds block apply. Database gates and post-deployment smoke checks remain enabled. Merge alone never deploys. Only-green-PR merges are the owner's operating assumption; this workflow does not enforce branch protection or query PR status. See [VAC-38](../docs/jira/VAC-38-ci-trigger-deduplication.md).

Post-deploy checks poll for up to 24 attempts. Full dev SQL deployments additionally read fictional own membership and leave requests, then revoke their ephemeral session. Full deployments verify API liveness and Git revision, the frontend revision and API origin, deep-link routes, and allowed/denied CORS origins. Frontend-only deployments use the limited web checks described above and do not claim API verification. These are HTTP smoke checks, not a full browser or release approval. Static Web Apps remains a separate frontend origin without linked-backend assumptions. Authentication/session/CSRF decisions must precede personal-data endpoints.

## First cloud release

1. Complete the Azure setup and add the `AZURE_CREDENTIALS` repository secret above. Dev uses the checked-in subscription and `rg-vacate-dev`; conflicting repository target variables or a credentials JSON naming another subscription fail before login.
2. For SQL backend releases, configure the environment-specific `AZURE_SQL_MIGRATION_CONNECTION_DEV` (or `_STAGING`/`_PROD`) secret using the separate migration identity described in the [database deployment runbook](../docs/database/deployment.md). Missing or mismatched credentials block application publication.
3. Commit and push the changes to the trusted deployment branch so GitHub can discover the workflows. A local uncommitted checkout cannot be dispatched by GitHub.
4. Run **Deploy Azure** for `dev`, first with `apply=false` to check infrastructure compilation, Azure validation and what-if without application builds. Use **`deploy_backend=true`** for the subsequent first/full apply, which builds the API/database/web packages and retains database verification and deployed HTTP smoke checks.
5. Run the same commit with `apply=true`, keeping `deploy_backend=true` for the first/full release. The job summary reports the web URL, API health URL and deployed revision after smoke checks pass. Later UI-only releases can leave `deploy_backend=false` to retain the existing API.
6. Open the web URL and reload `/leave` directly. Confirm the shell and placeholder pages render, `config.json` names the expected API and `/api/health` returns healthy. No employee records are supported by this release.

There is no atomic rollback across Functions and Static Web Apps. If publishing or smoke checks fail, the workflow fails visibly; inspect the failed step, then redeploy a known good commit using the same environment. Do not delete the resource group or roll back database migrations. Preserve applied migration history and review compatibility before publishing older code; the operator rejects unknown/newer history and never downgrades it. Changing environment infrastructure settings must be reviewed independently when redeploying older code.

### Fictional demo sign-in in dev

GitHub deployments to `dev` with `apply=true` enable `DevelopmentAuthentication__Enabled` through Bicep. Published builds contain no fixture loader or test roster. SQL hosts read existing database records; ordinary InMemory hosts start empty. The obsolete `SeedData__Enabled` setting is no longer read or provisioned. A preview with `apply=false` does not change settings. Staging and production deployments disable development authentication. The current dev target uses subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, resource group `rg-vacate-dev`, and Function App `vacate-dev-sc-wv5pdctnrzamu-api` (API URL: `https://vacate-dev-sc-wv5pdctnrzamu-api.azurewebsites.net`). The public dev accounts require explicitly provisioned DevelopmentLogins rows for active users in a marked test organization; deployment/restart does not create them. See the [database test-data runbook](../docs/database/test-data.md).

To check the active settings in the VS Code integrated terminal:

```sh
az account set --subscription 07d79495-1f4f-40fd-9fdf-84605214e5e6
az functionapp config appsettings list \
  --resource-group rg-vacate-dev \
  --name vacate-dev-sc-wv5pdctnrzamu-api \
  --query "[?name=='DevelopmentAuthentication__Enabled'].[name,value]" \
  --output table
```

This deliberately enables shared, predictable demo credentials on a publicly reachable API. Use only for fictional dev data; never enable these settings in staging or production. A subsequent Bicep deployment to dev re-applies the settings. Newly API-created users have no development login until an operator explicitly adds an enabled DevelopmentLogins row for an active marked test organization. The dev API uses SQL for resource data and the explicitly imported fictional fixtures; host startup does not migrate or reseed SQL. SQL mode persists hashed shared sessions in the same database; production identity remains separate. Database development login provisioning and the one-time business-data update must precede publication of this cleanup; see [test data cutover](../docs/database/test-data.md).

## Acceptance and verification

The compiled Functions template is checked by `scripts/verify-functions-template.py` before infrastructure validation. Azure SQL environment suffixes already start with a dot: concatenate the server name directly with the suffix. [VAC-39](../docs/jira/VAC-39-login-unavailable.md) records the deployed sign-in outage caused by a duplicate separator and its hostname-only repair. API `/health` reports liveness, not database readiness.

- Given a PR modifying infrastructure, all environment parameter files compile without Azure login.
- Given a valid `AZURE_CREDENTIALS` repository secret and an existing target group, preview validates and reports changes without applying them.
- Given `apply=true` and successful build checks, deployment creates/updates infrastructure, publishes the same commit to both hosts and verifies revision and endpoint checks; a repeat run retains stable resource names.
- Current dev verification: destination resources, HTTPS health/revision, exact-origin CORS, managed-identity SQL access, restart persistence and SQL validation/what-if passed; see VAC-35 post-cleanup evidence. Check these again for a changed target or configuration.
- Environment isolation: deploy dev and staging to distinct groups and confirm distinct storage accounts, identities and resource IDs. Actual-SQL and hosted HTTP checks cover current company isolation. Separate dev/staging deployment isolation has not been exercised by this relocation.

Earlier app and infrastructure verification is recorded in [the first cloud release report](../docs/cloud-deploy-2026-10-21.md) and [cloud validation report](../docs/cloud-validation-2026-10-22.md). Current relocation acceptance is recorded in [VAC-35 post-cleanup verification](../docs/jira/media/VAC-35/verification-post-cleanup-2026-11-02.md), including resource retirement and deployed monitoring configuration. Actual ingestion volume and full native-browser acceptance are not claimed by those configuration checks.

Sources checked 2026-10-21: [isolated .NET worker](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide), [Functions publishing action](https://github.com/Azure/functions-action), [Static Web Apps build and publishing](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration), [Functions infrastructure](https://learn.microsoft.com/en-us/azure/azure-functions/functions-infrastructure-as-code), [identity-based host storage](https://learn.microsoft.com/en-us/azure/azure-functions/manage-connections), [Functions runtime versions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-versions), [Azure service-principal secret login](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-secret).

Frontend source and lockfile live in `frontend/`. CI publishes the built Angular index directly; `scripts/prepare-frontend.py` stamps revision metadata without overwriting it. The earlier static-gallery packaging pipeline is retired by VAC-10.

The API-backed fictional settings iteration (VAC-13) requires development sign-in and seed adapters, which are enabled only in dev through the environment-specific settings above. The original iteration used memory resource adapters; current dev resources and hashed shared sessions persist in SQL; this remains a fictional demo configuration, not a real-data or production authentication setup. Full CI also verifies built Angular against a running Functions host with fictional seed data; an explicitly selected frontend-only deployment leaves the existing API untouched.

## Current dev target and entry points · VAC-35

`targets/dev.json` selects Sweden Central for the regional backend/SQL and explicitly selects DevelopmentOpen for initial SQL IP access. Keep the existing Free Static Web App in West Europe: that service does not offer Sweden Central and its assets are globally delivered. The browser calls the new API over HTTPS with exact-origin CORS.

- `main.bicep` + `parameters/dev.bicepparam`: current backend/frontend desired state; backend resources live in `modules/functions-backend.bicep`, with shared static-site and monitoring modules. Dev uses the `sc` name suffix and explicit SQL persistence; other environment defaults are preserved.
- `deployments/sql.bicep`: SQL-only resource deployment through `modules/sql-free.bicep`, never redeploying application resources. It defaults to closed public networking; explicitly pass `publicNetworkAccess=Enabled` to preserve the currently authorized initial-development route.
- `deployments/sql-access.bicep`: separate dev firewall configuration through its module. DevelopmentOpen is the explicit user-approved all-IPv4 exception; Entra-only authentication/TLS/app grants stay enforced. Restricted mode requires an allowlist and explicit removal of an already deployed open rule.

The one-time relocation wrapper was removed after cutover. [SQL operations](../docs/database/azure-sql-operations.md), [human query access](../docs/database/development-access.md), [Stage A implementation](../docs/database/implementation-stage-a.md) and [VAC-35 evidence](../docs/jira/media/VAC-35/regional-preflight-2026-11-02.md) contain the operational boundaries. Historical migration planning is archived with the issue, not kept as another active root runbook.

SQL stays on the actual free offer with useFreeLimit=true / AutoPause, 32 GiB maximum, local short-term backups, no LTR or paid Defender/network dependency. Replacement runtime storage and light diagnostics were separately approved at minimum cost. FC1 stays on demand with no always-ready instances and can bill beyond its shared free grant. Logs retain warnings/errors with the smallest supported configured 0.025 GB/day cap; that cap is not a hard spending limit. See the issue's verified Sweden Central public rates rather than treating the older West Europe estimate as a current quote.
