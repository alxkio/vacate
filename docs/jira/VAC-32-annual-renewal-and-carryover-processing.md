---
id: VAC-32
type: story
summary: Renew annual entitlements and process configured carryover
status: specification
created: 2026-11-01
updated: 2026-11-05
parent: null
depends_on: [VAC-31]
---

# VAC-32 — Renew annual entitlements and process configured carryover

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an employee or authorized administrator, distinguish new-year allowance from prior-year leave available through its configured deadline.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future January renewal/carryover processing using yearly entitlement and accounting records. Founder confirmed on 2026-11-05 that the GR annual-leave carryover use deadline is 31 March of the following year, inclusive, displayed read-only in organization settings and not editable through UI/API. This supersedes the earlier configurable-GR-cutoff proposal. Cross-year requests are allowed; consume eligible previous-year leftovers first, then the leave date year's allowance, retaining per-year attribution and no negative balances. Preserve history, avoid duplicate grants/transfers and explicitly migrate legacy CarryoverYears semantics; no automatic forfeiture/payroll/legal consequence is inferred.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-31](VAC-31-leave-request-accounting-transactions.md): Durable request/accounting/charge/reversal records and agreed cancellation/transaction semantics.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] January renewal preserves previous-year entitlement/history and creates the new-year allocation once under retry/concurrency.
- [ ] Current-year versus previous-year amounts and concrete cutoff/provenance remain distinguishable; carryover is not counted twice.
- [ ] Accepted consumption order, cutoff timezone, configuration changes and cancellation-after-cutoff behavior are specified and verified before processing.
- [ ] Legacy carryover years/unlimited setting migration is explicit; tenant-isolated API/UI projections explain periods and errors. Post-cutoff handling follows reviewed policy, not silent deletion.

- [ ] Given eligible previous-year annual carryover and a January–March request, consume that carryover before the leave date year's allowance; split charges across entitlement years without double-counting.
- [ ] Given leave on 31 March versus 1 April, apply the inclusive previous-year use deadline by leave date; preserve unspent history without automatic forfeiture/payment. Confirm business timezone before runtime.
- [ ] Given a Greek administrator, show the deadline read-only; reject attempted deadline overrides at the API boundary and explicitly migrate superseded CarryoverYears/disable/unlimited controls. No tenant setting may contradict the selected GR deadline silently.

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

- D-2 · 2026-11-05 · Founder: GR annual carryover through 31 March inclusive, read-only organization policy display; cross-year requests allowed and eligible previous-year annual leftovers consumed first. Supersedes the configurable deadline proposal only. [Product direction](../product/product-charter.md#founder-decisions--submission-boundaries-and-yearly-charges--2026-11-05), [official-source check](../compliance/policy-sources.md#annual-leave-deadline-check--2026-11-05). No automatic entitlement deletion/payroll/legal guarantee.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |
| W-2 | 2026-11-05 | Codex / shared work reference | Align carryover direction with request-form decisions | Not separately recorded | Shared unmeasured specification activity recorded once in VAC-31 W-7. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed: not recorded. No estimate recorded. No implementation time recorded.

## History

- H-1 · 2026-11-01 · Codex: Created as specification; future decisions/prerequisites remain open; no implementation started.

- H-2 · 2026-11-05 · Codex: Remains Specification; deadline editability and consumption order resolved, with timezone/correction/cancellation/migration questions retained.

## Verification and release

Documentation metadata, links, parent/dependency graph and backlog consistency are checked during the split. Acceptance scenarios are pending; no runtime test, migration, provisioning, external messaging, commit, push or deployment is claimed.

## Open questions and follow-up

GR deadline is fixed/read-only and eligible previous-year-first consumption is selected. Deadline business timezone, retroactive charge allocation, post-cutoff consequences, rehires, cancellations and legacy config migration remain open. VAC-20's saved configuration alone does not authorize this processing.
