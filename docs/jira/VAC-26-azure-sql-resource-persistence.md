---
id: VAC-26
type: story
summary: Persist existing Vacate resources in Azure SQL
status: qa
created: 2026-11-01
updated: 2026-11-02
parent: null
depends_on: [VAC-25, VAC-34, VAC-35]
---

# VAC-26 — Persist existing Vacate resources in Azure SQL

![Story](badges/story.svg) **🔍 QA** · Owner: Unassigned

## Description

As an authorized user, retain profile, membership and organization settings across API restarts with company isolation.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Implementation of the approved schema subset through existing repository ports and EF/SQL infrastructure; environment configuration/migrations and integration checks. Empty dev infrastructure is split into [VAC-34](VAC-34-empty-azure-sql-free-offer.md), independently of schema design. This story retains EF adapters, schema migrations, connection/application integration and persistence verification; it does not provision or change infrastructure. Preserve existing HTTP/frontend behavior; paired contract/view changes only if explicitly required. Exclude production invitation, backoffice, policy engine and leave transactions.

Implementation authorized by the product lead on 2026-11-02 following ADR-0004 acceptance. Stage A scope is current resources plus opt-in development compatibility metadata; future feature tables remain excluded. Cloud application cutover/recovery and runtime identity/network decisions remain explicit gates.

## Dependencies

- [VAC-35](VAC-35-sweden-central-development-relocation.md): Same-region backend route selected after cross-region pricing preflight; requires destination app/identity/network outputs before hosted SQL cutover. Minimum-cost storage/monitoring authorization and relocation/deletion decisions are resolved; destination outputs and post-cleanup verification are available. Native-browser and independent acceptance remain QA.

- [VAC-34](VAC-34-empty-azure-sql-free-offer.md): Verified empty zero-cost dev SQL server/database and actual property readback before cloud application integration. Output available: vacate-dev-srv / vacate-dev-db, Sweden Central, Latin1_General_100_CI_AS_SC_UTF8, free-limit/AutoPause verified; application managed-identity principal/network/schema remain this story's work. VAC-34 does not depend on schema or this story.

- [VAC-25](VAC-25-persistence-adr-and-migration-plan.md): Delivered mapping/migration plan under ADR-0004, accepted by the product lead on 2026-11-02, including inherited model/constraint outputs; runtime gates remain mandatory.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [x] Authorized resource edits survive API restart without changing public GUIDs, lifecycle semantics or private projections.
- [x] Company A cannot read/update/reference B's resources; SQL integration tests cover uniqueness, relationships, concurrency, last-admin protection and atomic failure.
- [x] The reviewed migration, connection/identity configuration, environment separation and disposable-development recovery boundary are verified; demo credentials/seeds remain opt-in and fictional.
- [x] API/frontend error/authorization paths are paired where affected; unchanged sides are explained. Deployment needs its separately confirmed target and authorization.

## Subtasks and responsibilities

Backend/database: EF adapters, reviewed migrations and transactions. Infrastructure: Azure configuration, quota/free-offer and recovery validation. QA: SQL/API/browser acceptance. UI: verify existing views; no redesign. Product/privacy: resolve lifecycle/retention gates.

## Attachments and sources

- [VAC-22 decisions and schema context](VAC-22-relational-database-schema.md).
- [Product charter](../product/product-charter.md).
- [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0003](../adr/0003-domain-and-application-services.md).
- [User contract](../contracts/user.md), [API contract](../contracts/api.md) and [policy-source register](../compliance/policy-sources.md).

Accepted canonical sources override issue notes. No unreviewed statutory defaults or new private-data permissions are established by this record.

## Comments

- C-1 · 2026-11-01 · Codex: Created by splitting current design and future work from VAC-22; no implementation or release evidence yet.

- C-2 · 2026-11-01 · Codex: User authorized splitting empty zero-cost infrastructure into VAC-34; repository/EF persistence, schema, API integration and all remaining work stay here. Design proposal delivered in VAC-25, but ADR acceptance and runtime gates remain unresolved.

