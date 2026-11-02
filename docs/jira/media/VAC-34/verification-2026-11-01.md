# VAC-22–VAC-25 design package and VAC-34 infrastructure verification

Historical West Europe attempt. Later SQL-only Sweden Central deployment/readback succeeded; see the [current report](verification-sweden-central-2026-11-01.md). The observations below describe the initial stopped attempt.

Date: 2026-11-01 (Europe/Athens client date). Actor: Codex / Software Engineer. Branch: VAC-22-database-schema-design. Starting working tree clean; no unrelated changes existed. No commits, push or merge in this session.

## Outcome

Design artifacts delivered in VAC-23 → VAC-24 → VAC-25 order; self-review findings are in each artifact. VAC-22–VAC-25 marked Done for bounded design delivery and source-consistency review only. ADR-0004 remains PROPOSED; product acceptance/independent privacy review and runtime implementation gates remain open. VAC-26 stays Specification and now depends on VAC-25 and independently scoped VAC-34. VAC-34 remains In progress with a deployment blocker.

**No SQL server/database deployed. No deployed resource IDs or actual database property readback exist.** Only Microsoft.Sql provider registration was performed; it changed from NotRegistered to Registered so capability/quota checks could run. No existing application service/tier/billing setting was changed.

## Azure observations

| Check | Observed result |
|---|---|
| Existing target | Subscription 07d79495-1f4f-40fd-9fdf-84605214e5e6; rg-vacate-dev; westeurope, matching infra/targets/dev.json |
| Subscription | Enabled; subscriptionPolicies.quotaId PayAsYouGo_2014-09-01, spendingLimit Off. No credits used as cost justification |
| Existing SQL logical servers | Subscription list returned [] before any deployment; no SQL create command executed |
| Entra operator | Signed-in user resolved with az ad signed-in-user show in the active subscription tenant; actual object ID/UPN used only in temporary parameters. No password/credential stored in repo |
| SQL provider | Initially NotRegistered; registration initiated and read back Registered. Initial SubscriptionNotFound capability errors cleared after registration |
| FreeLimitQuota | currentValue 0, limit 1, unit Count; API describes subscription-wide free DB count across regions. One slot apparently available; recheck before apply. Generic published ten-DB maximum is not this subscription's observed quota |
| West Europe capability | status Visible, explicit reason: “Provisioning is restricted in this region. Please choose a different region.” Support exception route identified by API; no exception/request or region substitution performed |
| SQL Server 12.0 / GP_S_Gen5_2 | Visible, with same regional restriction; GP serverless, capacity2, minimum0.5 and 32768MiB size enumerated; free-limit AutoPause listed Default. Enumeration is not availability |
| Paid Defender for SQL plan | Subscription Microsoft.Security/pricings/SqlServers returned pricingTier Free, subPlan null, enforce null. This is the API's generic setting indicating the paid plan is not enabled at subscription scope; it is **not a free Defender for SQL protection tier**. Resource-level enablement must still be checked after any future authorized deployment |
| Inherited policy assignment listing | Target scope with disable-scope-strict-match returned []; no applicable assignment returned by this query. Not a guarantee against future policy changes or unreadable broader scopes |

BLOCKER: region/server/SKU are Visible rather than Available/Default with explicit provisioning restriction. Cannot establish supported zero-cost provisioning in the existing target. Stop before deployment even though ARM preflight succeeds; no paid or alternate-region substitution is permitted.

## Compilation and ARM checks

- Initial Bicep 0.23.1 build succeeded with BCP081 missing-type warnings. Azure CLI Bicep updater failed certificate verification; TLS checks were not disabled. Downloaded official Bicep v0.48.1 into temporary storage using system TLS trust. Initial ARM64 binary did not match host; replaced with x64 matching uname x86_64. No binaries added to repo.
- Final Bicep v0.48.1 format, lint and build passed without diagnostics after tightening object/tenant ID parameter lengths to exactly36.
- `python3 scripts/verify-sql-free-template.py <compiled ARM>` passed. Guard checks exact SQL-only resource types, reviewed DB property allowlist, hardcoded useFreeLimit=true / AutoPause, 32GiB max data, GP serverless2, minimum0.5, Local backups, 7-day STR, disabled LTR/security alerts/auditing, TLS1.2, disabled public access and Entra-only auth.
- CI infrastructure compile job now compiles/lints this separate template and runs the cost guard. Existing apply/publish behavior is untouched; no workflow was invoked.
- Final compiled resource bodies and outputs exactly equal those in the validated/what-if artifact. The only parameter changes are administratorObjectId/tenantId min/max length36 (resolved values satisfy both). A repeat Azure validation/what-if request after this tightening was declined; no repeat result is claimed. Earlier successful cloud checks are retained below.

