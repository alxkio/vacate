# VAC-20 verification · 2026-10-29

Source revision: current working tree, uncommitted; no deployment or release approval.

## Implementation

- Workspace navigation and routes now expose Calendar, My Leave, People, admin Approval Requests/Leave balances and a single Settings entry. Legacy organization query links resolve inside Settings.
- Settings reuses ProfileSettings/OrganizationSettings and adds section navigation plus the current user's team roster. The organization summary supplies an actor-inclusive team directory using the existing safe field allowlist.
- People reuses the membership editor for admins and the existing server directory for employees. My Leave owns personal history and links to existing personal balances.
- Admin balances reuse company-scoped membership data, show unresolved values honestly, support team/name/email filtering and sorting, and highlight known remaining percentages at an adjustable 75% default threshold. No policy calculations or fixture substitutions.
- Approval Requests remains explicitly unavailable, as confirmed by the product lead in this session. No approver assignments, self-approval rules or budget functionality were added.
- No calendar display/granularity changes, new records, migrations, lifecycle transitions or dependencies.

## Affected sources

- [Routes](../../../../frontend/src/app/app.routes.ts), [workspace](../../../../frontend/src/app/features/workspace/workspace.ts) and its [template](../../../../frontend/src/app/features/workspace/workspace.html).
- [Unified settings](../../../../frontend/src/app/features/settings/settings.ts), [People](../../../../frontend/src/app/features/people/people.ts), [balance overview](../../../../frontend/src/app/features/leave/admin-balances.ts), reused [organization editor](../../../../frontend/src/app/features/organizations/organization-settings.ts) and template, and shared stylesheet.
- [Workspace state](../../../../frontend/src/app/core/state/workspace-data.service.ts), [API state](../../../../frontend/src/app/core/state/workspace-api.service.ts), HTTP contracts/user client and UI models.
- [Organization service](../../../../api/src/Vacate.Application/Organizations/OrganizationService.cs), [API read contracts](../../../../api/src/Vacate.Application/Common/Contracts.cs), paired resource tests, frontend component/state tests and browser acceptance script.
- [Product charter](../../../product/product-charter.md), [API contract](../../../contracts/api.md), OpenAPI, frontend README, [issue](../../VAC-20-unified-settings-and-navigation.md) and [backlog](../../Product-Backlog.md).

## Automated evidence

- Angular unit/component tests: **36 passed in 10 files**. Covers one Settings entry, legacy organization routing/denial, explicit unavailable approvals, My Leave route, balance sorting/filtering/highlighting/unknown values, direct employee/lead denial, foreign rows, live team reassignment/filter/availability consistency and existing settings/resource regressions.
- .NET tests: **15 integration + 7 domain/unit passed**. New paired summary scenario checks actor inclusion, current-team reassignment, unassigned teams, safe field allowlist, unauthenticated/foreign-company denial and employee/non-admin lead denial of membership balance reads. Existing tests cover mutation validation, timestamps, tenant isolation and lifecycle transitions.
- Production Angular build: **passed**. Existing unchanged organization stylesheet warning: 4.44 kB versus 4 kB warning budget (438 bytes over); below the error budget. No dependency changes.
- Reference fixtures, eligibility schema, profile schema/privacy and organization fixtures verification: **all passed**.
- `MOCK_NAVIGATION_ONLY=1 ... node verify.mjs`: **passed** against built production Angular and actual Functions API with fictional seeds. Checks Settings sections, own team with actor, People editor/directory, personal leave/balances, admin search, employee denials, unavailable approvals, clean top bar, menu sign-out and 375px/1600px layouts without document overflow.
- `MOCK_ORG_FUNCTIONAL_ONLY=1 ... node verify.mjs`: **passed** for existing organization editing, workweek, rename, privacy, mobile, foreign IDs, membership HTTP saves and reload persistence after moving employee management to People.
- C# whitespace formatting, changed frontend formatting, `git diff --check`, JavaScript syntax and issue dependency/link audit: **passed**.

Commands used the repository's Node 22.22.3 and `NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0` for this older macOS host. Browser verification used already-installed Functions Core Tools 4.16.0 on port 7072; the system's obsolete 4.0.4483 discovered no Functions and was not used as acceptance evidence. Build/test tools needed local socket permission outside the sandbox.

## Review limits

No independent security/release sign-off, full calendar/native-keyboard regression run or production validation is claimed. This issue remains **QA** for product/reviewer acceptance. Request/assignment workflow and trusted policy-derived balance totals remain outside the authorized change.

## Screenshots

- [Settings desktop](unified-settings-desktop.png)
- [Settings mobile](unified-settings-mobile.png)
- [Admin balances desktop](admin-balances-desktop.png)
- [Admin balances mobile](admin-balances-mobile.png)

## CI history correction · 2026-10-30

