---
id: VAC-35
type: task
summary: Relocate the regional development backend to Sweden Central
status: qa
created: 2026-11-02
updated: 2026-11-02
parent: null
depends_on: []
---

# VAC-35 — Relocate the regional development backend to Sweden Central

![Task](badges/task.svg) **🔍 QA** · Owner: Unassigned

## Description

Move the existing regional development backend alongside vacate-dev-db in Sweden Central, removing the West Europe–Sweden Central API/SQL route. The product lead requested relocation on 2026-11-02 and confirmed Sweden Central. Retain the existing Free Static Web App: Azure does not offer Sweden Central for that resource type, and the user agreed after confirmation that browser HTTPS calls can reach the relocated API.

## Scope

Existing dev subscription/resource group only. Plan destination Functions FC1, runtime/deployment StorageV2 Standard_LRS, managed identity/storage grants and disposition of existing workspace/Insights/alert. Existing SQL stays in place with free limits/AutoPause and no paid SQL dependencies. Preserve application behavior and current tiers unless explicitly approved otherwise; no production work. Reuse repository Bicep/modules and workflows for eventual implementation.

Cost gate resolved for minimum-cost replacement storage and monitoring by explicit user instruction on 2026-11-02, after prices and delete/recreate implications were explained. SQL remains strictly free; no paid SQL/network/Defender dependency is authorized. Use a short verification overlap and retire only replaced backend resources after cutover. Remaining apply gates: scoped Bicep validation/what-if, actual capacity/configuration, identity/network and acceptance.

## Dependencies

None. Coordination: [VAC-26](VAC-26-azure-sql-resource-persistence.md) needs the chosen same-region route before hosted SQL cutover. [VAC-34](VAC-34-empty-azure-sql-free-offer.md) remains Done and its SQL resources are excluded from replacement. There is no reciprocal dependency cycle.

## Acceptance scenarios

- [x] Inventory source resources and query actual destination service availability; record frontend exception.
- [x] Resolve migration cost authorization, monitoring disposition and short verification-overlap strategy.
- [x] Compile/lint native Bicep and validate/what-if only the explicitly scoped migration; do not attempt an in-place location update of existing resources.
- [x] Deploy/publish and verify exact destination app, runtime storage/identity and frontend API URL/CORS; preserve Entra/TLS and tenant-isolation behavior, with only the explicitly approved D-4 development network exception.
- [x] Verify application behavior and restart persistence under VAC-26; maintain rollback and retire only explicitly approved source resources after verification.
- [x] Read back unchanged SQL free-limit/AutoPause; no paid SQL fallback, unapproved firewall broadening or paid networking dependency; D-4 explicitly authorizes the initial-development all-IPv4 rule.

## Subtasks and responsibilities

Infrastructure/backend: scoped native Bicep migration and artifact/configuration cutover. QA: region/resource/readiness checks and HTTP/browser verification. UI: no redesign, only runtime API destination if needed. Database: reuse existing Sweden Central SQL; identity grants remain VAC-26. Product/operations: resolve migration cost, downtime, monitoring and historical-log decisions.

## Attachments and sources

- [Reviewable migration and cost plan](media/VAC-35/migration-plan.md).
- [Preflight and retail-rate evidence](media/VAC-35/regional-preflight-2026-11-02.md).
- [Accepted hosting ADR](../adr/0002-azure-static-web-app-and-functions.md).

## Comments

- C-1 · 2026-11-02 · Codex: Live inventory confirms West Europe FC1/API/storage/identity/monitoring and Sweden Central free SQL. Sweden Central Functions support confirmed. Static Web Apps provider locations exclude Sweden Central. Preparation only; pricing/downtime decision remains open.

- C-2 · 2026-11-02 · Codex: Regional backend deployed, SQL-backed HTTP/restart/schema/functional-browser passed, source backend and extra alerts retired, wrappers/runbooks consolidated. [Post-cleanup verification](media/VAC-35/verification-post-cleanup-2026-11-02.md) and IDs/readback attached. Native/default reliability remains existing VAC-15 QA; architect review requested next.

## Decisions

- D-1 · 2026-11-02 · Product lead instruction: destination is Sweden Central. Static frontend can remain West Europe and use browser HTTPS to the relocated API.
- D-2 · 2026-11-02 · Codex interpretation, pending user decision: relocation request does not by itself waive the explicit earlier zero-incremental-cost rule. No chargeable replacement or deletion was applied at that point; later explicit authorization is recorded in D-3.

- D-3 · 2026-11-02 · Product lead instruction: Keep monitoring at minimum cost; storage is approved at minimum cost. Preserve strict SQL free offer; no broader paid-service authorization.

- D-4 · 2026-11-02 · Product lead instruction: Keep Entra identity but remove SQL IP restrictions for initial development and VS Code/portal query access; supersedes the earlier narrow-IP boundary for this dev server only. No paid network/Defender dependency.
- D-5 · 2026-11-02 · Product lead instruction: On completion commit and push this branch, including other pending repository changes. No merge requested; credentials/ignored local files remain excluded.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-02 | Codex / assistant recorded | Inspect regions/identity/service support, research prices and prepare migration/cost plan | Unknown | Unmeasured; linked preflight and plan. No duplicate time attributed to VAC-26. |

| W-2 | 2026-11-02 | Codex / assistant recorded | Regional deployment/cutover, resource and repository cleanup, hosted verification and documentation corrections | Unknown | Unmeasured; post-cleanup readback, retired IDs and verification report. Provider test elapsed is recorded separately in VAC-26, not added here. |
| W-3 | 2026-11-02 | Architect agent / assistant recorded | Independent post-cleanup architecture review and follow-up of operational-document finding | Unknown | Unmeasured; [Completed review and re-review](media/VAC-35/architect-review-2026-11-02.md). Not human release approval. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not separately recorded. No estimate of implementation effort recorded.

## History

- H-1 · 2026-11-02 · Codex: Created Specification; destination and frontend exception identified, cost/deletion/monitoring choices unresolved.

- H-2 · 2026-11-02 · Codex: Specification → In progress after explicit minimum-cost storage/monitoring approval; prepare scoped backend replacement.

- H-3 · 2026-11-02 · Codex: In progress → QA after regional cutover and post-cleanup readback; pending architect/independent acceptance and native/CI limitation.

## Verification and release

[Post-cleanup verification](media/VAC-35/verification-post-cleanup-2026-11-02.md): actual ten-resource inventory, eight retired IDs, desired Sweden Central backend/unchanged Free frontend, storage/monitoring controls and dedicated Entra-only/free-limit readback. Compiled/linted SQL entry points/modules and all environment parameters; provider validation/what-if passed. Named cleaned artifact and matching frontend are deployed; hosted smoke/HTTP/schema/restart and full functional browser mode passed. Existing native/default QA remains VAC-15; architect review passed after documentation corrections; commit/push follow, with no merge or independent release approval claimed.

## Open questions and follow-up

Minimum-cost replacement storage/monitoring were explicitly approved; no new paid SQL/network/Defender dependency. Eight replaced/unneeded resources and thirteen redundant IP rules are removed. Remaining QA: independent release acceptance and VAC-15 native/default/CI reliability. FC1/grants and monitoring cap are not hard spending caps. No production recovery or identity claim.

## Post-cleanup architect review · 2026-11-02

[Separate read-only architect review](media/VAC-35/architect-review-2026-11-02.md) found one P2 operational-document consistency issue; corrected and re-reviewed as resolved, with no remaining architecture blocker. Compatibility balance snapshots and current organization/settings mapping retained for this cutover. Native/default browser reliability and independent release acceptance remain QA; review does not claim production readiness.
