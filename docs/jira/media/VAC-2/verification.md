# VAC-2 verification — 2026-10-27

Scope: local uncommitted Angular mock, prepared as revision label local-vac2. No deployment or real personal data.

## Passed checks

- Production Angular build under Node 22.22.3, using NG_BUILD_SASS_EMBEDDED=0, NG_BUILD_MAX_WORKERS=2 and NG_BUILD_PARALLEL_TS=0 on the older macOS host. Existing size budgets pass without the earlier stylesheet warning.
- Angular unit/component suite: 6 files / 18 tests passed. New coverage includes valid settings/cancel, atomic validation, selected department/team renaming, denied employee/lead access, foreign-company input, stale admin forms, flat organization rendering and direct teams without departments.
- Same imported factory: verify-organization.mjs passed admin-only read/write, all persona roles, invalid/extra inputs, forged capabilities, stale actor IDs, foreign companies/nodes, immutable read snapshots, unchanged ledgers, clear/reset, flat membership and direct-team layout. CI now runs this check.
- Existing verify-profiles.mjs, verify-fixtures.mjs and verify-eligibility-contract.mjs passed; the eligibility contract covers 12 own responses / 360 decisions.
- Organization-only Chrome functional mode passed: company name and 5/6-day edits, whitespace validation/cancel, consistent organization labels, department/team renames, member projection privacy, unchanged leave ledgers, mobile width, admin/employee/foreign-company direct entry and reload reset.
- All 226 static browser-evaluation string expressions were syntax-compiled after correcting a test selector quoting error. Working-day radio controls have stable IDs; Angular's radio value accessor does not require the DOM value attribute to equal the model number.

## Browser suite status

The final default full suite passed on 2026-10-27, including existing calendar/request/avatar trusted keyboard checks, all twelve account/scope/organization-access cases, history/account resets, profile editing, organization edits/renames, privacy projections and mobile checks. The separate organization native-keyboard diagnostic below remains open. Earlier runs passed the existing twelve-person/account/scope/profile/calendar/history journeys, then stopped at test-harness selector mistakes in the new organization stage. Those mistakes were corrected; they did not establish a product failure.

## Open keyboard verification

The isolated MOCK_ORG_NATIVE_ONLY=1 diagnostic did not pass on this macOS host. It recorded no DOM key events, and later no pointer events either, despite a visible/focused document report. The result was the same with headless and temporary visible-window Chrome. Runtime selection and screenshot capture worked. The root cause of native input delivery is not established; do not describe organization native keyboard navigation as verified. The ordinary existing calendar/request/avatar trusted-key checks pass in the default suite. Organization-specific manual or alternate-host native keyboard review remains required.

The optional MOCK_ORG_FUNCTIONAL_ONLY=1 mode runs the organization functional stage independently. MOCK_HEADFUL=1 is a local visible-browser diagnostic; it is not enabled by CI or product code.

## Visual evidence

Reviewed fictional screenshots:

- [Organization desktop](organization-desktop.png)
- [Organization mobile](organization-mobile.png)
- [Team desktop](organization-team-desktop.png)
- [Team mobile](organization-team-mobile.png)

The record model supports zero departments/teams, direct members and teams with no department; those are covered by factory/component tests. Shipped browser screenshots retain the existing Northstar fixture. Generic groups, cross-company/standalone organizations, structure creation/deletion, invitations, real APIs and persistence remain out of scope. Future real tenant-isolation/API tests and independent privacy/security/release review are not satisfied by these public browser checks.
