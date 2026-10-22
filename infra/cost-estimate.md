# Dev Azure resource and cost estimate

Checked: 2026-10-22. Scope: `infra/parameters/dev.bicepparam`, West Europe, resource group `rg-vacate-dev`. This estimates the current development configuration, before VAT, discounts or credits. It is not a subscription-specific quote or a spending limit.

## Resource inventory

The successful earlier what-if run reported **10 resources to create**. Monitoring is now optional: the default minimal-diagnostics configuration retains ten resource types, while `enableMonitoring=false` produces eight on a fresh deployment. The first apply passed what-if but rejected the 0.01 GB daily quota; it now uses 0.025 GB. The existing resource group is not an additional resource created by this template.

| # | Resource | Configuration / purpose | Billing |
| --- | --- | --- | --- |
| 1 | Static Web App | Free tier; Angular hosting | No hosting charge within Free-plan limits |
| 2 | Function App | .NET 10 isolated, 2,048 MB instances; HTTP API | Flex on-demand execution and memory-time consumption |
| 3 | Functions hosting plan | FC1 / Flex Consumption | Billing plan for the Function App; no separate fixed dedicated-server fee |
| 4 | Storage account | StorageV2, Standard LRS; Functions runtime and deployment packages | Stored data and operations |
| 5 | Blob service | Storage account's `default` service | Part of storage billing |
| 6 | Blob container | Private `deployments` container | Part of storage billing |
| 7 | Managed identity | User-assigned identity for Functions storage access | No extra identity fee |
| 8 | Role assignment | Storage Blob Data Owner for that identity | No RBAC fee |
| 9 | Log Analytics workspace | PerGB2018; 30-day retention; 0.025 GB/day (25 MB/day) ingestion cap | Logs ingestion and applicable retention |
| 10 | Application Insights | Workspace-based application monitoring | Ingested telemetry is billed through the workspace; do not add the same ingestion charge twice |

Names are deterministically generated from the prefix, environment, subscription and resource group. The Functions scale limit of 40 is a **maximum**, not 40 permanently running instances. No always-ready instances are configured. Monitoring now retains warnings/errors and failed executions instead of normal success telemetry, without a separate worker telemetry exporter.

## Verified pricing inputs

Azure public Retail Prices API was queried for West Europe on the check date. EUR amounts are reference estimates; Azure notes that USD is its retail pricing basis. Account-specific terms and currency conversion can differ.

| Meter | Public retail rate / allowance |
| --- | --- |
| Static Web Apps Free | Free hosting; 100 GB included bandwidth per subscription; service stops serving if Free limits are exceeded |
| Flex on-demand free grant | 250,000 executions and 100,000 GB-seconds per subscription/month, on eligible paid consumption subscriptions |
| Flex execution time above grant | USD 0.000026 / GB-second |
| Flex executions above grant | USD 0.40 / million executions (API meter is USD 0.000004 per 10 executions) |
| Hot LRS blob capacity, first storage tier | EUR 0.0172 / GB-month |
| Hot reads / other operations | EUR 0.0038 / 10,000 operations |
| Hot writes / list and create-container operations | EUR 0.0475 / 10,000 operations |
| Analytics Logs ingestion | First 5 GB/month per billing account free; then EUR 2.6311 / GB for West Europe |

The EUR API response returned zero for the very small Functions unit rates, including paid tiers. This is not evidence of free execution above the grant. The USD API response was used for those meters instead. The underlying paid-meter effective dates returned by the API are 2025-06-01 for Flex, 2017-02-03 for the basic blob capacity/operation meters and 2018-02-01 for Analytics Logs; these are meter effective dates, not the date of this check.

## Usage assumptions and estimate

**ASSUMPTION — light development:** up to 20,000 executions and 40,000 billed GB-seconds/month, up to approximately 0.775 GB logs/month and around 1 GB blob data. Eligible free grants remain available, frontend bandwidth stays inside Free-plan limits and no paid optional monitoring features are added. These are scenario assumptions, not measured usage or a production forecast.

Functions and logging fit inside their respective grants in this scenario. Logs remain searchable in Log Analytics with monitoring enabled; disabling monitoring removes those ingestion costs and application-error history entirely. As a simple storage example, 1 GB stored plus 10,000 reads and 10,000 writes costs EUR 0.0172 + 0.0038 + 0.0475 = **EUR 0.0685/month**, before other runtime operations and transfers. Allow **approximately EUR 0.10–2/month** for this light development scenario, with **EUR 5/month as a planning allowance**, not an enforced cap.

Free grants are shared at the scopes stated above; their remaining availability and this subscription's eligibility are UNVERIFIED. Existing workloads can consume shared allowances. Larger traffic, longer executions, telemetry volume, storage operations and applicable transfer charges change the result.

Logs are the main easy-to-overlook variable in this configuration. At the current 0.025 GB/day setting, 31 days corresponds to about 0.775 GB before overshoot, or **EUR 2.04** ingestion if the free allowance is already exhausted. The earlier 1 GB/day configuration could permit about 30 GB/month, or roughly **EUR 65.78** beyond a 5 GB free grant; that setting is superseded. A daily cap is not a strict monthly spending ceiling and enforcement can overshoot.

No database, email service, purchased domain, dedicated VM or always-ready Functions instance is included. GitHub Actions usage/overages are outside this Azure resource estimate. Production parameters use Static Web Apps Standard and need a separate estimate.

## Verification and decisions

Resource inventory checked against `main.bicep`, both modules and dev parameters, and reconciled by resource type to the earlier successful [what-if run](https://github.com/alxkio/vacate/actions/runs/39679059590). Public rates were retrieved directly from Azure's Retail Prices API and free-grant terms checked against official pricing pages. The 2026-10-22 logging revision reduces the cap from 1 GB/day to 0.025 GB/day and adds the monitoring-off switch. Azure's [first apply](https://github.com/alxkio/vacate/actions/runs/39768832302) rejected the proposed 0.01 GB quota with `DailyQuotaGb must be greater than 0.023`; source values and estimates were corrected before retry. No product scope changed. Open inputs: actual workload, remaining grants, subscription billing terms and production requirements.

Sources checked 2026-10-22: [Functions pricing](https://azure.microsoft.com/en-us/pricing/details/functions/), [Flex billing](https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-plan#billing), [Static Web Apps pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/static/), [Azure Monitor pricing](https://azure.microsoft.com/en-us/pricing/details/monitor/), [daily-cap behavior](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/daily-cap), [Blob pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/), [Retail Prices API and currency limitations](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices), [managed identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview), [Azure RBAC licensing](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview#license-requirements).

API queries: [Flex, USD](https://prices.azure.com/api/retail/prices?currencyCode=%27USD%27&$filter=armRegionName%20eq%20%27westeurope%27%20and%20serviceName%20eq%20%27Functions%27), [Hot LRS storage, EUR](https://prices.azure.com/api/retail/prices?currencyCode=%27EUR%27&$filter=armRegionName%20eq%20%27westeurope%27%20and%20serviceName%20eq%20%27Storage%27%20and%20skuName%20eq%20%27Hot%20LRS%27), [monitoring, EUR](https://prices.azure.com/api/retail/prices?currencyCode=%27EUR%27&$filter=armRegionName%20eq%20%27westeurope%27%20and%20%28serviceName%20eq%20%27Azure%20Monitor%27%20or%20serviceName%20eq%20%27Log%20Analytics%27%29).
