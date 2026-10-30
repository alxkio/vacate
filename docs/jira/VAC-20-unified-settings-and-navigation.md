---
id: VAC-20
type: story
summary: Unify settings and clarify leave, people and approval navigation
status: qa
created: 2026-10-29
updated: 2026-10-30
parent: null
depends_on: []
---

# VAC-20 — Unify settings and clarify leave, people and approval navigation

![Story](badges/story.svg) **🔍 QA** · Owner: Assistant implementation; product lead review pending

## Description

Implement the product lead's 2026-10-29 navigation and UI request: one Settings destination with Organization, Team and Profile sections; admin employee balance overview; Approval Requests destination; distinct People and My Leave; clean top navigation; consistent own-team membership.

## Scope

Reuse API services and existing editors. Preserve employee/admin authorization and optional team assignment. Calendar presentation and scheduling are excluded. No dependencies, persistence migrations, request transactions or new approval permissions.

Approval Requests remains explicitly unavailable by the product lead's reply on 2026-10-29. There is no request API or assignment logic to reuse. Do not infer approval rights from team-lead titles, manager references, or public fictional pending requests.

### Small follow-up · 2026-10-30

The product lead requested one advertised sign-in option per review persona: Employee (Maya), Team lead (Leah), Department lead (Ella) and Organization admin (Nora). The product lead explicitly clarified: retain all test data, limit only login options, and keep existing permissions; distinct team/department lead permissions belong to later work. All twelve accounts, credentials, fixture records and automated scenarios remain available. This is chooser presentation, not an authentication allowlist.

## Dependencies

None. Existing implementations verified by inspection: [VAC-13](VAC-13-api-backed-settings.md) supplies resource clients, company-scoped membership access and editors; [VAC-19](VAC-19-calendar-display-preferences-and-balances.md) supplies display preferences/personal balances. These are related work, not new implementation prerequisites.

## Acceptance scenarios

- [x] Settings has one main navigation entry and Organization, Team, Profile section navigation; existing profile, membership and organization functions remain accessible with the same permissions; legacy organization/settings links resolve.
- [x] Admins can filter employee annual balances by team/name and sort remaining totals; a visible adjustable percentage threshold highlights known high balances; unknown values remain unknown.
- [x] Employees, non-admin leads and foreign-company actors cannot read admin balance data; a direct navigation attempt cannot render employee balances.
- [x] Approval Requests shows an explicit unavailable state without disclosing other people's pending requests or adding budget functionality.
- [x] People supplies the authorized directory and admin membership editor; My Leave supplies personal request history and the existing personal balances view.
- [x] The top bar omits the demo company marker; sign-out is in the profile dropdown.
- [x] Own-team rosters include the actor, follow API membership reassignment, exclude other teams/tenants and omit private account/family/balance fields. Membership does not imply management rights.
- [x] The sign-in chooser and advertised credentials show exactly four representative personas, autofill their existing credentials, retain all twelve fixture people and preserve lead/tenant permissions.
- [x] Frontend tests, backend tests, production build and applicable browser checks pass, or remaining verification gaps are explicitly recorded.

## Subtasks and responsibilities

- UX/UI: unify settings and navigation using existing visual patterns and responsive section navigation.
- Backend: extend the authorized organization summary with the current member's team directory projection; reuse admin membership balance reads and the existing employee directory.
- Database/infrastructure: Not applicable; no new records or lifecycle transitions.
- QA: exercise routes, authorization, tenant isolation, filtering, unknown balances, membership changes and error states. Independent release/security review remains required.

## Attachments and sources

- Product lead request and explicit approval-inbox scope reply, 2026-10-29 (this session).
- [ADR-0003](../adr/0003-domain-and-application-services.md), accepted 2026-10-27.
- [Product charter](../product/product-charter.md).
- [API contract](../contracts/api.md) and [OpenAPI](../contracts/openapi.yaml).

## Comments

C1 · 2026-10-29 · Assistant: inspection found live membership balance values may be unresolved; reference ledgers are separate public fictional examples and must not substitute for missing API totals.

C2 · 2026-10-29 · Assistant: reopened after product lead supplied CI failures during history restoration: a transient default October period and a missing calendar element. Earlier bounded browser evidence did not cover the full history journey. Investigating browser synchronization; npm installation/audit warnings are not the reported assertion failure.

C3 · 2026-10-30 · Assistant: full-run diagnostics showed the selected November calendar entry absent under synthetic clicks; enabling CDP user-gesture activation for UI clicks and awaiting the expected restored state corrected the complete functional run. Added valid/foreign-team router history tests; 38 frontend tests pass. See the appended verification record for local native-input limits and hosted CI follow-up.

C4 · 2026-10-30 · Assistant: implemented the requested four-option chooser as a frontend-only follow-up; server authentication, aliases, data and permission rules are unaffected. The Department lead option selects Ella’s existing non-admin lead account.

## Decisions

D1 · 2026-10-29 · Product lead: keep unavailable approval inbox in this change; no new approval workflow.
D2 · 2026-10-29 · Assistant implementation choice: default high-balance viewing threshold is 75% of known allocation; adjustable locally and explicitly not a policy rule. Keep provisional allocation separate from remaining balance.

D3 · 2026-10-30 · Product lead: retain all test data and existing permissions; limit only advertised login options to one representative per review persona. No new authorization role or access scope is approved.

## Work log

W1 · 2026-10-29 · Assistant recorded · Inspection, implementation and verification · Duration: Unknown (not measured). Evidence: changed source and verification below. Human actual: Unknown; no estimated or reconstructed hours.

W2 · 2026-10-29–30 · Assistant recorded · Investigate reported CI failures, add history regression coverage and verify correction · Duration: Unknown (not measured). Human actual: Unknown. Evidence: history regression notes in the verification record.

W3 · 2026-10-30 · Assistant recorded · Curate sign-in options, preserve fixtures and permissions, add UI checks and verification · Duration: Unknown (not measured); human actual: Unknown.

## History

H1 · 2026-10-29 · Assistant · Created In progress for the authorized implementation.

H2 · 2026-10-29 · Assistant · Moved to QA after paired frontend/backend and browser verification; independent product/security review remains pending.

H3 · 2026-10-29 · Assistant · Reopened In progress to fix the CI history regression reported after commit 54beec9.

H4 · 2026-10-30 · Assistant · Returned to QA after the full functional browser regression and 38 frontend tests passed; hosted CI and independent acceptance remain pending.

H5 · 2026-10-30 · Assistant · Reopened In progress for the explicitly requested small persona-chooser follow-up.

H6 · 2026-10-30 · Assistant · Returned to QA after 43 frontend tests, production build, real-HTTP twelve-account verification and navigation/browser persona checks passed.

## Verification and release

[Verification evidence](media/VAC-20/verification.md): 36 Angular tests, 15 integration tests and 7 domain/unit tests passed; production build passed with the existing organization stylesheet warning. Navigation and existing organization functional browser checks passed against the actual Functions API. Reference fixture/schema/privacy checks and issue/link audit passed. No deployment, commit, release approval or independent security review claimed.

## Open questions and follow-up

Distinct team/department lead permissions are explicitly deferred; no future issue was created by this small follow-up. Existing request assignment, self-approval and decision rules remain outside this change, as explicitly confirmed. API balances remain unresolved until a trusted policy/ledger exists; display does not authorize new policy calculations.
