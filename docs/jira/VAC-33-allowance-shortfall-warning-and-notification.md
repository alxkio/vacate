---
id: VAC-33
type: story
summary: Warn administrators about allowances below updated policy minimums
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-30]
---

# VAC-33 — Warn administrators about allowances below updated policy minimums

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an authorized administrator, notice an existing employee override below a later policy minimum without automatic changes or a mandatory review workflow.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future membership-edit warning and administrator notification based on evaluated shortfall from annual entitlement/policy work. Preserve configured/applied override; never auto-raise, clear to null or introduce review tasks. Delivery mechanism/timing requires agreement; no external notification is sent by creating this record.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-30](VAC-30-annual-allowance-and-policy-entitlements.md): Reviewed annual entitlement/policy calculations, employment inputs and stored yearly allowance history.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] Existing override 25 versus later policy minimum 26 remains 25; authorized membership editors see the discrepancy and a truthful warning.
- [ ] Chosen administrator notification delivery, timing/retry/deduplication and clearing rules are specified; alerts create no approval/review gate or automatic allowance mutation.
- [ ] Unknown policy yields no fabricated shortfall; null inherits policy; new invalid numeric changes retain floor validation.
- [ ] Warnings/notifications reveal only data permitted to authorized same-company recipients; foreign admins/employees cannot enumerate another company's affected memberships. API/UI and errors are verified together.

## Subtasks and responsibilities

Product/UX: message, recipient/channel/timing and clearing decisions. Backend/database: evaluated condition and delivery state as required. UI: membership-edit warning. QA/privacy: authorization, no mutation/review, dedup/unknown-policy/cross-company cases.

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

Notification channel, authorized recipients (admin/HR), schedule/deduplication, delivery reliability, warning dismissal/re-evaluation. No generic notification platform or additional employee-data permissions are approved.
