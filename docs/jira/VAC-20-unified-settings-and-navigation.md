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

### Settings/header correction · 2026-10-30

Product lead feedback clarifies that the top bar should keep the organization name and remove the visible user name. Employees such as Maya must have neither Organization/Team Settings entries nor access to those pages. Expose Profile and System (existing display preferences) to employees and existing non-admin lead personas; administrators retain Organization and Team as well. Keep authorized team calendar/directory visibility and backend permissions unchanged. Redirect restricted direct/legacy settings links to Profile and guard rendering independently of navigation visibility.

### Completed additional feedback · 2026-10-30

These later directions supersede the blanket admin-only Team Settings rule above. The product lead confirmed feedback complete and selected team → department → organization approval precedence before implementation and testing resumed. The earlier testing/build/commit hold is lifted.

- My Leave should include balances for leave types used within the year, treating one-off/event-based types separately, and show pending approval. Order dated requests descending. Pending requests must not reduce balances while approval is required. Do not infer a legal maternity-frequency rule from the illustrative one-off example.
- Employees retain Profile and System. Team leads have Profile and, when the organization permits it, their Team Settings. Department leads have Profile/System and, when permitted, their Department Settings and settings for teams within that department. Organization owners and HR have all settings. Existing employee System access is personal display configuration; distinct management scopes need explicit enforcement rather than inference from a job title.
- For the fictional test organization, assume the organization permits the delegated lead settings access. The only Team/Department setting currently requested is whether annual/vacation leave requires approval.
- The product lead explicitly selected team precedence when a team and its department have different vacation-approval settings. An explicit team value overrides the department value.
- Organization Settings must expose three separate controls: require approval for annual/vacation leave, allow department leads to access their Department Settings, and allow team leads to access their Team Settings. Enable both lead-access controls in the fictional test organization as already directed. These are organization-owned permissions, not lead-controlled self-grants.
- Organization Settings must also expose whether annual/vacation days may carry over and a carryover limit measured in years. A year limit of `0` means unlimited years; disabling carryover is a separate control. The product lead explicitly limited this item to saved configuration only: do not transfer days, expire days, recalculate balances or implement carryover processing. This is not a limit on the number of days and does not establish a statutory carryover rule.
- The avatar/user-icon menu entry is named **Settings**, matching the main navigation; replace its earlier **Profile settings** label. This is a label correction and does not narrow the unified settings destination to Profile.

Implementation boundary: explicit server-owned settings roles and organization delegation flags now enforce the requested scopes, separately from employee/admin system roles and display job titles. Existing public fictional reference ledgers remain labelled examples, not authoritative transactions. Approval Requests remains unavailable; no request assignment or decision workflow is introduced.

Resolved product decision: team overrides department, then organization. Nullable scope settings inherit; explicit false overrides true above it.

## Dependencies

None. Existing implementations verified by inspection: [VAC-13](VAC-13-api-backed-settings.md) supplies resource clients, company-scoped membership access and editors; [VAC-19](VAC-19-calendar-display-preferences-and-balances.md) supplies display preferences/personal balances. These are related work, not new implementation prerequisites.

## Acceptance scenarios

- [x] Settings has one main navigation entry. Employees see Profile/System; permitted team leads also see their Team; permitted department leads see their Department and child Teams; owners/HR and existing administrators see all sections. Restricted direct/legacy links resolve to Profile without mounting unauthorized pages.
- [x] Admins can filter employee annual balances by team/name and sort remaining totals; a visible adjustable percentage threshold highlights known high balances; unknown values remain unknown.
- [x] Employees, non-admin leads and foreign-company actors cannot read admin balance data; a direct navigation attempt cannot render employee balances.
- [x] Approval Requests shows an explicit unavailable state without disclosing other people's pending requests or adding budget functionality.
- [x] People supplies the authorized directory and admin membership editor. My Leave shows recurring types used in the reference year, pending approval and dated requests descending; event-based leave remains in history. Pending annual leave is not deducted when effective approval is required.
- [x] The top bar shows the organization name and omits the visible user name; account identity and sign-out remain in the avatar dropdown.
- [x] System contains the existing per-account display preferences and Profile retains self-profile editing and read-only membership. Both retain stale-account/tenant checks and mobile behavior.
- [x] Organization carryover configuration distinguishes disabled carryover from enabled carryover with unlimited years (`0`), accepts the configured year limit without treating it as a day cap, and remains restricted to authorized organization settings users. Saving these settings leaves all leave days and balances unchanged; no carryover processing is implemented.
- [x] Own-team rosters include the actor, follow API membership reassignment, exclude other teams/tenants and omit private account/family/balance fields. Membership does not imply management rights.
- [x] The sign-in chooser and advertised credentials show exactly four representative personas, autofill their existing credentials, retain all twelve fixture people and preserve lead/tenant permissions.
- [x] Frontend tests, backend tests, production build and applicable browser checks pass, or remaining verification gaps are explicitly recorded.

