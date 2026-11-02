---
id: VAC-30
type: story
summary: Calculate annual allowances and preserve yearly policy entitlements
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-27]
---

# VAC-30 — Calculate annual allowances and preserve yearly policy entitlements

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an authorized organization admin or HR user, configure an employee allowance or use reviewed policy and retain the applied yearly entitlement.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future GR policy/version evaluation, employment inputs, organization default, Use policy/Custom allowance editor and AnnualLeaveEntitlements history. Whole-day employee requests now; retain future hourly storage. No unreviewed statutory defaults, full request workflow, carryover processing or notification delivery.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-27](VAC-27-production-identity-and-account-lifecycle.md): Working selected-target identity/session adapters, verified-recipient/account contract and platform-principal mapping.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] Null AnnualAllowanceOverrideDays remains dynamic policy inheritance; custom mode suggests org default without silently replacing null. New explicit values meet both org/policy floors with UI warning and server rejection.
- [ ] Null is allowed even when policy is below org default. Existing override overtaken by a later policy minimum stays unchanged with no automatic raise/review; expose the warning condition for the linked notification story.
- [ ] Reviewed policy inputs/version and applied allowance are retained by membership/year, not silently recomputed for historic years. Unknown policy/service remains unresolved.
- [ ] Company admin/explicitly authorized HR can configure only their company; ordinary users/job titles/foreign IDs cannot. API/contracts/UI cover errors, timestamps and private-data boundaries.

## Subtasks and responsibilities

Policy/product: approved GR applicability/effective dates/tiers/prorating. Backend/database: evaluation/versioning and annual history. UX/UI: authorized policy/custom form. QA: floors/null/stale overrides/history/tenant cases.

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

Complete reviewed GR policy including calendar-year/pro-rating/tenure/experience/workweek; HR role mapping; snapshot revision/effective dates, decimal precision and org-default changes. Existing statutory-source register has no approved engine. Related VAC-33 owns warning UI/notifications; no reverse dependency.
