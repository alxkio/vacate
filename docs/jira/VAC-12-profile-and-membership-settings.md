---
id: VAC-12
type: story
summary: View membership and edit own profile from settings
status: qa
created: 2026-10-26
updated: 2026-10-26
parent: null
depends_on: [VAC-11, VAC-10]
---

# VAC-12 — View membership and edit own profile from settings

![Story](badges/story.svg) **🔍 QA** · Owner: Codex (implementation)

## Description

Founder request, 2026-10-26: implement the profile/membership settings page, reachable from the left menu and a dropdown on the profile picture. Users see their own membership and edit the approved self-profile fields.

## Scope

Angular fictional mock only. Names, gender, married, dependentChildren and soleCare are editable; membership and username/account status are read-only. Preserve married/sole-care exclusion. Mock saves are in-memory, scoped to the signed-in canonical account and cleared on sign-out/reload; show this limitation. No real profile API, invitations, company admin editor, authentication or statutory policy implementation. Existing fixture IDs/capabilities remain compatibility context; settings maps them explicitly to the new contract. Lead remains a visibility capability, not an admin system role.

## Dependencies

- [VAC-11](VAC-11-draft-user-schema.md): confirmed self-edit allowlist, membership structure, defaults and privacy boundaries are available; unresolved invitation/identity/policy decisions are excluded from this mock.
- [VAC-10](VAC-10-consolidate-angular-frontend.md): released Angular shell, navigation and acceptance harness.

## Acceptance scenarios

- [x] Every demo persona opens settings from sidebar and profile dropdown, or a signed-in direct link; navigation/history/mobile/keyboard behavior works.
- [x] Own profile/membership details appear; membership is read-only even for an admin on this self-service page. Unassigned membership has an explicit empty state.
- [x] Valid approved fields save for the current account during the current in-memory mock; cancel restores saved values, invalid input/incompatible family facts fail without partial changes. Edits refresh own name/eligibility; no inferred divorce/widowhood or altered ledgers.
- [x] Unknown family values normalize to defaults, and unauthorized fields/cross-account/foreign-company/stale-session updates fail. Reload/sign-out clear edits. Colleague projections exclude private facts.
- [x] Appropriate build, unit/domain/schema and browser regression checks pass. Future real API gate: deny company A access/update to B's membership/profile, enforce self allowlists and company-admin operations server-side; public fixture tests do not prove tenant isolation.

## Subtasks and responsibilities

- UX/UI: Profile form, read-only membership, save/cancel/error/status states; responsive navigation and avatar dropdown.
- Backend/database/infrastructure: Not applicable to this mock. Keep server authorization and persistence pending.
- QA/privacy: Own-account write guard, projection checks, eligibility refresh, account resets, keyboard/mobile and regression verification.

## Attachments and sources

- [User contract](../contracts/user.md), [schema](../contracts/user.schema.json) and [charter](../product/product-charter.md), founder directions 2026-10-26.
- [Angular acceptance](../../frontend/README.md#acceptance) and [eligibility review](../product/leave-eligibility-review.md); existing provisional mock rules only.

## Comments

- C-1 · 2026-10-26 · Codex: Use in-memory mock editing with an explicit reset notice; production identity/policy and invitation lifecycle are outside this page.

- C-2 · 2026-10-26 · Codex: Implemented and automated checks passed. Kept QA for independent privacy/product review; no claim of production authorization or release. Browser native-keyboard checks run before history traversal because the harness can lose trusted input afterward.

## Decisions

- D-1 · 2026-10-26 · Founder: Implement self-profile/membership settings with sidebar and profile-picture dropdown entry points.
- D-2 · 2026-10-26 · Codex implementation choice: Keep admin organization settings as a separate planned destination; settings is available to all signed-in personas. Do not interpret new married=false as divorce for the old mock evaluator.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-26 | Codex / assistant recorded | Implement and verify fictional settings experience | Unknown | Duration not measured; files and checks recorded below. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-26 · Codex: Created In progress after explicit founder implementation request; bounded source outputs inspected.

- H-2 · 2026-10-26 · Codex: In progress → QA after production build, 13 unit/component tests, profile/fixture/schema checks and complete real-browser acceptance passed. Independent release/privacy review and deployment are not performed by these checks.

## Verification and release

- Production build passed under Node 22.22.3, with JavaScript Sass (`NG_BUILD_SASS_EMBEDDED=0`) for the older macOS host. Initial sandbox/native tooling attempts crashed; the production build succeeded outside the sandbox with two workers and nonparallel TypeScript. No dependency or production compiler configuration was changed.
- `ng test --watch=false`: 5 files / 13 tests passed, including profile rejection/reset, stale-account protection, read-only admin membership and the unassigned empty state.
- `node verify-profiles.mjs`: all 12 generated own-profile records validate against the user schema; unauthorized keys, mixed-payload atomicity, invalid family facts, stale/cross-account/foreign-company writes, detached reads, privacy, eligibility refresh, unchanged membership and reset passed. This check now runs in CI.
- Existing `verify-fixtures.mjs` and `verify-eligibility-contract.mjs` passed, including 12 responses / 360 eligibility decisions.
- Complete `verify.mjs` Chrome acceptance passed: prior 12-person scope/eligibility/calendar/balance/request/history journeys plus settings sidebar/dropdown, native keyboard/Escape/focus, valid save/cancel, invalid family combination, own-name/eligibility refresh, read-only membership for employee/admin, account switching, sign-out/reload reset, direct entry and 375px overflow checks. Existing native keyboard checks are isolated from later history traversal in the same fresh-document stage.
- Visually reviewed [desktop settings](media/VAC-12/settings-desktop.png) and [mobile settings](media/VAC-12/settings-mobile.png). Screenshots contain fictional data only. Header/profile names are synthetic.
- Relevant whitespace, local links, unique issue IDs, matching backlog/status/dependencies and acyclic dependency graph checked.

No real API or tenant-isolation implementation, independent privacy/security approval, deployment, commit or push is implied. No human time was measured.

## Open questions and follow-up

Production authentication/persistence, invitations and policy implementation remain open in VAC-11; no further issues created. Independent release review remains separate from automated checks.