## Subtasks and responsibilities

- UX/UI: unify settings and navigation using existing visual patterns and responsive section navigation.
- Backend: extend the authorized summary with own-team directory and permitted settings scopes; enforce server-owned settings roles, delegation flags, team/department overrides, organization configuration and approval-aware balance projections. Reuse existing endpoints and membership/directory reads.
- Database/infrastructure: extend the existing in-memory seed with explicit settings roles and organization defaults. No database migration or new lifecycle entity; existing server-owned timestamps cover settings mutations.
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

C5 · 2026-10-30 · Assistant: product lead corrected the earlier header interpretation: remove user name, retain organization name. Also restrict employee Settings to Profile/System; visibility alone is insufficient, so apply shared role checks to routes, selection and rendering. Existing backend administration and team availability permissions remain unchanged. Reopened for implementation and paired local verification.

C6 · 2026-10-30 · Assistant: 50 frontend tests passed using production routes, including employee/lead redirects, direct component bypass rejection, admin foreign-company denials, Profile/System separation and stale-account preference writes. Production build, both TypeScript project checks, existing fixture/contract scripts and 22 Release backend tests passed. Local API start was declined and no API was listening on test ports, so real-browser/real-HTTP verification of this correction is explicitly pending hosted checks; no local browser pass is claimed.

C7 · 2026-10-30 · Assistant: captured additional My Leave balances/pending-approval feedback and delegated team/department settings scopes. Product lead requested holding further testing until feedback is complete. Subsequent explicit clarification permits lead settings in the test organization, limits Team/Department settings to vacation approval requirements, and gives explicit team settings precedence over department settings. No tests, builds or commits have been initiated after the hold instruction.

C8 · 2026-10-30 · Assistant: product lead confirmed feedback complete and team → department → organization precedence. Implemented delegated settings end to end, configuration-only carryover, approval-aware My Leave, header/menu correction and Profile/System separation. Verification details are appended to the linked evidence; no new approval workflow or calendar work.

## Decisions

D1 · 2026-10-29 · Product lead: keep unavailable approval inbox in this change; no new approval workflow.
D2 · 2026-10-29 · Assistant implementation choice: default high-balance viewing threshold is 75% of known allocation; adjustable locally and explicitly not a policy rule. Keep provisional allocation separate from remaining balance.

D3 · 2026-10-30 · Product lead: retain all test data and existing permissions; limit only advertised login options to one representative per review persona. No new authorization role or access scope is approved.

D4 · 2026-10-30 · Product lead feedback / Assistant implementation: supersede the earlier company-name removal. Keep organization context in the top bar and account details in the avatar menu. Organization/Team Settings are company-admin destinations; Profile and System are personal destinations. Non-admin lead labels do not grant administration. Preserve team calendars and their permitted rosters.

D5 · 2026-10-30 · Product lead: supersede D4's blanket Team Settings restriction with organization-permitted, scoped Team/Department lead settings; owners and HR have all settings. Enable this delegation in the test example. Only the vacation-approval requirement is currently requested as a Team/Department setting.

D6 · 2026-10-30 · Product lead: an explicit team vacation-approval setting takes precedence when it differs from the department setting. Pending requests do not count against balances while approval is required.

D7 · 2026-10-30 · Product lead: Organization Settings contains distinct vacation-approval, department-lead Department Settings access and team-lead Team Settings access controls. The test organization permits both kinds of delegated lead access. Testing/builds and commits remain on hold while feedback is collected.

