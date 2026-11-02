# Sweden Central SQL-only verification

Date: 2026-11-01 (client date, Europe/Athens). Branch: VAC-22-database-schema-design. Actor: Codex / Software Engineer. Status: COMPLETE — SQL-only Sweden Central deployment, approved Greek/Nordic UTF-8 collation recreation and final actual cost/security readback passed.

## Authorization and implementation

The user authorized SQL-only Sweden Central after being informed that the first free database fixes the subscription's free-database region. They specified server `vacate-dev-srv` and database `vacate-dev-db`, then explicitly requested existing module conventions and authorized checks again after an initial declined CLI request. No broader deployment is authorized.

`infra/targets/dev.json` retains the original subscription/resource group/application region and adds only `sqlLocation: swedencentral`. `infra/deployments/sql.bicep` is a separate entry point calling `infra/modules/sql-free.bicep`; it never imports main.bicep. Administrator ID/UPN are resolved from the actual signed-in operator and kept in temporary parameters, not committed as credentials or guessed from app identity. No schema, app code/settings, migration, identity integration or invitations are added.

## Fresh preflight observations

- Enabled subscription 07d79495-1f4f-40fd-9fdf-84605214e5e6; existing rg-vacate-dev in West Europe. Active tenant/current signed-in user resolved and confirmed.
- Sweden Central region Available; SQL Server12.0 Default; GeneralPurpose Default; GP_S_Gen5_2 Available, Serverless, 2vCores. Minimum0.5 Default, 32768MiB Default, free-limit AutoPause Default. No regional restriction reason.
- FreeLimitQuota current0/limit1, subscription-wide. No existing SQL logical servers. REST name availability returned available=true for vacate-dev-srv. Initial unsupported CLI check-name-availability command was replaced by the documented SQL REST check; it made no resource changes.
- Subscription paid Defender plan pricingTier Free; dormant freeTrialRemainingTime P30D was returned, but the paid plan is not enabled and no trial is activated. No subscription pricing or billing settings changed. Inherited policy assignment query returned[]. New-server security alerts and auditing explicitly Disabled.
- Bicep v0.48.1 format/lint/build passed. Generated ARM guard checks the inline Incremental module wrapper, fixed names/region and all six nested SQL resources. An initial guard assumed loadJsonContent compiled to a literal; corrected it to resolve the generated variable reference, then passed before applying. No cost flag was changed to satisfy the guard.
- Eight negative guard checks reject disabling free limits, BillOverUsage, excess storage, Geo backups, an unrelated outer resource, a nested private endpoint and either changed resource name.
- ARM validation Succeeded/error null. What-if Succeeded/error null, diagnostics/potentialChanges null. Exactly six SQL Creates; eight existing resources Ignore; zero Modify/Delete. Runtime SKU properties omitted from what-if's after projection are explicit in compiled ARM and checked against capabilities.

The [sanitized preflight JSON](sweden-central-preflight.json) records exact proposed IDs, quota/capability status, change inventory and compiled ARM SHA256. No operator UPN or credential is included.

## Resource/cost review

| Proposed resource | Reviewed settings |
|---|---|
| SQL logical server | Management container, no separate VM/Managed Instance; Entra-only, TLS1.2, public network disabled; no firewall/private endpoint |
| SQL database | New empty Default; GP_S_Gen5, GeneralPurpose, 2 max/0.5 min vCores; useFreeLimit=true and AutoPause; 32GiB data max; Local backups; readScale Disabled, zoneRedundant false, ledger false |
| Short-term backup policy | Seven days, offer-supported Local redundancy; no external backup/copy workload |
| Long-term backup policy | All retention periods PT0S, disabled |
| Security alert policy | Disabled; no paid Defender activation/trial |
| Auditing | Disabled; Azure Monitor target false; no ingestion/storage sink |

The inline ARM module deployment is a control-plane wrapper, not an extra compute/storage service. No existing application resource is redeployed. Monthly free offer is 100,000vCore-seconds, 32GB data and 32GB backups; AutoPause prevents continued paid usage and accepts downtime until next calendar month after exhaustion. Current documentation says idle pause is15minutes; actual database readback is60minutes. This discrepancy does not disable monthly-limit AutoPause or permit paid usage. Template does not independently cap backup bytes; offer restrictions and AutoPause remain in force. No trial balance, credits or reimbursement underpin the cost conclusion.