The product lead reported failures in [CI run 40960541385](https://github.com/alxkio/vacate/actions/runs/40960541385) and the subsequent manually requested [deployment workflow 40960803040](https://github.com/alxkio/vacate/actions/runs/40960803040), both at commit 54beec9. Failures were a default October period instead of the requested November week, or reading `.hidden` before the restored calendar element existed. The npm installation/audit warnings were not the failing assertion.

The isolated page journey and the account-switch journey passed, but the complete synthetic run reproduced a missing November calendar entry in Chrome's long session history; the second Back reached an older October entry. Marking synthetic UI clicks with CDP's `userGesture` flag resolved that behavior in the complete functional run. The browser check also now waits for the expected page, scope, date, view and rendered period after each traversal and refresh, with null-safe DOM access and history diagnostics on failure. Assertions retain the exact November week; no history clearing, catch-and-ignore, arbitrary sleep, policy change or application navigation change was introduced.

Coverage now includes the shared history journey in the complete and navigation-only suites, a dedicated history-only mode with populated history and account switching, and two Angular router scenarios for valid and foreign-team groups. **38 Angular tests passed.** The complete functional browser suite passed against the actual Functions API, including all twelve personas, account history, the corrected period round trip, display preferences, profiles, organization/membership HTTP saves and mobile views. The local native-keyboard run intermittently failed input delivery before reaching this scenario; the optional functional-only mode excludes those checks locally while default CI retains them. Hosted CI verification follows the correction push.

Only test harness, test coverage and documentation changed. API contracts, authorization, tenant filtering, lifecycle timestamps and application behavior are unaffected. Existing application build/backend evidence above remains applicable; no production build inputs changed in this correction.

## Four advertised login options · 2026-10-30

The product lead explicitly requested retaining all test data and existing permissions while limiting only login options. The chooser and public credential hints now advertise Employee/Maya, Team lead/Leah, Department lead/Ella, and Organization admin/Nora. Both lead accounts retain their existing identical access; no new role, scope, API contract, credentials, record or lifecycle transition is introduced. All twelve fictional colleagues and development logins remain intact for the existing test matrix.

Changed implementation sources: [login component](../../../../frontend/src/app/features/auth/login.ts), [template](../../../../frontend/src/app/features/auth/login.html), [component tests](../../../../frontend/src/app/features/auth/login.spec.ts), and the existing [browser acceptance script](../../../../frontend/verify.mjs). The script checks exactly four advertised options, each autofill pair and the retained twelve-person roster before its existing sign-in and navigation checks. Product/API documentation records this as frontend presentation only.

Validation: **43 frontend tests passed**, including all four chooser scenarios, unchanged lead capabilities, foreign-company rejection and unchanged fixture records. Production build passed with the existing organization stylesheet warning. The existing real-HTTP suite passed for **all twelve accounts**, session revocation, sanitized projections, CRUD, lifecycle timestamps and deletion conflicts. The real API/browser navigation suite passed with the four chooser/autofill checks, all twelve fixture people, unchanged employee/admin denials, My Team, settings, People and personal balances, Back/Forward period retention, and desktop/mobile layouts.

The earlier history correction at 4d06d57 also passed all three jobs of [CI run 41019707464](https://github.com/alxkio/vacate/actions/runs/41019707464), including the complete default API/browser suite with native keyboard checks.

## Header identity and employee Settings correction · 2026-10-30

Source: product lead feedback in this session. The top bar was intended to remove the visible user name and retain the organization name. Employees such as Maya must have only Profile and System (display preferences) within Settings, with neither Organization/Team menu entries nor accessible settings pages. The earlier company-name removal and employee Team Settings view are superseded by this explicit clarification.

Implementation:

- The [workspace header](../../../../frontend/src/app/features/workspace/workspace.html) restores the organization name, removes the visible user-name span and keeps account identity/sign-out in the avatar dropdown.
- [Shared section rules](../../../../frontend/src/app/features/settings/settings-navigation.ts) expose Profile/System to employees and existing non-admin leads, and Organization/Team additionally to company admins. [Route guards](../../../../frontend/src/app/app.routes.ts) redirect restricted query, direct-route and legacy links to Profile and run again on query changes. Workspace section selection and [unified rendering](../../../../frontend/src/app/features/settings/settings.ts) use the same rules, so bypassing menu visibility cannot mount Organization/Team Settings for an employee.
- [Profile settings](../../../../frontend/src/app/features/profile/profile-settings.ts) reuses its existing editor, preference form, persistence and styling in separate Profile and System views. Profile keeps self-profile editing/read-only membership; System has only browser/account-scoped display preferences. No copied editor, new dependency or backend endpoint.
- [Browser acceptance](../../../../frontend/verify.mjs) now checks the header, role-specific sections across all twelve accounts, restricted Team links, employee legacy routes, and separate System preferences/mobile layout. Identity/history assertions use the avatar's accessible account label instead of requiring the removed visible name.

Local verification:

- **50 frontend tests passed**. Production-route tests exercise Maya, Leah and Ella against restricted query, direct-route and legacy URLs; every redirect renders Profile without administration/team components. Direct component-input bypass attempts also fail to mount restricted content. Admin Organization access remains available and foreign-company Organization/Team settings disclose no structure. System preference saves retain stale-account protection and Profile/System forms are separated.
- **22 Release backend tests passed** (15 integration, 7 domain/unit), retaining authorization and tenant-isolation regression coverage. Server APIs and resource calls are unchanged: employee own-organization summaries and safe team directory remain needed for existing authorized calendars, while administration endpoints keep their server checks. No lifecycle timestamps or records change.
- Production frontend build passed. Existing organization stylesheet budget warning remains: 4.44 kB against 4 kB (438-byte excess).
- Both TypeScript project checks and existing fixture, eligibility-schema, identity/API-contract, profile and organization scripts passed. Changed TypeScript/templates/test code formatted; browser-script syntax and whitespace checks passed.
- **Local real-HTTP/browser verification was not run for this correction.** The tool request to start Functions was declined; neither test port 7071 nor 7072 had a listener. Earlier browser/API passes above belong to previous changes and are not evidence for this correction. Hosted execution is pending at the time of this local record; no screenshot or Azure release is claimed.

Product sources updated together: [product charter](../../../product/product-charter.md), [API contract](../../../contracts/api.md), [frontend README](../../../../frontend/README.md), and [VAC-20](../../VAC-20-unified-settings-and-navigation.md). No lead administration permissions, calendar redesign, new fixtures, new API behavior or future backlog was introduced.

## Completed settings and My Leave feedback · 2026-10-30

The product lead confirmed feedback complete and selected **team → department → organization** approval precedence before testing resumed. This supersedes the earlier blanket admin-only Team Settings rule and the temporary test hold. The local Functions API was subsequently authorized and started with fictional seeds on port 7072.

Changed implementation sources:

- Domain/application/HTTP: organization vacation configuration, nullable scope overrides, explicit server-owned membership settings roles, filtered access summary and scoped read/write checks. Existing resource endpoints, tenant boundaries, UTC timestamps and thin HTTP binding are reused. Role assignment is not accepted by public membership PATCH.
- Frontend: shared Settings sections/route guards, reused Profile/System forms, scoped Team/Department approval editor, Organization policy controls, restored organization header, avatar menu label Settings, My Leave used-type balances/pending/history and balance-bar rendering.
- Contracts and sources: [API contract](../../../contracts/api.md), OpenAPI, [product charter](../../../product/product-charter.md), [frontend README](../../../../frontend/README.md), VAC-20 and backlog updated together. No dependencies or calendar functionality added.

Verification of this feedback:

- **56 frontend unit/component tests passed**, covering production routes, defensive rendering, four management/employee settings scopes, stale-account preferences, used recurring types, event exclusions, current reference year and descending personal requests.
- Release API build and production Angular build passed. Existing organization stylesheet warning remains 438 bytes over its warning budget; no build error.
- Both TypeScript project checks and fixture, eligibility schema, identity/API schema, profile and organization verification scripts passed.
- Real HTTP verification passed for all twelve sessions, bearer revocation, private projections, account/membership/organization/structure CRUD, timestamps and deletion conflicts. All twelve real HTTP account/membership responses also satisfy the shared JSON Schema.
- Focused feedback browser acceptance passed: Maya's annual remaining 17/pending 3 with approval on; org delegation revocation removes Leah's Team page; HR can restore it; leads can save only permitted node overrides; organization approval off yields remaining 14; carryover 2 and unlimited 0 save without changing reference ledgers. Settings are restored in cleanup.

Browser regression investigation retained strict native input checks. Early full runs exposed stale assertions selecting only My Leave's first card and using the old pending-deducted annual total; both now assert the requested layout/balance semantics. Sign-out now waits for Calendar navigation and closes its request dialog before opening the avatar menu. Synthetic click helpers await target rendering, including the System section after the Settings permission refresh. Two subsequent local Chrome 150 attempts rejected all trusted input during readiness (focused/visible document, no pointer/key events), before application actions. That failure is recorded rather than treated as a pass; default CI continues to require the native suite.

**28 Release backend tests passed** (18 integration and 10 domain cases), including scoped role access, actual foreign-organization nodes, attempted public settings-role writes, immediate delegation revocation, inheritance, carryover validation and owner/HR demotion. Final full-browser outcomes are recorded below after execution. Independent product/security/release review and Azure deployment remain pending. Approval Requests is still explicitly unavailable; no leave transaction/assignment/decision workflow is claimed. Carryover remains configuration only.

Final complete default browser run: **passed** on local Chrome 150 against the built production frontend and actual Functions API. This run included the strict native readiness/trusted keyboard journeys, all twelve accounts, roster/privacy/eligibility regressions, logout/account-switch and calendar-period Back/Forward/refresh, balances and request previews, Profile/System desktop/mobile persistence, organization/membership HTTP editing and every new feedback scenario. No native checks were skipped in this passing run. Earlier local readiness failures remain documented above. The final focused navigation run also **passed**, verifying the generalized wait-for-render click helper and admin balances/settings mobile access.