D8 · 2026-10-30 · Product lead: Organization Settings also controls whether vacation days carry over and for how many years. `0` years means unlimited; an independent off setting disables carryover. No legal carryover default or limit is inferred from this configurable requirement.

D9 · 2026-10-30 · Product lead clarification: D8 is settings/configuration only in this change. Do not implement carryover transfers, expiry, balance recalculation or processing. This limitation applies to the carryover item, not the separately requested approval-aware My Leave balance presentation.

D10 · 2026-10-30 · Product lead: name the avatar-menu entry **Settings**, not **Profile settings**, to match the unified settings destination. Label updated without running tests, builds or commits during the feedback hold.

D11 · 2026-10-30 · Product lead: feedback complete; resume verification. Organization approval is a default, overridden by an explicit department setting and then an explicit team setting. This resolves the hierarchy question and supersedes the testing hold in D7. See the [product charter](../product/product-charter.md#further-founder-feedback--personal-leave-and-delegated-settings--2026-10-30).

## Work log

W1 · 2026-10-29 · Assistant recorded · Inspection, implementation and verification · Duration: Unknown (not measured). Evidence: changed source and verification below. Human actual: Unknown; no estimated or reconstructed hours.

W2 · 2026-10-29–30 · Assistant recorded · Investigate reported CI failures, add history regression coverage and verify correction · Duration: Unknown (not measured). Human actual: Unknown. Evidence: history regression notes in the verification record.

W3 · 2026-10-30 · Assistant recorded · Curate sign-in options, preserve fixtures and permissions, add UI checks and verification · Duration: Unknown (not measured); human actual: Unknown.

W4 · 2026-10-30 · Assistant recorded · Correct header identity, role-aware Settings routes/rendering, separate System preferences and verify employee/admin/foreign-company journeys · Duration: Unknown (not measured); human actual: Unknown.

W5 · 2026-10-30 · Assistant recorded · Implement completed feedback across domain/application/HTTP and frontend; add role, tenant, inheritance, carryover and personal-leave regressions; run local paired verification · Duration: Unknown (not measured); human actual: Unknown. Evidence: source changes and appended verification record.

## History

H1 · 2026-10-29 · Assistant · Created In progress for the authorized implementation.

H2 · 2026-10-29 · Assistant · Moved to QA after paired frontend/backend and browser verification; independent product/security review remains pending.

H3 · 2026-10-29 · Assistant · Reopened In progress to fix the CI history regression reported after commit 54beec9.

H4 · 2026-10-30 · Assistant · Returned to QA after the full functional browser regression and 38 frontend tests passed; hosted CI and independent acceptance remain pending.

H5 · 2026-10-30 · Assistant · Reopened In progress for the explicitly requested small persona-chooser follow-up.

H6 · 2026-10-30 · Assistant · Returned to QA after 43 frontend tests, production build, real-HTTP twelve-account verification and navigation/browser persona checks passed.

H7 · 2026-10-30 · Assistant · Reopened In progress for explicit product lead feedback on header identity and employee Settings access.

H8 · 2026-10-30 · Assistant · Returned to QA after implementation, 50 frontend tests, 22 backend tests, production build and static/contract checks passed locally. Updated browser acceptance awaits execution; local API startup was declined.

H9 · 2026-10-30 · Assistant · Reopened In progress for the additional My Leave and delegated settings requirements. Feedback collection is ongoing; further tests/builds and commits are on hold at the product lead's instruction.

H10 · 2026-10-30 · Assistant · Returned to QA after completed feedback implementation, 56 frontend tests, 28 backend tests, production build, static/contract and real HTTP checks, and the complete default browser suite including native input passed locally. Independent review and hosted CI remain pending.

## Verification and release

[Verification evidence](media/VAC-20/verification.md) preserves earlier checks and records the completed feedback separately. Current local verification includes frontend/backend tests, production build, static/contract scripts and real HTTP/browser checks. No independent security/release sign-off or Azure deployment is claimed.

## Open questions and follow-up

No blocking product questions remain for this change. Request assignment, self-approval and decision rules remain outside scope, as explicitly confirmed. API balances remain unresolved until a trusted policy/ledger exists; reference display does not authorize new policy calculations. Carryover processing and a settings-role assignment editor are not implemented.