## Cloud preflight (no apply)

`az deployment group validate` and `az deployment group what-if` were run with the standalone compiled ARM and temporary parameters against the exact confirmed dev subscription/group. Both returned Succeeded and error null. What-if diagnostics and potentialChanges were null.

What-if proposes exactly six Create resources, all under:

`/subscriptions/07d79495-1f4f-40fd-9fdf-84605214e5e6/resourceGroups/rg-vacate-dev/providers/Microsoft.Sql/servers/vacate-dev-epglr5gcai5x6-sql`

| Proposed relative resource | Cost/feature review |
|---|---|
| logical server root | Entra-only/TLS1.2; network disabled; no VM or server compute plan |
| databases/vacate-dev | New empty Default; free-limit and AutoPause; 32GiB max data; no pool/replica/zone/read scale |
| databases/vacate-dev/backupShortTermRetentionPolicies/default | Seven days; Local backup storage set on DB; within free-offer configuration, no paid recovery target |
| databases/vacate-dev/backupLongTermRetentionPolicies/default | Weekly/monthly/yearly PT0S, disabled |
| securityAlertPolicies/Default | Disabled; no paid Defender trial or activation |
| auditingSettings/default | Disabled; no Azure Monitor sink or paid ingestion |

Nine existing application/monitoring/storage resources are Ignore. There are zero Modify/Delete changes. These are **proposed IDs**, not deployed IDs. No deployment group create, schema connection, migration, app settings update or invitation was performed. The free backup allowance and provider AutoPause must still be verified on actual properties if the blocker is resolved; template validation cannot measure actual backup bytes or establish recovery.

## Product and runtime boundaries

Design self-review checked numeric/public identities, optional hierarchy, same-company relationships, private projections, null/explicit allowance floors, stale overrides, yearly provenance and legacy carryover compatibility. Important remaining gates: current AnnualBalance conflicts with preserving stale overrides; missing policy/calendar FK targets; annual revision/effective-time rule; cutoff/timezone/cancellation rules; prior-service precision acceptance; dev compatibility adapters; identity/invitation verification; retention/erasure/recovery. None was silently implemented.

No application, EF schema, frontend, statutory policy, hourly submission, invitation delivery or production identity change. API/frontend builds and SQL runtime/tenant tests were not run: this change delivers design, infrastructure template and compile-time guard only. Real SQL race/tenant/API/browser scenarios are documented in the future verification plan.

## Sources checked 2026-11-01

- [Free offer settings, monthly allowance and pause behavior](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier).
- [Free-tier backup restrictions and unsupported restore/copy](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier-faq).
- [Microsoft Defender for SQL paid service](https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-defender-for-sql) and [generic pricing API semantics](https://learn.microsoft.com/en-us/rest/api/defenderforcloud/pricings/get).
- [EF concurrency](https://learn.microsoft.com/en-us/ef/core/saving/concurrency) and [transactions](https://learn.microsoft.com/en-us/ef/core/saving/transactions).

Local verification passed: all 33 real issue IDs unique, backlog type/summary/status/dependencies consistent for every issue, dependency graph acyclic, and relative file links valid across 15 changed Markdown documents. ADR remains PROPOSED; VAC-34 has no dependencies; VAC-26 depends on VAC-25 and VAC-34. Seven negative guard checks rejected disabled free limits, BillOverUsage, excess data size, geo backups, a private endpoint, public network exposure and enabled paid security alerts. Main Bicep and all dev/staging/prod parameter files compile with current compiler. git diff --check passed. Final resource/output equality to cloud-preflight artifact passed. Time: human Unknown, assistant duration Unknown, automation elapsed not aggregated; no overlapping totals inferred.
