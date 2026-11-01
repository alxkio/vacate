---
id: VAC-32
type: story
summary: Renew annual entitlements and process configured carryover
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-31]
---

# VAC-32 — Renew annual entitlements and process configured carryover

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an employee or authorized administrator, distinguish new-year allowance from prior-year leave available through its configured deadline.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future January renewal/carryover processing using yearly entitlement and accounting records. Proposed GR end-March next-year cutoff is configurable within reviewed policy. Preserve history, avoid duplicate grants/transfers and explicitly migrate legacy CarryoverYears semantics; no automatic forfeiture/payroll/legal consequence is inferred.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-31](VAC-31-leave-request-accounting-transactions.md): Durable request/accounting/charge/reversal records and agreed cancellation/transaction semantics.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] January renewal preserves previous-year entitlement/history and creates the new-year allocation once under retry/concurrency.
- [ ] Current-year versus previous-year amounts and concrete cutoff/provenance remain distinguishable; carryover is not counted twice.
- [ ] Accepted consumption order, cutoff timezone, configuration changes and cancellation-after-cutoff behavior are specified and verified before processing.
- [ ] Legacy carryover years/unlimited setting migration is explicit; tenant-isolated API/UI projections explain periods and errors. Post-cutoff handling follows reviewed policy, not silent deletion.

## Subtasks and responsibilities

Product/policy: lawful applicability, consumption/cutoff/post-cutoff decisions. Backend/database: durable renewal/carryover and retries. Infrastructure: scheduling only after design. UX/UI/QA: period explanation, date-boundary/tenant/concurrency/restore scenarios.

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

Policy-constrained override rights, carryover cap/order/expiry consequences, deadline timezone, rehires, cancellations and legacy config migration. VAC-20's saved configuration alone does not authorize this processing.
