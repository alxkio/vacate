# Development backend relocation to Sweden Central

Date: 2026-11-02 · [VAC-35](../../VAC-35-sweden-central-development-relocation.md). Historical plan; the temporary relocation entry point was removed after cutover. Current desired state is in infra/main.bicep and the dev parameters; execution and post-cleanup review evidence are recorded separately.

## Source and destination

Keep subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6` and resource group `rg-vacate-dev`. Group metadata remains West Europe; that does not require its contained resources to share that region. SQL `vacate-dev-srv/vacate-dev-db` remains in Sweden Central, including schema/data, collation and free-limit/AutoPause.

Keep `vacate-dev-wv5pdctnrzamu-web` (Free) in West Europe. The Microsoft.Web provider lists Central US, East US 2, West US 2, West Europe and East Asia for staticSites; Sweden Central is unavailable. Static assets are globally distributed; the browser calls the API using public config.json and HTTPS. No paid SWA integrated backend, reverse proxy or tier change is needed. Update API base URL and retain exact website origin in API CORS.

Existing regional backend names use `vacate-dev-wv5pdctnrzamu-*`; destination uses `vacate-dev-sc-wv5pdctnrzamu-*` and storage `vacatedevscwv5pdctn`. Function regional relocation requires replacement resources and a new API URL. No in-place edit of an existing resource location is attempted. SQL and the frontend are existing dependencies, outside the relocation deployment's resource set.

## Explicit cost decision

The user initially required zero incremental cost for SQL and prohibited paid dependencies. On 2026-11-02, after seeing storage/runtime/monitoring costs and delete/recreate implications, the user explicitly approved minimum-cost replacement storage and monitoring. This exception is limited to relocation of existing backend capabilities. SQL stays strictly free; no Defender, private endpoint, NAT gateway, paid networking appliance, geo-replica or paid restore is introduced.

Use the existing FC1 on-demand tier (no always-ready instances), 2,048 MB instance setting and maximum 40 (a scale ceiling, not reserved instances). Standard LRS private runtime/deployment storage uses managed identity, HTTPS/TLS and shared keys disabled. Monitoring keeps warning/error/failed-execution signals, no success/dependency/live-metric tracing, 30-day retention and 0.025 GB/day workspace cap, the smallest existing supported configuration above Azure's required 0.023 GB minimum. Daily ingestion caps can overshoot and are not hard spending caps; shared subscription/billing-account grants are not guaranteed remaining allowances.

Public retail API checked 2026-11-02, Sweden Central, USD Consumption prices: Hot LRS capacity $0.0184/GB-month for first tier; writes $0.05/10,000 operations; FC1 above eligible shared grants $0.000026/GB-second and $0.40/million executions; Analytics Logs ingestion above applicable benefit $2.99/GB. Example 1 GB stored plus 10,000 writes is $0.0684/month before reads, host operations and other usage. This is not measured subscription usage, a quote or a guarantee. No trial balances assumed. [Rate evidence](sweden-central-retail-rates.json).

Keep the old backend during a short verification window, then retire only explicitly identified replaced resources. This avoids deleting the working API before replacement validation; overlapping capacity/storage/ingestion can add usage charges. Do not keep both running indefinitely. Current process-local sessions and memory edits are disposable under the user's development-data decision. Redeploy application artifacts from the workspace instead of copying runtime storage across regions. Existing historical monitoring data does not migrate automatically; no paid export/copy is included.

## Deployment sequence

1. Compile/lint [current main entry point](../../../../infra/main.bicep), [functions backend module](../../../../infra/modules/functions-backend.bicep) and main/environment parameter files. Relocation uses existing monitoring module. Resolve actual service locations, .NET 10 FC1 support, inherited Defender pricing, policy/capacity and name availability. Validate/what-if the compiled scoped ARM against the confirmed group; review every proposed resource and feature.
2. Deploy only the destination backend and minimum diagnostics with SQL mode initially disabled. Publish a named local build revision; verify health and exact-origin CORS before frontend changes.
3. Under VAC-26, migrate the existing SQL database, import explicitly authorized fictional fixtures (organization IsDemo=true), grant the resolved destination managed identity a contained Entra user with object-scoped resource DML and ID sequence permissions. No db_owner, DDL, physical DELETE, migration-history writes, credentials or startup migrations.
4. Initial approach used individual advertised app IPs. Actual Flex worker egress differed (74.241.139.246, verified in AzureCloud.swedencentral 74.241.128.0/17). Before adding it, the user explicitly chose development-only removal of IP filtering to support app/VS Code/portal access. The dev runtime firewall path now has an explicit DevelopmentOpen mode (full IPv4 range), with public access enabled but Entra-only/TLS/least-privilege identity preserved. This supersedes the earlier narrow-IP constraint for this server, not SQL cost controls. No static-IP/NAT dependency or automatic broadening is introduced; switching back to Restricted is explicit.
5. Verify actual SQL-host HTTP/schema/browser acceptance, company isolation and restart persistence. Repoint the existing frontend runtime configuration only after destination passes. Verify named web/API revision pair and actual destination CORS.
6. Update dev target/parameter naming to destination for subsequent repository deployments. Retire only the old app/plan/storage/identity/diagnostics after dependency checks and verified cutover; never delete SQL, the existing web app, unrelated resources or the resource group. Record any source resource intentionally retained and why. Removing old diagnostics removes its history; do not claim historical logs were migrated.
7. Read back destination regions, runtime/identity/storage/monitoring limits and unchanged SQL cost controls. Record resource IDs, checks, data boundary and remaining recovery/identity gaps.

## Recovery boundary

This is disposable fictional development state, not a production migration. SQL remains the durable resource store after cutover; sessions remain process-local. Do not fall back to memory automatically after SQL errors/exhaustion. SQL monthly exhaustion deliberately means downtime. No paid PITR target is authorized. A frontend rollback can repoint to an intact old backend during the short migration window, but after durable writes a memory backend rollback loses those writes. Old resources must not be retired until the replacement has passed the selected acceptance checks.

## Sources

Checked 2026-11-02: [Functions regional relocation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/relocation/relocation-functions), [Flex runtime/region discovery](https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-how-to), [Static Web Apps distribution](https://learn.microsoft.com/en-us/azure/static-web-apps/overview), [bandwidth prices](https://azure.microsoft.com/en-us/pricing/details/bandwidth/), [storage prices](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/), [Functions prices](https://azure.microsoft.com/en-us/pricing/details/functions/), [workspace cross-region limitations](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/move-workspace).
