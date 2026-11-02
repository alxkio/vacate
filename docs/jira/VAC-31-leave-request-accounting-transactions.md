---
id: VAC-31
type: story
summary: Record leave requests and balance accounting transactions
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-30]
---

# VAC-31 — Record leave requests and balance accounting transactions

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an employee or authorized approver, submit whole-day leave and see consumption/remaining balances explained by durable records.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future request lifecycle, charge breakdown, accounting entries/reversals, approvals/cancellations and permitted availability. Approved-assignment/routing rules must be selected first. Pending leave does not deduct balance while approval is required. Exclude carryover expiry engine, hourly submission and speculative multi-level approvals.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-30](VAC-30-annual-allowance-and-policy-entitlements.md): Reviewed annual entitlement/policy calculations, employment inputs and stored yearly allowance history.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] Whole-day requests produce explained charges under reviewed working schedule/calendar; fractional/hourly or unsupported ranges fail atomically.
- [ ] Only explicitly authorized approvers can decide; configured approval requirement does not imply assignment or rights from manager/job title. Self-approval and insufficient-balance behavior follow accepted decisions.
- [ ] Approval and accounting changes commit once transactionally; retries/concurrent requests cannot duplicate deductions. Pending approval-required requests stay separate from remaining balance.
- [ ] Rejection/allowed cancellation follows agreed reversals, preserving history and membership allowance. Own/colleague projections and A-to-B reference/read/write/calendar paths enforce tenant/privacy boundaries.

## Subtasks and responsibilities

Product: approver/routing/cancellation/balance decisions. Backend/database: requests, charge/accounting transactions and idempotency. UX/UI: submission/history/inbox and permitted availability. QA: concurrency, full journeys, privacy/tenant/lifecycle.

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

Approver assignments/self-approval/fallback; insufficient-balance handling; consumption timing, working weekdays, holidays, cross-year ranges and cancellation rules. Coordinate existing VAC-4/VAC-9/VAC-20; their fictional/reference behavior is not production workflow acceptance.
