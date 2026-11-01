---
id: VAC-26
type: story
summary: Persist existing Vacate resources in Azure SQL
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-25]
---

# VAC-26 — Persist existing Vacate resources in Azure SQL

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an authorized user, retain profile, membership and organization settings across API restarts with company isolation.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future implementation of the approved schema subset through existing repository ports and EF/SQL infrastructure; environment configuration/migrations and integration checks. Start from the founder's free-offer preference, verifying eligibility and selected environment before provisioning. Preserve existing HTTP/frontend behavior; paired contract/view changes only if explicitly required. Exclude production invitation, backoffice, policy engine and leave transactions.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-25](VAC-25-persistence-adr-and-migration-plan.md): Reviewed persistence ADR proposal, mapping and migration plan, including inherited model/constraint outputs.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] Authorized resource edits survive API restart without changing public GUIDs, lifecycle semantics or private projections.
- [ ] Company A cannot read/update/reference B's resources; SQL integration tests cover uniqueness, relationships, concurrency, last-admin protection and atomic failure.
- [ ] The reviewed migration, connection/identity configuration, environment separation and backup/restore plan are verified; demo credentials/seeds remain opt-in and fictional.
- [ ] API/frontend error/authorization paths are paired where affected; unchanged sides are explained. Deployment needs its separately confirmed target and authorization.

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

## Decisions

- D-1 · 2026-11-01 · Founder request: Split current work and future scope into separate tracked items. Existing product decisions remain in linked canonical documents; no open choice is silently resolved.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed: not recorded. No estimate recorded. No implementation time recorded.

## History

- H-1 · 2026-11-01 · Codex: Created as specification; future decisions/prerequisites remain open; no implementation started.

## Verification and release

Documentation metadata, links, parent/dependency graph and backlog consistency are checked during the split. Acceptance scenarios are pending; no runtime test, migration, provisioning, external messaging, commit, push or deployment is claimed.

## Open questions and follow-up

Accepted persistence ADR/schema review; exact initial persisted subset/data migration; cloud region/subscription eligibility; connection identity; restore/retention procedure and production-identity cutover. Story creation does not authorize provisioning.
