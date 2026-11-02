# Sweden Central relocation preflight

2026-11-02 · Codex · Azure read-only results before migration.

- Current app: vacate-dev-wv5pdctnrzamu-api, West Europe, FC1 FlexConsumption, running; no VNet integration. Resource group rg-vacate-dev, subscription 07d79495-1f4f-40fd-9fdf-84605214e5e6.
- Existing user-assigned identity resolved via app and identity readback: client ID 6a91d038-4716-4783-aa9d-be1a8b5688f2, principal object ID 6618d7d0-c678-4a9a-981d-d528ce8a1f6c. These are identifiers, not credentials; they are source-identity evidence, not the replacement app principal.
- Existing regional resources: same-name API identity, -plan FC1, storage vacatedevwv5pdctnrz Standard_LRS, -logs workspace, -insights component; associated Failure Anomalies alert is global. Existing Free Static Web App has suffix -web and stays in place.
- SQL: vacate-dev-srv/vacate-dev-db, Sweden Central, useFreeLimit=true, freeLimitExhaustionBehavior=AutoPause, maxSizeBytes=34359738368, Latin1_General_100_CI_AS_SC_UTF8. Before operator migration work, server publicNetworkAccess=Disabled, TLS1.2, firewall empty.
- App settings before cutover: DevelopmentAuthentication__Enabled=true, SeedData__Enabled=true; Persistence__Provider absent (repository default memory). No other setting values/credentials copied into evidence.
- Functions list-flexconsumption-locations includes swedencentral. Runtime discovery confirms dotnet-isolated 10, FC1 and 2048 MB support.
- Microsoft.Storage/storageAccounts, Microsoft.Insights/components and Microsoft.OperationalInsights/workspaces provider locations include Sweden Central. This establishes advertised service support, not subscription-specific capacity or deployment success.
- Microsoft.Web/staticSites provider locations: Central US, East US 2, West US 2, West Europe, East Asia. Sweden Central is absent. Existing frontend remains and uses direct browser HTTPS/CORS to regional API.
- Security pricing readback: SqlServers, StorageAccounts and AppServices pricingTier Free (paid Defender plans not enabled; not a claim that Defender protection is free). No change made to pricing settings.
- Original API-to-SQL route crosses European regions. Public bandwidth page lists $0.02/GB inter-region Europe; SQL free-limit settings do not establish a network-cost cap. No subscription exemption verified. User selected backend colocation instead.
- Public prices: [retail-rate results](sweden-central-retail-rates.json). API requests selected Sweden Central, Consumption, USD; rates include benefit tiers alongside paid tiers. Shared free grants are not verified available, and benefit/trial rows do not authorize paid dependencies. Python's initial TLS trust failed; lookup succeeded with system curl and certificate validation retained.

[Migration/cost plan](migration-plan.md). Deployment and release evidence must be recorded separately; this preflight alone claims no migration success.