- C-3 · 2026-11-02 · Codex: Recorded explicit product lead acceptance in [ADR-0004](../adr/0004-relational-persistence.md#product-lead-acceptance--2026-11-02) and its index. No runtime or Azure changes made.

- C-4 · 2026-11-02 · Codex: User explicitly authorized continuation after ADR acceptance. Audited current API/seeds: calendar/policy references are all null and API rejects non-null values. Initial schema enforces those nulls until their future feature defines targets. Implementation preserves current fictional snapshot/legacy carryover semantics, separate opt-in development markers and process-local sessions. No ephemeral memory data import or production recovery claim inferred.

- C-5 · 2026-11-02 · Codex: Stage A EF adapters/operator tooling and baseline migration implemented. Applied migration to the existing free dev SQL target; repeat migration and all nine actual-SQL tests passed. Test rows removed; only two fixed system roles remain. Final free-limit/AutoPause and closed-network readback verified. Default hosted mode remains memory; see [execution evidence](media/VAC-26/verification-2026-11-02.md).

- C-6 · 2026-11-02 · Codex: Identified existing user-assigned identity and West Europe app versus Sweden Central SQL. Public pricing has chargeable intra-Europe inter-region data transfer; no exemption verified. User requested Sweden Central backend relocation, now tracked separately in VAC-35. No hosted SQL switch made.

- C-7 · 2026-11-02 · Codex: Applied default-false IsDemo migration and ten actual-SQL tests passed (56.9620 s); explicitly imported the authorized twelve fictional accounts and one organization. Readback confirms that organization IsDemo=true. No UI/API field, authorization change or invitation delivery. Migration inspection precheck was corrected before schema apply; first failed attempt left baseline intact.

- C-8 · 2026-11-02 · Codex: Hosted SQL cutover/restart/HTTP/schema and complete functional browser checks passed; [post-cleanup verification](media/VAC-35/verification-post-cleanup-2026-11-02.md). Native/default browser reliability remains VAC-15 QA; no full default pass or production readiness. User authorized commit/push including pending changes, after cleanup and architect review.

## Decisions

- D-1 · 2026-11-01 · Founder request: Split current work and future scope into separate tracked items. Existing product decisions remain in linked canonical documents; no open choice is silently resolved.

- D-2 · 2026-11-01 · User instruction: Empty SQL infrastructure has no dependency on application-schema implementation. Add VAC-34 only as this story's direct cloud-target prerequisite; no invitation/policy work moved.

- D-3 · 2026-11-02 · Founder instruction: Founder accepted ADR-0004 shared-table/EF persistence and staged mapping/cutover direction; acceptance gate resolved, remaining runtime gates and zero-cost constraints unchanged. Source: [ADR-0004 acceptance](../adr/0004-relational-persistence.md#product-lead-acceptance--2026-11-02).

- D-4 · 2026-11-02 · User instruction: Continue with Stage A schema/persistence implementation under accepted ADR-0004. No future policy/onboarding/leave feature scope added; zero incremental Azure cost remains mandatory.

- D-5 · 2026-11-02 · Product lead instruction: Continue with fictional fixtures and disposable/reproducible development data; no production recovery promise or paid restore target inferred. Move regional backend to Sweden Central before hosted SQL integration; retain existing frontend after cross-region HTTPS clarification.
- D-6 · 2026-11-02 · Product lead instruction: Add an organization demo boolean in the database; mark fictional fixture organizations true. Implement default false and no authorization/billing/policy semantics or new UI/API field.

- D-7 · 2026-11-02 · Product lead instruction: For initial development, retain identity authentication but remove IP restrictions so the app, VS Code and portal query editor can connect. This explicitly supersedes the earlier narrow-IP requirement only for this dev SQL server. Keep Entra-only, TLS, least-privilege app identity and all SQL free-limit controls; no SQL password or paid network service.

## Work log

Split bookkeeping is referenced once in VAC-34 W-1; no duplicate time attributed here.

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |
| W-2 | 2026-11-02 | Codex / assistant recorded | Record product acceptance; synchronize ADR/index/mapping plan and related issues/backlog | Unknown | Duration not measured; shared documentation work recorded here only. |
| W-3 | 2026-11-02 | Codex / assistant recorded | Implement Stage A restoration/mappings/adapters, tooling, migration and SQL tests; apply baseline; document and verify | Unknown | Total duration not measured; [execution evidence](media/VAC-26/verification-2026-11-02.md). |
| W-4 | 2026-11-02 | NUnit / automation elapsed | Run nine actual Azure SQL tests | 1.1389 min | NUnit total for the provider test command; excludes builds, migration, local HTTP and assistant work. |
| W-5 | 2026-11-02 | Codex / assistant recorded | Add database-only demo marker, migration, fixture marking and verification; prepare least-privilege runtime tooling | Unknown | User-requested scope; duration not measured. |
| W-6 | 2026-11-02 | NUnit / automation elapsed | Run ten actual-SQL tests after demo migration | 56.9620 s | NUnit provider test command elapsed; excludes migration/import/assistant time. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed recorded: 1.1389 min (W-4) + 56.9620 s (W-6), separate command runs; not total work. No estimate recorded.

## History

- H-1 · 2026-11-01 · Codex: Created as specification; future decisions/prerequisites remain open; no implementation started.

- H-2 · 2026-11-01 · Codex: Retained specification; added VAC-34 prerequisite and removed empty-resource provisioning from scope.

- H-3 · 2026-11-02 · Codex: Product lead acceptance of ADR-0004 is recorded; retain Specification until remaining mapping/import, application principal/network, SQL verification and recovery/cutover decisions are ready.

- H-4 · 2026-11-02 · Codex: specification → in-progress for explicit implementation continuation. Confirmed VAC-25/VAC-34 outputs; remaining runtime/cutover gates remain documented.

- H-5 · 2026-11-02 · Codex: Retain In progress after verified Stage A schema execution; hosted application integration/recovery gates are still outstanding. No full-story Done/Released claim.

- H-6 · 2026-11-02 · Codex: In progress → QA after hosted SQL cutover, minimum-cost regional relocation and cleanup; architect review and native/CI gaps remain explicit.

## Verification and release

[Post-cleanup execution evidence](media/VAC-35/verification-post-cleanup-2026-11-02.md): ten actual-SQL tests, 28 baseline NUnit tests, hosted SQL HTTP/schema checks, real restart persistence and complete functional browser acceptance passed. Cleaned named artifact vac35-clean-20261102 is deployed; web/API cloud smoke and post-cleanup HTTP passed. The existing native/default browser reliability gap remains VAC-15 QA and must not be reported as a complete default pass. Runtime identity, Entra-only/TLS, authorized development network exception and SQL free-limit/AutoPause were read back. Architect review and requested commit/push follow; no merge or independent release approval claimed.

## Open questions and follow-up

ADR-0004 accepted 2026-11-02. Stage A mappings/subset and null-reference/precision/dev compatibility boundaries are implemented and tested. Development import, managed-identity grants, explicitly approved network mode, hosted restart/HTTP/schema/functional-browser checks and disposable-data recovery boundary are executed. Pending: architect/independent acceptance and VAC-15 native/default/CI reliability. Production identity, durable multi-worker sessions, real-data recovery/retention/erasure and future invitation/policy/leave features remain excluded; no paid SQL/restore target is authorized.

## Post-cleanup architect review · 2026-11-02

[Separate read-only architect review](media/VAC-35/architect-review-2026-11-02.md) found one P2 operational-document consistency issue; corrected and re-reviewed as resolved, with no remaining architecture blocker. Compatibility balance snapshots and current organization/settings mapping retained for this cutover. Native/default browser reliability and independent release acceptance remain QA; review does not claim production readiness.

## Consumption replacement authorized — 2026-11-02

The product lead subsequently selected immediate replacement of compatibility balance snapshots by leave records and derived balances. [VAC-36](VAC-36-derived-balances-from-leaves.md) owns this bounded amendment and its fresh migration/provider/hosted verification; earlier Stage A evidence remains a dated baseline, not proof of the new mapping. No request/approval UI or policy calculation is included.