## Deployment and readback

Conditional apply was invoked against the existing dev subscription/group with deployment name `vacate-dev-sql-free-20261101`, Incremental mode, the exact compiled SHA256 recorded in preflight and resolved temporary parameters. The initial apply created the server, database, STR, auditing and security-alert resources, but failed on the explicit disabled LTR policy with LongTermRetentionMissingWeekOfYear. No paid fallback or LTR period was enabled. Actual database readback already confirmed free-limit/AutoPause/Local/32GiB controls. Corrected the module to include the required weekOfYear1 while all weekly/monthly/yearly periods remain PT0S. Format/lint/build/ARM guard passed again; fresh validation and what-if succeeded. The [corrected preflight](sweden-central-corrected-preflight.json) records the new compiled SHA256 and reviewed diffs: no new/deleted resources, only this task's SQL resources affected. Provider-default omissions cause Modify noise in auditing/alert/backup projections; all cost/security flags stay explicit. Same named deployment was retried with the corrected template; final result/readback follows below.

## Sources and remaining scope

Microsoft [free-tier guide](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier), [FAQ](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier-faq), and [Defender for SQL documentation](https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-defender-for-sql), checked 2026-11-01. Historical West Europe restriction and the initial stop are retained in the [earlier report](verification-2026-11-01.md).

Application persistence, schema/migrations, API/frontend integration, policy calculations, OIDC/sessions and invitations remain separate. No SQL data-plane connection or schema query is claimed. Human actual time Unknown; assistant duration Unknown; automation elapsed not aggregated. No commit/push/merge performed.

## Successful deployment and actual readback

Deployment `vacate-dev-sql-free-20261101` Succeeded after the required zero-LTR correction. All nested resource operations succeeded. Last apply duration from Azure is PT1M11.3846443S, recorded once as automation elapsed, not assistant/human time. No repeated deployment duration is summed.

Actual resource IDs:

- Server: `/subscriptions/07d79495-1f4f-40fd-9fdf-84605214e5e6/resourceGroups/rg-vacate-dev/providers/Microsoft.Sql/servers/vacate-dev-srv`
- Database: `/subscriptions/07d79495-1f4f-40fd-9fdf-84605214e5e6/resourceGroups/rg-vacate-dev/providers/Microsoft.Sql/servers/vacate-dev-srv/databases/vacate-dev-db`

[Sanitized actual readback](sweden-central-readback.json) confirms GP serverless2/0.5, useFreeLimit=true, freeLimitExhaustionBehavior=AutoPause, maxSize34359738368, current/requested Local backup redundancy, seven-day STR and all LTR periods PT0S. The provider normalizes LTR weekOfYear back to0 with retention disabled, although it requires a valid1..52 input when all retention fields are sent; this causes expected preview noise on subsequent applies, not paid retention. Actual idle autoPauseDelay60 is recorded, distinct from the guide's15minutes and from monthly-limit AutoPause.

Entra-only true, TLS1.2, public network Disabled, server ATP/security alerts/auditing Disabled; zero firewall rules, private endpoints or diagnostic sinks. Subscription paid Defender plan remains not enabled. Database inventory contains only vacate-dev-db plus Azure's automatic System-tier master database. Free quota now used1/limit1, consistent with exactly one free user database. No application database user or password login was created by this task. The configured Entra operator is administrator; application managed-identity authorization/network/persistence remain separate VAC-26 work.

## Subsequent collation request

After provisioning, the user requested “utf general ci”. Actual database collation is SQL_Latin1_General_CP1_CI_AS. Azure SQL candidates are Latin1_General_100_CI_AS_SC_UTF8 (case-insensitive, accents distinct) and Latin1_General_100_CI_AI_SC_UTF8 (case/accent-insensitive); accent choice requested from user, not assumed. Existing nvarchar schema design remains Unicode regardless of UTF-8 varchar defaults; username uniqueness must retain its explicitly reviewed normalized comparison semantics.

