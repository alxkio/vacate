# Azure SQL free-offer operations

[VAC-34](../jira/VAC-34-empty-azure-sql-free-offer.md) · 2026-11-01 · **Provisioned in Sweden Central; UTF-8 collation and cost/security controls verified.**

[SQL-only entry point](../../infra/deployments/sql.bicep) is a thin deployment wrapper using [the SQL resource module](../../infra/modules/sql-free.bicep), following the existing module convention. It does not import `main.bicep`, change Function App settings or publish an application. Use the existing subscription/resource group in [dev target](../../infra/targets/dev.json), with its separately authorized `sqlLocation: swedencentral`. The original VAC-34 provisioning left the application in West Europe; VAC-35 later relocated the backend to Sweden Central. Resource-group metadata stays West Europe. Resource names are fixed to `vacate-dev-srv` and `vacate-dev-db`, as requested by the user. Never run the full Deploy Azure workflow for this task. No application tables, EF migrations, seeds, users or invitations belong in this deployment.

## Verified target and deployment evidence

The [initial verification record](../jira/media/VAC-34/verification-2026-11-01.md) documents the original West Europe attempt and its regional restriction. The user subsequently authorized Sweden Central for SQL only, then specified server `vacate-dev-srv` and database `vacate-dev-db`. No application service or resource-group location is changed.

The [current Sweden Central record](../jira/media/VAC-34/verification-sweden-central-2026-11-01.md) supersedes the original proposed location/naming. After an initial declined CLI request, the user explicitly authorized checks again. Fresh checks confirm regional/server/SKU availability, one free slot remaining, requested server-name availability, resolved operator identity, paid Defender plan not enabled and no inherited policies returned. ARM validation and what-if passed; six SQL resources/configurations are Create, eight existing resources Ignore. Deployment succeeded after the API-required disabled-LTR correction; actual readback confirms the cost/security controls. The later approved recreation also succeeded with the requested Greek/Nordic UTF-8, case-insensitive, accent-sensitive collation. See the current record for resource IDs and final readback.

Current preflight confirms the enabled subscription, no existing SQL servers, FreeLimitQuota limit1/used0 and name availability for vacate-dev-srv; the earlier subscription policy response identifies Pay-As-You-Go. All are recorded before applying the exact compiled module. Microsoft.Sql was registered in the earlier session. The generic ten-database documentation limit is not a substitute for the actual current quota.


## Cost and security controls

| Resource / feature | Verified controls and cost basis |
|---|---|
| Logical server | Logical management container only; no VM/Managed Instance/compute plan. Entra-only administrator resolved from actual current signed-in user in subscription tenant, no SQL password; TLS >=1.2; public network disabled; no firewall rules, private endpoints or role grants |
| Database | GeneralPurpose / GP_S_Gen5, maximum 2 vCores, minimum 0.5; hardcoded `useFreeLimit: true`, `freeLimitExhaustionBehavior: 'AutoPause'`; new empty Default create mode |
| Data storage | maxSizeBytes 34359738368 (32 GiB API size corresponding to documented 32 GB offer); no sample database/import/schema |
| Backup | Local redundancy, seven-day short-term retention, weekly/monthly/yearly LTR all PT0S. The API additionally requires weekOfYear1 even while yearly retention is zero; that field does not enable retention. Free offer includes 32 GB backup allowance; AutoPause is retained as the service free-limit behavior. Template cannot independently set a backup-byte ceiling; do not claim a measured backup cap before provider confirmation/readback. No workload or backup copies are created |
| Monitoring/security | Server auditing and security alerts disabled; subscription SqlServers pricing API returned `pricingTier: Free`, indicating the paid plan is not enabled at subscription scope; no diagnostics/export/workspace/storage sink/Defender trial/paid dependencies. Standard control-plane validation only |
| Other capabilities | No zone redundancy, read replicas, elastic pool, failover group, ledger, paid fallback, automatic upgrade, email or private endpoint |

**Zero cost is conditional on current offer eligibility and successful cost/feature validation, not trial credits or a spending-limit setting.** Subscription spendingLimit is Off; that is not a cost control. The free-limit and AutoPause settings are the relevant controls. Do not deploy an ordinary serverless database in place of the free offer. A future operator must not remove free limits, choose BillOverUsage or automatically upgrade when paused.

Microsoft's free offer supplies 100,000 vCore-seconds, 32 GB data and 32 GB backup per database each month for the subscription lifetime. Allowance exhaustion pauses access until the next calendar month; unused compute does not carry forward. Current documentation says idle pause is fixed at 15 minutes, but this deployment's actual API readback reports `autoPauseDelay: 60`. Preserve and report the observed value; it is distinct from the verified monthly-exhaustion AutoPause control. No attempt is made to force an unsupported delay or enable paid usage to reconcile the discrepancy. Open query-tool connections may keep consuming allowance. Downtime is accepted; no paid resume mechanism is included. No recurring alert or ingestion service is added.

