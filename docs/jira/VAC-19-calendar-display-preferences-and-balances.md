---
id: VAC-19
type: story
summary: Consolidate calendar preferences and balance ordering
status: in-progress
created: 2026-10-28
updated: 2026-10-29
parent: null
depends_on: []
---

# VAC-19 — Consolidate calendar preferences and balance ordering

![Story](badges/story.svg) **🔨 In progress** · Owner: Codex

## Description

As a demo employee, I want one default calendar workspace with optional personal layout and color preferences, organization-wide availability, and a balance list ordered around my own family context, so I can plan without comparing competing design directions or exposing colleagues' private leave details.

## Scope

- Remove the A/B/C comparison gallery. Keep A's calendar workspace as the only default workspace.
- Make B's people-row team planner an optional calendar-layout preference.
- Make C's warm brown palette an optional color-scheme preference; A's green palette remains the default.
- Save layout and color separately per fictional company/person in this browser's local storage. Do not send these display-only preferences to the profile API.
- Allow every fictional account to select the whole organization's calendar. Shared entries remain limited to identity and dates with a generic **Away** label.
- On My balances, show annual first; when the signed-in user's own profile has dependent children, promote school attendance, childcare and parental balances. Move sick, maternity, paternity, voting and military balances further down.
- Change balance-page presentation only. Do not reorder or filter the shared request chooser, change leave eligibility, or create legal entitlements.
- Keep the organization's scope mock-only. Production visibility and admin-managed rules remain future server/API authorization work.

## Dependencies

None. Existing calendar, planner, account fixtures, profile read model and catalogue are available. [VAC-5](VAC-5-common-leave-types-chooser.md) and [VAC-8](VAC-8-calendar-first-and-balances-page.md) are related historical stories; their request shortlist and navigation behavior remain intact.

## Acceptance scenarios

- [ ] Given any demo account, the calendar opens in the single A workspace with A's green palette and no A/B/C comparison controls.
- [ ] Given a user selects the team planner or C's warm palette in Settings, the choice is saved in this browser for that company/person and restored after refresh.
- [ ] Given a different demo account or company context, it receives its own default or saved preferences and cannot read or overwrite another account's preference.
- [ ] Given any of the twelve fictional roles, the user can select organization scope and see the company roster and date availability; shared calendar labels/details expose no leave type, reason, status, balance or family/health profile.
- [ ] Given an employee with dependent children in their own profile, annual is followed by school attendance, childcare and parental balances; sick, maternity, paternity, voting and military are lower in the balance page.
- [ ] Given a non-parent account, annual remains first and parent-related types are not specially promoted. All existing reference types remain available through Show all.
- [ ] Given a change in balance presentation, the request chooser retains its existing shared shortlist and order, and existing eligibility/allowance behavior is unchanged.
- [ ] Given a foreign company identifier or invalid group, organization roster and availability return no foreign data. This fixture test does not claim production tenant authorization.

## Subtasks and responsibilities

### UX

- [x] Record the founder's preference decisions and distinguish the demo organization calendar from future admin visibility rules.
- [x] Specify parent-aware balance ordering as display-only; preserve the shared request shortlist.

### UI

- [x] Remove the direction gallery and retain the A workspace.
- [x] Add per-account browser display preferences for planner layout and C palette.
- [x] Expose organization scope to all fictional demo roles while retaining generic availability labels.
- [x] Reorder balance cards without changing request chooser ordering.

### Backend

Not applicable: calendar and balances remain fictional frontend fixtures. No API authorization or endpoint behavior changes.

### Database

Not applicable: display preferences are browser-local and no leave policy, balance or entitlement data is changed.

### QA and other responsibilities

- [ ] Verify profile settings persistence, account/company isolation, all-role organization scope, shared-data privacy and parent/non-parent balance ordering.
- [ ] Verify existing responsive calendar, request chooser, navigation, keyboard and account-session behavior.
- [ ] Explicitly retain the foreign-company negative fixture scenario; no production tenant-isolation claim is made.

## Attachments and sources

- Founder UI feedback retained in [next-up notes](../next-up.md).
- [Calendar UI proposal](../design/calendar-ui-proposal.md).
- [Calendar-first and balances proposal](../design/calendar-first-balances-proposal.md).
- [Leave balances proposal](../design/leave-balances-proposal.md).
- [Historical A/B/C previews](../design/calendar-mock/README.md).
- Related [VAC-5](VAC-5-common-leave-types-chooser.md) and [VAC-8](VAC-8-calendar-first-and-balances-page.md).

## Comments

- C-1 · 2026-10-28 · Founder direction, paraphrased: retain A as the only default; make B's planner and C's warm color palette personal settings; let all demo users view generic organization availability; emphasize relevant parental balances and move sick/event types lower.
- C-2 · 2026-10-29 · A profile settings test failed because the component-test `WorkspaceDataService` double lacked the newly added display-preferences methods. Updated the fixture provider to implement the same account-scoped browser-storage contract as the application service.

## Decisions

- D-1 · 2026-10-28 · Founder: use A as the only default workspace; make B layout and C palette optional display preferences.
- D-2 · 2026-10-28 · Founder clarification: persist display preferences locally per demo account, separately from the API-backed profile.
- D-3 · 2026-10-28 · Founder: enable organization calendar scope for all current demo users. Keep colleague data generic; later admin visibility rules are out of scope.
- D-4 · 2026-10-28 · Founder: promote annual and, for parents, school attendance, childcare and parental balances. Move sick, maternity, paternity, voting and military lower. This changes presentation only.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-28 | Codex / assistant recorded | Implement calendar preferences, organization fixture visibility, balance ordering, documentation and regression checks | Unknown | Work time was not measured. |
| W-2 | 2026-10-28 | Codex / assistant recorded | Run static checks and diagnose frontend build/test blocker | Unknown | App and spec TypeScript checks, fixture verification, browser-script syntax check and `git diff --check` passed. Angular build and unit test runner could not initialize on this macOS 12 host; see verification below. Time was not measured. |
| W-3 | 2026-10-29 | Codex / assistant recorded | Fix the profile-settings component-test provider after a reported failing test | Unknown | Added the missing display-preferences read/write methods to the fixture provider. Spec TypeScript check passed; focused Angular test could not initialize on this host. Time was not measured. |

Human actual: Unknown. Assistant recorded: Unknown. Automation elapsed: not recorded. No estimates or overlapping totals.

## History

- H-1 · 2026-10-28 · Codex: Created In progress from the founder's UI direction; existing calendar, profile and fixture behavior inspected.

## Verification and release

Static verification passed before this follow-up: app and spec TypeScript checks, `verify-fixtures.mjs`, `node --check verify.mjs` and `git diff --check`. Following the test-provider fix, `tsc -p tsconfig.spec.json --noEmit` passed.

The fixture verifier covered all-role organization scope and sanitized shared projections, among its other synthetic fixture checks. The reported failure was traced to the test double not providing `displayPreferences()` / `saveDisplayPreferences()`; both methods are now present in the fixture provider.

`npm run build`, `npm test -- --watch=false` and the focused profile settings Angular test were attempted with Node 22.22.3, but Angular reported `VM initialization failed: Current Mac OS X version 12.0 is lower than minimum supported version 14.0`. The commands remained running after initialization failed and were stopped. The Angular build and unit tests therefore did not complete, and browser acceptance was not run. Rerun those checks on macOS 14 or newer before moving this issue to QA. This mock-only change does not authorize or include a backend/API deployment.

## Open questions and follow-up

No product questions remain for this demo scope. Production organization visibility rules, identity, authorization and tenant-isolation enforcement remain future server/API work.