Microsoft's [modifiable configuration reference](https://learn.microsoft.com/en-us/azure/azure-sql/database/modifiable-configuration-reference?view=azuresql-db), checked2026-11-01, says database collation requires recreation. No database was deleted/recreated for this request, no incompatible in-place collation update was attempted, and no paid copy/restore alternative was used. A recreation must retain the requested names, reuse the existing server, wait for actual free quota to become available and recheck zero-cost controls before creation; a deleted free slot can take up to one hour to return per FAQ. Database public access remains disabled, and no schema/data-plane inventory is claimed.

## Approved collation recreation

The user confirmed accents must stay distinct and text must support Nordic and Greek characters. Selected Latin1_General_100_CI_AS_SC_UTF8; this is not a switch to an accent-insensitive or language-specific sort order. Updated the module and exact-property ARM guard, then formatted/linted/compiled successfully. A negative guard check rejects the CI_AI alternative. The requested database deletion/recreation action was explicitly approved through the command permission prompt; deletion targets only vacate-dev-db, retaining vacate-dev-srv, existing services and all free-offer controls. No app schema, users or connections were created before deletion by this task. Fresh quota/validation/what-if and actual UTF-8 readback are required before claiming the recreated database complete.

## Replacement preflight and apply

Approved deletion completed without changing the logical server. Inventory then contained only the System-tier master database. First quota read still showed used1/limit1, so no create was attempted. Read-only polling subsequently observed used0/limit1 and terminated immediately (3seconds measured within that polling process, not total provider release delay). The [UTF-8 preflight](sweden-central-utf8-preflight.json) records the replacement compiled hash, confirmed collation, successful fresh ARM validation/what-if and reviewed SQL-only changes. No new/deleted unrelated resources or paid fallback.

Only after the free slot returned, invoked `vacate-dev-sql-utf8-20261101` in Incremental mode with the exact prepared template. Creation/readback result is pending below. This is a new empty creation, not restoring/copying into the free tier.

## Final UTF-8 completion

Replacement deployment `vacate-dev-sql-utf8-20261101` Succeeded; all nested operations Succeeded. Last replacement apply duration from ARM is PT1M32.2187624S, recorded separately from the earlier corrected apply, without overlapping/nested totals. [Final actual readback](sweden-central-utf8-readback.json) confirms **Latin1_General_100_CI_AS_SC_UTF8**, Online, GP_S_Gen5 capacity2/min0.5, useFreeLimit=true, freeLimitExhaustionBehavior=AutoPause, max34359738368, Local current/requested backups, STR7days and all LTR PT0S. Actual idle delay remains60minutes, and disabled LTR weekOfYear is normalized0; neither observation permits paid usage.

Same server/database resource IDs listed above were retained. Server remains Ready, TLS1.2, public network Disabled, Entra-only true, ATP/auditing Disabled, no database diagnostic sinks. Server was never deleted; prior zero-firewall/private-endpoint checks remain applicable and no such resource was added. Free quota again used1/limit1 after the single replacement. No application database principal, SQL-password login, schema, migrations, connection settings or invitations created by this task.

VAC-34 is Done for the explicitly authorized empty development infrastructure and added collation configuration. This is self-verification of infrastructure deployment, not independent production release approval or executed SQL multilingual round-trip tests. VAC-26 remains Specification for EF/schema/app principal/permissions/network/API integration and accepted ADR gates. ADR-0004 stays PROPOSED.

Final local checks: SQL entry/module lint/build and exact compiled-ARM guard; negative checks for paid/unsafe/resource-name/collation/retention mutations; all issue/backlog statuses/dependencies/links and acyclic graph; dev parameter compile (resource-group/application location still West Europe); whitespace. No app/backend/frontend build is claimed because runtime source/contracts were not changed. No commits, push or merge.

Changed configuration/source paths for this provisioning continuation: infra/deployments/sql.bicep, infra/modules/sql-free.bicep, infra/targets/dev.json, scripts/verify-sql-free-template.py, docs/database/azure-sql-operations.md, infra/README.md, docs/jira/VAC-34-empty-azure-sql-free-offer.md, docs/jira/VAC-26-azure-sql-resource-persistence.md, docs/jira/Product-Backlog.md, docs/database/schema-catalogue.md, docs/database/integrity-and-verification.md and VAC-34 evidence files. The earlier CI compilation hook and design package remain intact. Human actual Unknown; assistant duration Unknown; individual ARM durations are automation elapsed only.
