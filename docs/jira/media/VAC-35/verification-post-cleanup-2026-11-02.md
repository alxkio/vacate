# VAC-35 / VAC-26 post-cleanup verification

Date: 2026-11-02 · named local build revision `vac35-clean-20261102` · [artifact URLs/hash](deployed-artifact.json). Source is the authorized working tree; commit/push follows the requested architect review. No merge is authorized.

## Resulting Azure state

[Actual post-cleanup readback](post-cleanup-azure-readback.json) lists ten resources: the existing Free Static Web App in West Europe; SQL server/system master/user database in Sweden Central; and the Sweden Central API, FC1 plan, managed identity, Standard LRS storage, workspace and Insights component. Resource-group metadata stays West Europe. No SQL recreate, tier upgrade or source-data transfer was performed during relocation.

[Eight retired resource IDs](retired-resource-ids.json): old dedicated API/plan/identity/storage/Insights/workspace and the old/new automatically created Failure Anomalies alert rules. Old runtime storage contained only azure-webjobs-hosts, azure-webjobs-secrets and deployments; subscription app identity references showed only the retired API used that identity. Historical old diagnostic data was not migrated/copied to a paid target. The existing web app and SQL remain. No anomaly-alert resource remains in the final inventory.

SQL uses the actual free offer: useFreeLimit=true, AutoPause, GP_S_Gen5 serverless, max32GiB, local backups, required UTF-8 CI/AS collation. TLS minimum1.2. Entra-only was verified using the dedicated azureADOnlyAuthentications/Default resource because the CLI server summary did not expose that field. The app identity has only current resource DML/sequence access through vacate_resource_runtime; operator permission tests deny db_owner, CREATE TABLE, physical Users DELETE and migration-history UPDATE. No SQL password or Graph directory-role grant was created.

## Explicit cost and network decisions

Original SQL zero-cost limit remains mandatory. The user later approved minimum-cost replacement runtime storage and light monitoring. Storage is Standard_LRS, private blobs, shared keys disabled, TLS1.2. FC1 remains on demand with no always-ready instances; it can bill beyond shared free grants, which are not a hard spending limit or verified unused balance. Workspace readback: PerGB2018,30-day retention,0.025GB/day,RespectQuota; the cap can overshoot and is not a hard financial cap. Only warnings/errors/failed executions are retained; live metrics/dependency/performance/success telemetry are disabled. Relevant Defender SQL/AppServices/Storage pricing plans read Free (paid plans not enabled; this is not free Defender protection). No paid private endpoint/NAT/network appliance/replica/VM/Managed Instance/paid restore dependency was added.

The initial 13 advertised app-IP rules failed because actual Flex egress differed. SQL diagnostics showed74.241.139.246, verified in AzureCloud.swedencentral74.241.128.0/17 from Microsoft's public service-tag file. Before allowing an observed IP, the user explicitly requested removing IP restrictions for initial development and VS Code/portal access. Final state: public access Enabled and exactly one rule vacate-dev-open-ipv4 (0.0.0.0–255.255.255.255); the 13 superseded rules were removed. This deliberately permits network attempts from any IPv4 address while requiring Entra authentication/permissions. No production exception, SQL cost exception or automatic network broadening is inferred. [Human query instructions](../../../database/development-access.md).

## Schema and application acceptance

- Baseline plus OrganizationDemoMarker forward migration applied explicitly; repeat migration succeeded. No startup migrations or implicit fixture import.
- Ten actual Azure SQL provider tests passed after IsDemo (56.9620s): Unicode/UTC persistence, foreign-company denials, private projections, rollback, composite FK, rowversion, username/active-membership uniqueness, concurrent last-admin protection, precision and demo-marker preservation/default/isolation. Synthetic roots removed.
- Explicit fixture import: twelve fictional users/memberships and one fixture organization with IsDemo=true. Other normal organization creations default false, including soft-deleted HTTP acceptance records. No real employee data, policy calculation or invitation delivery.
- Real hosted HTTP acceptance passed all twelve sessions/revocation, private projections, resource CRUD/authorization/lifecycle/conflicts. Repeated against the cleaned API artifact and passed.
- Frontend JSON Schema checks passed all twelve SQL-backed HTTP projections.
- Real Azure API restart preserved a temporary organization edit, GUID and createdAt/updatedAt; fresh sign-in succeeded. Temporary name restored. Sessions remain process-local and not durable/multi-worker production authentication.
- Full web/API cloud smoke passed after cleaned artifact publication: revision pair, routes/static assets/configuration, exact allowed-origin CORS and denied foreign origin. No paid SWA backend or tier change.
- Complete functional browser mode passed against the hosted SQL-backed site: all twelve accounts, privacy/scope/foreign IDs, history, profile/organization/membership writes, approval inheritance/delegation, responsive pages and reference-data behavior. Native checks are excluded in that mode and are not claimed passed by it.

## Native-browser QA limitation and fixes

One diagnostic run passed native readiness, trusted Escape/shortlist/account-menu checks, then failed at a test-only hardcoded same-origin /api cleanup. That assumption is valid for the local proxy but not a separately hosted API. Test requests now use the site's actual public config.json API destination on each document; product UI/calls are unchanged. Interrupted fictional organization/Maya fields were restored explicitly before the passing functional run. A bounded configurable cloud suite deadline preserves all assertions (default5min, opted-in15min).

Subsequent fresh headless and visible Chrome150 default runs failed native readiness with no trusted pointer/key events despite focused/visible document reports. Assertions were retained; no synthetic-action fallback or application-action retry was added. Existing [VAC-15](../../VAC-15-stabilize-keyboard-browser-acceptance.md) remains QA. No full default/native suite or independent release approval is claimed.

## Repository cleanup and reproducibility

Reusable resource definitions stay in infra/modules. SQL-only deployment wrappers moved to infra/deployments/sql.bicep and sql-access.bicep; SQL operations moved to docs/database and historical migration planning to this issue's media folder. The one-off relocation entry point was removed; main.bicep/dev parameters now target the existing Sweden Central backend and old unchanged frontend. Current SQL-only public access is an explicit Enabled parameter; safe default remains Disabled. Cost verifier still rejects paid fallback, altered SKU/storage/free/backup/security controls and constrains the network parameter/default. Incremental deployments do not delete omitted firewall rules; switching back to Restricted requires explicitly removing the open rule.

Removed unused AddInfrastructure scaffold and application-project EF Design dependency; tooling-only Design dependency remains in the migration executable. All three environment parameter files compile. Final Release build/model check passed (first extension rebuild emitted SDK fallback-restore warning; no model drift). Final baseline NUnit:18 integration +10 unit passed, ten provider tests intentionally ignored without the explicit connection; real provider run above is separate. C# format, JS syntax/format and diff-whitespace checks passed. SQL-only Bicep compile/lint/ARM control verification and provider validation/what-if passed against resolved existing administrator/tenant and authorized current network mode; provider-normalized defaults/SKU symbolic values appeared as Modify, with no new SQL resource or paid feature applied.

Human actual and total assistant time were not measured. Recorded provider automation time is not total work. [Separate post-cleanup architect review](architect-review-2026-11-02.md) passed after correcting one P2 operational-document inconsistency; remaining production identity, retention/erasure/recovery and future policy/onboarding/leave features remain outside scope.