Defender for SQL is a paid service, excluded from this task. The generic Defender for Cloud pricing API uses `Free` to represent the subscription plan setting without the paid SQL plan enabled; this is not a free Defender for SQL protection offer. New-resource overrides and inherited paid enablement still require checking. No Defender trial may be started. See [Microsoft Defender for SQL](https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-defender-for-sql) and the [pricing API](https://learn.microsoft.com/en-us/rest/api/defenderforcloud/pricings/get), checked 2026-11-01.

## Compile, lint and preview

Use a current official Bicep compiler. CLI 0.23.1 compiles but lacks current SQL types and warns; the verification record distinguishes that initial check from current-schema linting. Generated ARM and local parameters go outside the repo. The deployment wrapper contains only the inline Incremental SQL module; the compiled ARM verifier inspects both the wrapper and nested SQL resources, including fixed names and literal cost controls. The current-user administrator must be explicitly resolved, never replaced by a guessed object ID or the application identity.

Example preview sequence from repository root, using a trusted current `bicep` executable:

```sh
bicep build infra/deployments/sql.bicep --outfile /private/tmp/vacate-sql-free.json
bicep lint infra/deployments/sql.bicep
python3 scripts/verify-sql-free-template.py /private/tmp/vacate-sql-free.json
python3 - <<'PY'
import json
import subprocess
from pathlib import Path


def az(*args):
    return json.loads(subprocess.check_output(['az', *args, '--output', 'json'], text=True))


target = json.loads(Path('infra/targets/dev.json').read_text())
account = az('account', 'show', '--subscription', target['subscriptionId'])
group = az('group', 'show', '--subscription', target['subscriptionId'], '--name', target['resourceGroup'])
if account['id'] != target['subscriptionId'] or account['state'] != 'Enabled':
    raise SystemExit('Unexpected or disabled subscription')
if group['location'] != target['location'] or target.get('sqlLocation') != 'swedencentral':
    raise SystemExit('Unexpected resource-group or authorized SQL region')
user = az('ad', 'signed-in-user', 'show')
if account['user']['type'] != 'user':
    raise SystemExit('Current-user administrator mapping requires a signed-in user')
values = {
    'location': target['sqlLocation'],
    'administratorObjectId': user['id'],
    'administratorLogin': user['userPrincipalName'],
    'tenantId': account['tenantId'],
}
Path('/private/tmp/vacate-sql-parameters.json').write_text(json.dumps({
    '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',
    'contentVersion': '1.0.0.0',
    'parameters': {key: {'value': value} for key, value in values.items()},
}))
PY
az deployment group validate --subscription 07d79495-1f4f-40fd-9fdf-84605214e5e6 --resource-group rg-vacate-dev --template-file /private/tmp/vacate-sql-free.json --parameters @/private/tmp/vacate-sql-parameters.json
az deployment group what-if --subscription 07d79495-1f4f-40fd-9fdf-84605214e5e6 --resource-group rg-vacate-dev --template-file /private/tmp/vacate-sql-free.json --parameters @/private/tmp/vacate-sql-parameters.json
```

Azure CLI should use the confirmed subscription as its active context for the signed-in-user directory lookup; verify its tenant matches the account response. Service-principal automation requires a separately resolved approved Entra administrator mapping and is deliberately not guessed here.

Read subscription SQL `locations/swedencentral/capabilities` and `usages` via REST API 2023-08-01; require region/server/GeneralPurpose/GP_S_Gen5_2 status Available or Default, supported minimum 0.5, 32 GiB size and AutoPause behavior, and, before any new/recreated database, FreeLimitQuota remaining >0. Updating the already verified owned database does not require an additional slot; it must not create a second database or adopt an unrelated server. Inspect existing free databases subscription-wide for incompatible first-free-database region. Read Defender pricing and inherited policy assignments again; any paid deployment effect or unreadable relevant scope blocks apply. Recheck no name collision to an existing unrelated SQL server.

Review every what-if change. For an initial deployment only server, database and the four explicitly disabled/bounded SQL configuration resources may be Create; unrelated resources must be Ignore/NoChange. For a correction/reapply, reviewed modifications may target only the SQL resources created by this task while preserving all literal free/cost/security controls. Distinguish provider-default projection differences from meaningful changes; stop on deletions, unrelated modifications, unsupported/unknown changes or implicit paid features. Compile/guard success does not override a blocked regional capability response. There is no automatic apply path in the existing app workflow.

## Apply and readback boundary

The SQL-only template is applied in **Incremental** mode to the existing dev subscription/group only after the Sweden Central gates pass. This session invoked that conditional apply as deployment `vacate-dev-sql-free-20261101`; see the current evidence for its final result and actual readback. Re-run validation/what-if with the current names and SQL location first; historical West Europe what-if does not validate these changes. No further region substitution or paid fallback is covered. Microsoft documents that the first free database's region fixes the region for subsequent free databases in the subscription; the user authorized Sweden Central after this consequence was explained.

After an authorized apply, read the actual database with `az sql db show` or REST, and record resource IDs, provisioning state, sku, useFreeLimit=true, freeLimitExhaustionBehavior=AutoPause, maxSizeBytes<=34359738368, current/requested Local backup redundancy, zoneRedundant=false and readScale=Disabled. Read server Entra-only/TLS/public-network settings, STR/LTR, auditing/security alerts, subscription paid Defender plan status and per-server overrides and actual child-resource inventory. Missing or conflicting cost settings are a failed acceptance, never a reason to enable paid usage. No SQL connection/firewall exception is needed for control-plane readback. Empty create mode and absence of migrations are infrastructure evidence; do not claim a queried schema inventory without a SQL connection.

Record deployed properties and pause behavior in VAC-34 before completion. Application integration, schema creation, policy calculation and identity/session/onboarding remain VAC-26 and later work. Free-tier restore/copy is unsupported per FAQ; no paid recovery target is authorized.

Sources checked 2026-11-01: [Microsoft free tier](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier), [free-tier FAQ](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier-faq), [database ARM reference](https://learn.microsoft.com/en-us/azure/templates/microsoft.sql/2023-08-01/servers/databases), [subscription quota API](https://learn.microsoft.com/en-us/rest/api/sql/subscription-usages/get).

## Current database collation and application identity

Actual database collation is now **`Latin1_General_100_CI_AS_SC_UTF8`**, verified after the approved recreation. It supports Unicode Greek/Nordic text, ignores case and keeps accents distinct. This does not select a country-specific alphabetical order or alter explicit future username normalization/comparison rules. Proposed nvarchar columns remain UTF-16 Unicode; UTF-8 applies to varchar defaults.

The original creation used SQL_Latin1_General_CP1_CI_AS. Azure SQL requires recreation to change database collation, per the [modifiable configuration reference](https://learn.microsoft.com/en-us/azure/azure-sql/database/modifiable-configuration-reference?view=azuresql-db), checked2026-11-01. The user explicitly approved deletion of only vacate-dev-db; server retained. Creation was held while the slot was still occupied, then proceeded only after quota returned to used0/limit1. No paid copy/restore/fallback was used. Final deployment `vacate-dev-sql-utf8-20261101` Succeeded, with actual free-limit/AutoPause/Local/zero-LTR controls checked again. See [final readback](../jira/media/VAC-34/sweden-central-utf8-readback.json).

Entra-only authentication remains enabled, with the resolved operator as administrator. No app database principal, password, connection string setting or application integration was created. VAC-26 should resolve the existing app managed identity, create only its scoped database user/permissions and verify a secure network route before application connectivity. Do not use the administrator identity as the app's runtime principal.


## Later application access — 2026-11-02

VAC-26/VAC-35 subsequently provisioned application schema and selected managed-identity runtime access. The user explicitly superseded the original narrow-IP requirement for initial development: keep Entra-only/TLS, remove IP filtering, support VS Code/portal queries. This runtime exception is managed separately by sql-runtime-firewall.bicep and does not change the free-offer literals or authorize paid SQL/networking/Defender. The free-offer entry point still disables public access; reapplying it can close the runtime route. See [development query access](development-access.md) and [relocation runbook](../jira/media/VAC-35/migration-plan.md). Original empty-infrastructure evidence remains historical, not a claim that the current application database is empty or network-closed.


## Current deployment and network modes

Keep reusable SQL resources in infra/modules/sql-free.bicep and the SQL-only entry point in infra/deployments/sql.bicep. That entry point never deploys the web/backend. Public networking defaults to Disabled; current initial-development access explicitly uses `publicNetworkAccess=Enabled` plus the separate infra/deployments/sql-access.bicep DevelopmentOpen firewall mode selected in the dev target. Pass the explicit network parameter when validating/applying SQL-only changes intended to preserve this authorized access. Omitting it intentionally closes public access. Cost verification constrains both accepted network values/default and all unchanged literal free-limit/AutoPause/storage/Entra/TLS controls; enabling public connectivity does not enable paid usage.

Do not include the administrator IDs/tenant by guessing: resolve existing SQL Entra administrator properties and active subscription/tenant before SQL-only operations. Application migrations and runtime grants remain explicit operator-tool operations, outside infrastructure deployment.
