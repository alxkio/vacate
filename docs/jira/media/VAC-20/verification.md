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
