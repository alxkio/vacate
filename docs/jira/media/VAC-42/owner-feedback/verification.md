# VAC-42 owner-feedback subtask — verification · 2026-11-12

Status: implementation complete, QA with native keyboard verification outstanding. This remains inside VAC-42; no separate issue/story was retained. Earlier release evidence describes the prior version only. These changes are uncommitted and undeployed; the original five staged VAC-42 release-evidence files/index entries were preserved.

## Prioritized findings and improvements

| Priority | Finding / basis | Improvement and evidence |
|---|---|---|
| High | Owner reported expired-session actions do not return to login. Source lacked centralized authenticated-401 handling and return destinations. | API 401 redirect preserves the current internal page, login resumes it; stale-account failures, unauthenticated login errors and 403 responses do not clear another session. Real server-revocation journeys passed for directory refresh and workspace Help. |
| High | Owner reported unclear request-date validation. | Field errors, red borders, associated messages, range constraints, duration validation, invalid-preview clearing, retry and Cancel. Invalid/reversed dates block submission; owner explicitly retained past dates with warnings. Browser and request tests passed. |
| Medium | Employee/admin directory presentation differed and grouping was hard to understand. | Shared company table with department/team names, relationship text and supplementary color; admin-only membership edit. Public directory projection extended; private/foreign membership data remains excluded. Browser/table/focus and API tests passed. |
| Medium | Settings order and boolean selects obscured configuration; structure creation was API-only. | Workspace/summary → organization switches → structure, with admin create dialogs using existing endpoints. API success refreshes counts; failed saves preserve drafts. Browser creation/retry/focus checks passed. |
| Medium | Owner reported display layout required signing out to apply. | Autosave and immediate event propagation, with URL state updated to preserve the selected layout. Browser switched planner/calendar and returned home without signing out. The prior symptom is owner evidence; no unsupported claim about its sole root cause. |
| Low | Fixed illustration/workspace reference date and inactive logo. | Current local week/month/date, current route fallbacks/Today, explicit dates retained, logo links to workspace. Browser and route tests passed. |

## Pages and journeys

Login, workspace/calendar shell, request dialog, People, membership editor, organization settings/create dialogs, department/team approval settings, Profile booleans and System display preferences.

| Persona / goal | Journey stages | Original friction | Result / remaining verification |
|---|---|---|---|
| Employee finding colleagues | Workspace → People → department/team relationship | Unclear grouping and different layouts by role | Same company table and text/color labels; employee has no edit controls; 1440/375/320 captures without page overflow. |
| Employee correcting leave | Workspace → Request → invalid range → correction → server preview | Field ownership of errors unclear | Red named field/message, stale preview removed, corrected past selection receives warning and a server preview. Existing save/idempotency tests passed; no browser leave save was needed for this refinement. |
| Admin maintaining structure | Settings → workspace/summary → organization configuration → add dialog → server result | Section order, boolean selects and missing create affordances | Sections reordered, native switches; create department/team, network failure/retry and focus return verified. |
| Admin changing layout | System → choose planner/calendar → workspace | Owner reported re-login required | Immediate layout and browser persistence after navigation verified. |
| Returning member | Current page → expired action → Login → current page | Lost authentication recovery/navigation context | Real bearer revocation, login and return to People passed; workspace Help expiry also returned through login. External return URLs rejected by tests. |

## Verification

- Frontend: **75 tests / 18 files passed**. Final focused session/request/directory repeat: **11 / 3 passed**; final People/workspace repeat after admin refresh: **13 / 2 passed**. Application and spec TypeScript no-emit checks passed.
- Production Angular build passed with the older-macOS worker flags. Final rendered build used the changes in this report.
- Backend: focused `ResourceEndpointTests`: **16 passed**, including sanitized directory fields/private exclusions and existing authorization/tenant/structure behavior.
- Real Functions-host HTTP suite passed: all 12 fictional sessions, bearer revocation, private projection, account/membership/organization/structure CRUD, lifecycle timestamps and deletion conflicts.
- Fixture, API-contract, organization and profile scripts passed. Their local-double results are separate from real HTTP evidence.
- Chrome **150.0.7871.125**, Node **v22.22.3**, macOS: functional owner-feedback journey passed, including red date fields, accepted past-date warnings, employee/admin tables, membership focus return, native-dialog creation/error recovery, creation focus return, immediate layout, logo and expired-session return. Desktop/mobile rendered review completed; People also checked at 320px. No JavaScript exceptions in the passing run.
- Impeccable targeted source detector returned `[]`; manual screenshot review corrected company-form spacing and mobile table instructions. Detector output is not rendered accessibility proof.
- OpenAPI YAML parsed with Ruby/Psych. `git diff --check` passed.

