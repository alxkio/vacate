---
id: VAC-23
type: task
summary: Model the database ERD and table catalogue
status: todo
created: 2026-11-01
updated: 2026-11-01
parent: VAC-22
depends_on: []
---

# VAC-23 — Model the database ERD and table catalogue

![Task](badges/task.svg) **🟢 Open / ready for action** · Owner: Unassigned

## Description

Produce a reviewable relational model for the accepted Vacate domain and schema decisions.

Current design subtask of [VAC-22](VAC-22-relational-database-schema.md). Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Design only: map current aggregates and proposed persistence rows; separate accepted MVP tables from later extension tables. Include company ownership, numeric Id/public Guid, lifecycle timestamps, nullable AnnualAllowanceOverrideDays, yearly entitlement history, optional structure and future day/hour storage. Do not implement migrations, statutory calculations, identity or workflows.

The scope is ready for design work; direct prerequisite outputs must be available before dependent execution. No runtime implementation is included.

## Dependencies

None. Required source documents already exist.

Parent relationship is coordination/completion grouping, not a dependency on VAC-22; this avoids a parent/child cycle.

## Acceptance scenarios

- [ ] Given current domain and accepted decisions, an ERD and column catalogue document keys, relationships, cardinality, nullability, quantities/units and proposed precision.
- [ ] Use policy preserves null; custom-mode org default suggestion, explicit floors and unchanged stale overrides are correctly represented; yearly policy provenance is distinct from configuration and usage.
- [ ] Company-owned relationships are identified; cross-company FK risks and required validation are recorded. This design-only task does not execute runtime isolation tests.
- [ ] Unknown identity/policy/request/carryover behavior is shown as an option or open boundary, not invented implementation.

## Subtasks and responsibilities

Database/architect: model entities and field mappings. Product: check decision fidelity. Backend: check aggregate/repository compatibility. QA/privacy: review company/private-data boundaries. UX/UI/infrastructure implementation: Not applicable.

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

- H-1 · 2026-11-01 · Codex: Created as todo; bounded design work is actionable, subject to listed prerequisites.

## Verification and release

Documentation metadata, links, parent/dependency graph and backlog consistency are checked during the split. Acceptance scenarios are pending; no runtime test, migration, provisioning, external messaging, commit, push or deployment is claimed.

## Open questions and follow-up

Physical type/precision choices are design outputs. Identity/provider, complete statutory algorithms, non-login personnel and cross-company workspaces are excluded implementation decisions.
