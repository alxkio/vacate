# Vacate frontend

Angular 22 app (standalone components, signals, lazy feature routes), generated with Angular CLI 22.2.3. Pin the Angular and Node versions together before production use.

The login, workspace, calendar, leave previews, profile and organization pages live in `src/app/features/`. Components use `WorkspaceDataService` and `WorkspaceApiService` for read state, backed by separate user, membership, organization and session clients in `core/http`. Existing fictional leave fixtures/catalogue calculations live in `core/reference-data`; write doubles live under `testing`.

```text
src/app/
  core/http/             transport contracts and resource API clients
  core/models/           UI read models
  core/state/            session/workspace state
  core/reference-data/   fictional leave catalogue and calendar reference data
  features/auth/         sign-in
  features/profile/      own profile and membership
  features/organizations/ admin organization, structure and membership editing
  features/workspace/    navigation and shared workspace
  features/calendar/     calendar presentation
  features/leave/        request and balance previews
testing/                 component fixtures and write doubles
```

State stays in local signals and services; add NgRx only for a demonstrated need ([TechChoices](../TechChoices.md)). Public inspection facades support fictional acceptance checks and grant no authorization. API targets and references use GUIDs, including organization, roles, teams and manager; numeric IDs remain storage identities.

## Commands

- `npm start`: dev server at http://localhost:4200; `/api` is proxied to the API through `proxy.conf.json`.
- `npm run build`: production build into `dist/`.
- `npm test`: unit tests with [Vitest](https://vitest.dev/).

## Cloud configuration

Startup fetches `/config.json` with caching disabled before Angular bootstraps. Local configuration uses `apiBaseUrl: "/api"`; deployment writes the provisioned Function App's HTTPS origin plus `/api`, and the Git commit revision. This file is public and must contain no secrets. `ApiClient` uses that configured base URL. Invalid or missing settings stop startup with a reload message.

`public/staticwebapp.config.json` supplies SPA deep-link fallback and prevents caching runtime settings. Azure hosts the Angular output separately from the API; Functions CORS is configured by Bicep for the frontend origin. Cloud URLs are not committed into Angular source or inferred from `VITE_*` environment variables.

[Deployment instructions](../infra/README.md) cover the build artifacts and initial cloud release.

## Acceptance

From this directory, after `npm ci`:

```sh
node node_modules/typescript/bin/tsc --project tsconfig.app.json
node node_modules/typescript/bin/tsc --project tsconfig.spec.json
node verify-fixtures.mjs
node verify-eligibility-contract.mjs
node verify-profiles.mjs
node verify-organization.mjs
npm run build -- --configuration production
python3 ../scripts/prepare-frontend.py --frontend-output dist/vacate-web/browser --revision local
node verify.mjs
```

App and test TypeScript projects emit into separate ignored `out-tsc` directories with explicit source roots; they never emit beside the authored JavaScript reference files.

Browser acceptance uses local Chrome and serves the built Angular artifact with SPA fallback. Set `CHROME_BIN` on another host, `MOCK_DIST` for another build output, `MOCK_URL` for a matching hosted revision and `MOCK_SCREENSHOT_DIR` for screenshots. CI runs production build, unit tests, fixtures/schema and complete browser acceptance before uploading `angular-production` from `frontend/dist/vacate-web/browser`.

Azure publishes the Angular index directly; `prepare-frontend.py` only validates it and writes revision metadata. Legacy `/login.html`, `/index.html` and `?page=balances` routes remain supported. `/app.html` is a hosting alias to the same Angular index, not a separate application. Existing generated files/caches from the prior frontend folder were preserved outside the working tree before relocation; generated output is ignored.

## Future tests

See the [root README](../README.md#tests-todo).

[Azure dev release evidence](../docs/release-2026-10-25-vac-10-angular.md) records deployed application revision `7f7bfff`, production CI and complete live acceptance.

## Profile and membership settings

Open **Settings** in the sidebar or **Settings** from the profile-initials dropdown (`/index.html?page=settings`). Names, gender, married, dependent children and sole care are editable; membership, sign-in email and account status are read-only. Save/cancel and validation use the profile API; edits survive browser reload/sign-out and reset on API restart. Only fictional accounts are seeded. Existing lead visibility remains separate from employee/admin system-role labels. Family edits refresh own fictional eligibility without changing allocations or assuming divorce. Admins edit membership configuration under People. Invitation delivery/acceptance remains open.

The separate display-preferences card saves the calendar workspace/planner layout and green/warm-brown color scheme in browser local storage, keyed by fictional company and account. Preferences do not use the profile API. The calendar workspace and green scheme are the defaults.

On older macOS hosts where embedded Sass cannot run, `NG_BUILD_SASS_EMBEDDED=0` selects Angular's JavaScript Sass compiler. [VAC-12](../docs/jira/VAC-12-profile-and-membership-settings.md) records verification and the remaining server/security gates.

## Organization administration

Company admins can open **Settings → Organization** or use `/index.html?page=organization`. Rename the organization, choose five/six working days, browse departments/teams and rename them. These pages and application services reject employees, non-admin leads, foreign companies and stale administrator forms. In the fictional calendar fixture, every demo account can now select organization-wide generic availability; this does not change admin authorization or implement production visibility rules.

Structure is optional: the read model supports empty departments/teams, organization members without teams and teams without a department. The shipped Northstar fixture is one department/team example, not a hierarchy requirement. Standalone/cross-company organizations and arbitrary groups remain deferred. Administrators can add departments and teams through native dialogs. Delete operations remain API-only.

Changes survive reload/sign-out and reset on API restart. Renamed labels appear in the organization, calendar and membership views. Working days is company demo configuration; the reviewed leave catalogue/ledgers retain explicitly labelled five-day reference behavior. No six-day legal-policy calculator is implemented. `verify-organization.mjs` checks the component-test double, including flat/direct-team layouts and negative authorization contexts. [VAC-2](../docs/jira/VAC-2-organization-settings-mock.md) records scope and evidence.

Organization-only functional browser checks can run with `MOCK_ORG_FUNCTIONAL_ONLY=1 node verify.mjs`. `MOCK_ORG_NATIVE_ONLY=1` isolates trusted keyboard navigation, and `MOCK_HEADFUL=1` opens a visible temporary test window instead of headless Chrome. Earlier organization keyboard verification on macOS could not deliver native key/pointer events despite the focused-document report; VAC-2 retains that historical evidence. The current renderer-focus and trusted-event checks are documented in [VAC-15](../docs/jira/media/VAC-15/verification-2026-10-30.md).

## API-backed profiles and organization settings · VAC-13

Sign-in, own profile, memberships, organization/workweek and department/team edits require the Functions API with development sign-in and fictional seed data enabled. Start it on port 7071 using the [API development instructions](../api/README.md#development); `npm start` proxies /api. Resource clients use `ApiClient`, while `WorkspaceApiService` manages UI state with server-issued bearer sessions, caches read projections for rendering, and awaits HTTP before reporting save success. No local write fallback. Resource edits survive page reload/sign-out. InMemory mode resets them on API restart; the development SQL mode preserves resources across restarts, while development sessions remain process-local. Public leave catalogue/ledger examples still use explicit fictional fixtures. The local profile/organization write factories are retained only as reference/component-test doubles. See [API contract](../docs/contracts/api.md).

`verify.mjs` now proxies its /api requests to MOCK_API_URL (default http://127.0.0.1:7071) and requires a running enabled API. Its static server overrides config.json to use that proxy. Paired CI starts the actual Functions host and runs the built Angular acceptance journey.

## Unified navigation · VAC-20

The main sidebar contains Calendar, My Leave, People, admin-only Approval Requests/Leave balances, and one Settings entry. Employees have Profile and System. Organization-permitted team leads additionally have their Team section; department leads have their Department and child Team sections. Owners/HR and existing company administrators have all sections (`?page=settings&section=organization|department|team|profile|system`). Profile retains self-profile editing and read-only membership; System reuses per-account display preferences. Restricted direct, query and legacy organization links redirect non-admins to Profile. Route guards, section selection and rendering share the same role rules. My Leave shows recurring fixed-type balances used in the reference year, pending approval and own requests ordered by date descending. Event-based types remain in history. It also links to the existing My balances view. People reuses the server directory for employees and membership editor for administrators.

The employee balance overview (`?page=admin-balances`) uses the existing administrator-only membership API, filters by team/name and sorts remaining totals, names or teams. Its adjustable high-balance threshold defaults to 75% of known allocation. Null server totals remain “To confirm”, while provisional custom allocations are shown separately. My Team uses the current actor's team directory from the organization summary, includes the actor and does not imply management rights; its authorized calendar visibility is separate from delegated Team Settings. Per product lead correction on 2026-10-30, the top bar retains the organization name and omits the visible user name. Account identity and sign-out live in the avatar dropdown.

Approval Requests lists actual saved pending requests assigned to the signed-in company administrator. Assignment configuration uses team, department, then organization inheritance; administrators can approve or decline through the server-authorized decision endpoint. Public fictional pending entries are never presented as assigned work. No calendar redesign is included. `MOCK_NAVIGATION_ONLY=1 node verify.mjs` checks these flows against the running Functions API and built Angular artifact.

### History regression checks

`MOCK_HISTORY_ONLY=1 node verify.mjs` runs account-switch history guards and the Calendar → My Leave → Balances Back/Forward/reload journey with a populated browser history. The same page-history check runs in the complete suite and `MOCK_NAVIGATION_ONLY=1`. Synthetic UI clicks set the CDP user-gesture flag; history restoration waits for the expected page, scope, date, view and rendered period. `MOCK_FUNCTIONAL_ONLY=1` runs the complete functional journey without native-keyboard checks for local hosts with unreliable input delivery. CI runs the default complete suite, including native keyboard checks.

### Four advertised test personas · 2026-10-30

The sign-in chooser and credential hints now show Maya (Employee), Leah (Team lead), Ella (Department lead), and Nora (Organization admin), each using the existing firstname/firstname credential. The two lead labels identify review scenarios with the same existing access. This only curates the chooser: all twelve fictional people, leave data, memberships, development credentials/aliases and automated tests remain intact. Separate lead permissions are deferred by explicit product lead instruction. API behavior and contracts are unchanged.

### Native input readiness · VAC-15

The harness brings Chrome forward, waits for rendered layout and checks that inert heading text is the actual pointer hit target. A trusted pointer interaction and a trusted Shift press/release prove both input paths are ready before the intended button receives Enter once. Only these harmless preparation probes repeat, within five seconds; application actions are never retried or replaced with scripted clicks. Focus emulation is not used. Chrome accepts input before the first frame commit, and background renderer/window/timer throttling is disabled in every mode. Document-level evidence must still observe both trusted Enter and a trusted keyboard click on the intended control.

The native journey includes deterministic browser regressions for three dropped preparation attempts, no input, untrusted DOM events, pointer-only/keyboard-only delivery and an obstructing overlay. Missing or partial input must fail with diagnostics; overlays must receive no input. `MOCK_NATIVE_ONLY=1` isolates the journey; default CI/deployment checks retain it alongside the complete browser suite. `MOCK_CPU_THROTTLE=4` slows the renderer fourfold for local stress verification. Every run logs the Chrome version. See the [verification record](../docs/jira/media/VAC-15/verification-2026-10-30.md).

Chrome runs with `--enable-automation` to suppress browser-owned prompts such as password-save UI after fictional sign-in. On readiness failure the harness retains its strict failure and writes `native-input-failure.json`, a screenshot and a bounded Chrome stderr tail under `MOCK_SCREENSHOT_DIR`, including Chrome/Node versions, platform, elapsed time, target/window information and event-delivery diagnostics. CI uploads these files on failure. The deterministic no-input regression checks evidence capture and removes its intentional-failure artifacts after passing. The recurring hosted failure and the limits of the launcher hardening are tracked in [the November 2 evidence](../docs/jira/media/VAC-15/verification-2026-11-02.md).

The paired CI job runs the complete suite with `MOCK_HEADFUL=1` under `xvfb-run`, using a 1600×1250 virtual display. This retains native and functional checks; no input assertion is skipped. This environment change follows the [November 13 input-delivery investigation](../docs/jira/media/VAC-42/native-input-2026-11-13.md). Local default mode remains headless; a macOS headed pass does not prove Linux runner delivery.

Chrome startup has a separate 20-second deadline. The harness discovers its debugging endpoint from either the complete stderr announcement or the fresh profile's `DevToolsActivePort` file; it does not require a particular stderr message to appear. Missing executables, early exits and startup timeouts fail with Chrome's stderr tail and write `chrome-startup.json` plus `chrome-stderr.log` under `MOCK_SCREENSHOT_DIR`. CI prints Chrome/Node/npm versions and uploads these files alongside native-input failure evidence. Download them when `Chrome debugging endpoint unavailable` occurs before the browser suite connects; native screenshots cannot exist at that stage. Endpoint discovery does not extend the deadline or skip any browser assertions. Run `node --test testing/verify-chrome-startup.mjs` for the isolated launcher regression cases. [Chrome's protocol documentation](https://chromedevtools.github.io/devtools-protocol/) documents both endpoint publication methods (checked 2026-11-06).

### Delegated settings and approval-aware balances

The API summary supplies scoped settings access; route navigation refreshes it before rendering. Leads can change only vacation approval in authorized teams/departments. Organization settings control the approval default and delegation switches. The first explicit rule wins: team, department, organization. Pending annual leave remains visible and is not deducted while approval is required. The fictional organization enables both lead delegation switches; all twelve accounts and calendar permissions remain intact.

Organization carryover controls save configuration only. Enabled with zero years means unlimited years; disabled is separate. No carryover transfer, expiry or recalculation is implemented. `MOCK_FEEDBACK_ONLY=1 node verify.mjs` exercises these settings, owner/HR/lead/employee access, live revocation, API denials and My Leave against the running API; it is also part of the complete default suite.

For hosted acceptance, set MOCK_URL to the existing website URL. The suite reads that site's public config.json for its direct API destination, including fixture cleanup and denial checks. `MOCK_SUITE_TIMEOUT_MS=900000` gives the complete suite a bounded fifteen-minute cloud deadline (default remains five minutes); native input and functional assertions are unchanged. No browser write bypass or alternate API is introduced.

## Administrator company calendar and personnel · VAC-43

Organization Settings keeps company essentials and policy before assigned approvers, company calendars, and departments/teams. Assigned approvers are company administrators; changing an assignment reroutes pending requests while decided history is preserved. A company administrator may decide their own request when assigned.

Company calendar separates recurring whole-company holidays from dated closures. Fixed month/day holidays recur annually; 29 February applies only in leap years. A closure requires a server preview before publication and automatically records leave for eligible employees. Its switch controls annual-balance deduction. Insufficient or unresolved annual balances are skipped and reported by the server; the saved employee report remains available. No-impact closure records are labelled separately from annual leave and fictional reference data.

People retains the shared sanitized directory and administrator membership editing. Administrators can switch to Personnel leave overview for actual saved records, entitlement-year annual totals and per-date request statuses. Unknown allocation remains “To confirm”; opening totals are not invented as dated events. Feature-owned administration components and their API client live under `src/app/features/administration/`; authoritative rules, permissions and accounting remain in the API.

### Future saved leave and teardown

`MOCK_UPCOMING_ONLY=1 MOCK_API_URL=http://127.0.0.1:7071 node verify.mjs` selects an available future working day using API preview, submits actual leave through the form, reloads and checks upcoming/calendar/details at desktop/mobile sizes, then checks account isolation. This replaces the fixed-October upcoming expectation and also runs in the complete browser suite. Use a disposable local seeded API with a finite annual allowance for the selected year.

A `finally` block uses the real administrator-only `DELETE /organizations/{companyId}/leave/requests/{requestId}` endpoint to remove new personal test requests. It compares complete request/calendar snapshots and used/pending/available totals against their pre-test values, preserves pre-existing records, and revokes/verifies test sessions. Cleanup attempts continue after an individual delete failure; any cleanup failure fails the test. Node-side HTTP cleanup works even when browser assertions/navigation fail. `MOCK_UPCOMING_TEARDOWN_ONLY=1` deliberately fails after save and passes only if that exact failure survives successful cleanup; cleanup errors cannot masquerade as the expected failure. This adds no reset endpoint or fictional write fallback.
