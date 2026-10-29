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

Open **Settings** in the sidebar or **Profile settings** from the profile-initials dropdown (`/index.html?page=settings`). Names, gender, married, dependent children and sole care are editable; membership, sign-in email and account status are read-only. Save/cancel and validation use the profile API; edits survive browser reload/sign-out and reset on API restart. Only fictional accounts are seeded. Existing lead visibility remains separate from employee/admin system-role labels. Family edits refresh own fictional eligibility without changing allocations or assuming divorce. Admins edit membership configuration under People. Invitation delivery/acceptance remains open.

The separate display-preferences card saves the calendar workspace/planner layout and green/warm-brown color scheme in browser local storage, keyed by fictional company and account. Preferences do not use the profile API. The calendar workspace and green scheme are the defaults.

On older macOS hosts where embedded Sass cannot run, `NG_BUILD_SASS_EMBEDDED=0` selects Angular's JavaScript Sass compiler. [VAC-12](../docs/jira/VAC-12-profile-and-membership-settings.md) records verification and the remaining server/security gates.

## Organization administration

Company admins can open **Settings → Organization** or use `/index.html?page=organization`. Rename the organization, choose five/six working days, browse departments/teams and rename them. These pages and application services reject employees, non-admin leads, foreign companies and stale administrator forms. In the fictional calendar fixture, every demo account can now select organization-wide generic availability; this does not change admin authorization or implement production visibility rules.

Structure is optional: the read model supports empty departments/teams, organization members without teams and teams without a department. The shipped Northstar fixture is one department/team example, not a hierarchy requirement. Standalone/cross-company organizations and arbitrary groups remain deferred. Create/delete operations are API-only.

Changes survive reload/sign-out and reset on API restart. Renamed labels appear in the organization, calendar and membership views. Working days is company demo configuration; the reviewed leave catalogue/ledgers retain explicitly labelled five-day reference behavior. No six-day legal-policy calculator is implemented. `verify-organization.mjs` checks the component-test double, including flat/direct-team layouts and negative authorization contexts. [VAC-2](../docs/jira/VAC-2-organization-settings-mock.md) records scope and evidence.

Organization-only functional browser checks can run with `MOCK_ORG_FUNCTIONAL_ONLY=1 node verify.mjs`. `MOCK_ORG_NATIVE_ONLY=1` isolates trusted keyboard navigation, and `MOCK_HEADFUL=1` opens a visible temporary test window instead of headless Chrome. The isolated organization keyboard check remains unverified on the current macOS host: CDP produced no DOM key/pointer events in both modes despite the focused-document report. Do not treat that diagnostic as passed; see VAC-2 for evidence and the remaining manual/alternate-host review gate.

## API-backed profiles and organization settings · VAC-13

Sign-in, own profile, memberships, organization/workweek and department/team edits require the Functions API with development sign-in and fictional seed data enabled. Start it on port 7071 using the [API development instructions](../api/README.md#development); `npm start` proxies /api. Resource clients use `ApiClient`, while `WorkspaceApiService` manages UI state with server-issued bearer sessions, caches read projections for rendering, and awaits HTTP before reporting save success. No local write fallback. Edits survive page reload/sign-out and reset on API restart. Public leave catalogue/ledger examples still use explicit fictional fixtures. The local profile/organization write factories are retained only as reference/component-test doubles. See [API contract](../docs/contracts/api.md).

`verify.mjs` now proxies its /api requests to MOCK_API_URL (default http://127.0.0.1:7071) and requires a running enabled API. Its static server overrides config.json to use that proxy. Paired CI starts the actual Functions host and runs the built Angular acceptance journey.

## Unified navigation · VAC-20

The main sidebar contains Calendar, My Leave, People, admin-only Approval Requests/Leave balances, and one Settings entry. Settings has Organization, Team and Profile section navigation (`?page=settings&section=organization|team|profile`); the legacy `?page=organization` route resolves to the Organization section. Profile retains account membership and display preferences. My Leave contains own request history and links to the existing My balances view. People reuses the server directory for employees and membership editor for administrators.

The employee balance overview (`?page=admin-balances`) uses the existing administrator-only membership API, filters by team/name and sorts remaining totals, names or teams. Its adjustable high-balance threshold defaults to 75% of known allocation. Null server totals remain “To confirm”, while provisional custom allocations are shown separately. My Team uses the current actor's team directory from the organization summary, includes the actor and does not imply management rights. Sign-out lives in the profile dropdown; the redundant demo company marker is removed from the top bar.

Approval Requests is explicitly unavailable by product lead confirmation until a request/assignment backend exists. Public fictional pending entries are never presented as assigned work. No calendar redesign is included. `MOCK_NAVIGATION_ONLY=1 node verify.mjs` checks these flows against the running Functions API and built Angular artifact.