Native trusted keyboard input is **UNVERIFIED** in this run. Both headless and visible Chrome readiness probes delivered no pointer/keydown/keyup events despite a visible, focused document. See [diagnostics](native-input-failure.json). The passing functional run explicitly used `MOCK_FEEDBACK_SKIP_NATIVE=1` and printed this exclusion; synthetic clicks are not keyboard evidence. Native checkbox/switch semantics, labels, focus styles and inherited/null configuration were inspected in source. Manual Space/Tab/Escape verification remains QA work; no screen-reader or SQL-provider/deployed check is claimed.

Reproduce the functional browser check against a disposable seeded InMemory API (7073):

```sh
MOCK_FEEDBACK_ONLY=1 MOCK_FEEDBACK_SKIP_NATIVE=1 MOCK_API_URL=http://127.0.0.1:7073 MOCK_SCREENSHOT_DIR=/private/tmp/vacate-owner-feedback-final node frontend/verify.mjs
```

Remove `MOCK_FEEDBACK_SKIP_NATIVE` to require trusted keyboard verification. Use `MOCK_HEADFUL=1` for visible Chrome. API HTTP suite: `python3 scripts/verify-api.py --api-base-url http://127.0.0.1:7073/api`. Do not run these mutating synthetic acceptance scripts against customer data.

Backend/contracts changed only for sanitized directory structure. Creation, permission rules, leave calculations and lifecycle timestamp ownership reuse existing server behavior. No migration, infrastructure or deployment change. Availability/reference examples remain fictional; organization/member structure is read/saved through the API. The local API used InMemory persistence, so this is not SQL durability evidence. No open product question remains for these accepted refinements; unrelated earlier production identity/approval questions remain in VAC-42.

## Rendered evidence

- [Login/current date](feedback-login-desktop.png)
- [People desktop](feedback-people-1440.png), [People mobile](feedback-people-375.png)
- [Invalid range](feedback-request-invalid-mobile.png), [past-date warning](feedback-request-past-warning-mobile.png)
- [Company workspace and summary](feedback-settings-1440.png), [organization switches/structure](feedback-policy-switches-mobile.png)
- [Add team dialog](feedback-add-team-mobile.png)

## Files changed by this feedback

The staged deployment report/screenshot and prior release notes are separate preserved work. Paths below list feedback changes (including the VAC-42 issue/review updates), not that prior deployment evidence.

- `api/src/Vacate.Application/Common/Contracts.cs`
- `api/src/Vacate.Application/Common/RecordMapper.cs`
- `api/tests/Vacate.IntegrationTests/ResourceEndpointTests.cs`
- `docs/design/implemented-page-review.md`
- `docs/jira/media/VAC-42/owner-feedback/verification.md`
- `docs/contracts/api.md`
- `docs/contracts/openapi.yaml`
- `docs/jira/Product-Backlog.md`
- `docs/jira/VAC-42-implemented-page-design-review.md`
- `docs/product/product-charter.md`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/http/api-client.ts`
- `frontend/src/app/core/http/contracts.ts`
- `frontend/src/app/core/http/organization-api.service.ts`
- `frontend/src/app/core/http/session-navigation.spec.ts`
- `frontend/src/app/core/http/session-navigation.ts`
- `frontend/src/app/core/state/workspace-api.service.ts`
- `frontend/src/app/core/state/workspace-data.service.ts`
- `frontend/src/app/features/auth/login.html`
- `frontend/src/app/features/auth/login.ts`
- `frontend/src/app/features/calendar/calendar.html`
- `frontend/src/app/features/calendar/calendar.ts`
- `frontend/src/app/features/leave/request.html`
- `frontend/src/app/features/leave/request.spec.ts`
- `frontend/src/app/features/leave/request.ts`
- `frontend/src/app/features/organizations/organization-settings.html`
- `frontend/src/app/features/organizations/organization-settings.scss`
- `frontend/src/app/features/organizations/organization-settings.ts`
- `frontend/src/app/features/people/people.ts`
- `frontend/src/app/features/profile/profile-settings.html`
- `frontend/src/app/features/settings/scope-settings.ts`
- `frontend/src/app/features/workspace/workspace-dialog.ts`
- `frontend/src/app/features/workspace/workspace-route-state.ts`
- `frontend/src/app/features/workspace/workspace-view.ts`
- `frontend/src/app/features/workspace/workspace.html`
- `frontend/src/app/features/workspace/workspace.spec.ts`
- `frontend/src/app/features/workspace/workspace.ts`
- `frontend/src/styles.scss`
- `frontend/testing/feedback-acceptance.mjs`
- `frontend/testing/fixture-provider.ts`
- `frontend/verify.mjs`
- `scripts/verify-api.py`
