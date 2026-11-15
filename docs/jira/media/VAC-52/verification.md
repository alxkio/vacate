# VAC-52 local verification · 2026-11-15

Implementation is ready for review on `VAC-52-clean-angular-navigation`. The owner subsequently authorised a commit, branch push and PR; merge and deployment remain outside scope. Source: [issue](../../VAC-52-angular-clean-navigation.md), [route specification](../../../product/workspace-navigation.md), [routes](../../../../frontend/src/app/app.routes.ts).

## Verified results

- Angular unit suite: **21 files, 106 tests passed**, including safe return URLs, route compatibility/state, person privacy/record mismatch, stale-response rejection and actor-isolated navigation state.
- Both TypeScript projects passed: `tsc --project tsconfig.app.json --noEmit` and `tsc --project tsconfig.spec.json --noEmit` from frontend.
- Production Angular build passed. On this older Intel macOS host, commands used Node 22.22.3 and `NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0` before `ng test --watch=false` / `ng build --configuration production`.
- Existing fixture, eligibility contract, profile and organization verification scripts passed. Scoped formatting and whitespace checks passed.
- Paired browser checks used Chrome 150.0.7871.125, Node 22.22.3 and a disposable localhost Functions API with InMemory persistence, development authentication and fictional fixtures. No real employee data or SQL target was used.

Run from repository root with the built frontend and local API:

```sh
MOCK_CLEAN_ROUTES_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 MOCK_SCREENSHOT_DIR=/private/tmp/vacate-clean-routes node frontend/verify.mjs
MOCK_NAVIGATION_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 node frontend/verify.mjs
MOCK_SESSION_RECOVERY_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 node frontend/verify.mjs
```

All three passed. Clean-route acceptance exercises real sign-in returning to a GUID person URL, existing membership save with server re-read and restoration, malformed/foreign/mismatched record denial, legacy query conversion, person recorded leave, Calendar history, honest Help availability and 1440/375/320px overflow assertions. It creates a saved fictional request through preview/submission, checks other-person own-request denial, approves through the assigned GUID review route, and opens the owner's GUID request page. Created requests are deleted and captured sessions revoked in teardown.

The navigation regression pass covers settings access, own-team selection, People, personal leave, assigned approvals, employee denial and desktop/mobile layouts. Its history journey includes reload and Calendar return. Session recovery injects temporary current-user/summary failures only in the test proxy, retries without credentials, tests expiry during recovery, and confirms revocation of captured sessions.

Checks exposed and corrected own-team default selection and lost Calendar period after a full reload. People automatically adds the loaded balance year to its URL; acceptance permits this relevant state while explicitly rejecting Calendar-only date/view parameters.

## Rendered samples

- [Administrator person overview, 1440px](clean-routes-person-1440.png)
- [Membership editor, 375px](clean-routes-membership-375.png)
- [Help, 320px](clean-routes-help-320.png)

Person desktop and membership mobile screenshots were visually inspected; the focused membership editor scroll position is intentional. Screenshots and overflow assertions do not establish native keyboard or screen-reader acceptance.

## Boundaries and remaining gates

Backend/database source and API contracts are unaffected: this change reuses existing directory, personnel, membership, leave and assigned-approval endpoints. Local paired execution verifies those integrations and frontend denials; it does not replace the existing server authorization suite or actual-SQL tenant-isolation tests. No SQL-provider, hosted deep-link, custom-domain, cross-origin auth, complete default browser suite, new native keyboard or screen-reader run is claimed.

Administrator account identity remains read-only pending an approved field/permission contract. Feedback submission and Home remain deferred. Broader approval enablement visibility remains open; existing assigned work is preserved. Figma focused reorganisation and final visual/instance verification remain [VAC-51 Todo](../../VAC-51-focused-figma-follow-up.md). Existing Workspace composition remains; broader ADR-0005 service extraction is not claimed complete.

Automation durations are not aggregated. Assistant implementation/verification time is unmeasured; human actual Unknown.


## PR #10 history regression · 2026-11-15

The first CI run passed backend and frontend jobs but failed the paired browser job at `Back after logout: missing target maya-two` ([run](https://github.com/alxkio/vacate/actions/runs/43699231460)). Reproduced locally with `MOCK_HISTORY_ONLY=1`. Calendar canonicalisation removed the test-only history marker from the current URL; Chrome retained it in the entry's original `userTypedURL`. The harness now resolves the fresh history entry through either URL, preserving every identity/draft/scope assertion.

Once traversal reached the account-switch check, it exposed a real regression: the old account's team scope was restored from its canonical Calendar URL. Signed-in routing now stamps entries with an actor/company owner and redirects a foreign-owner restored entry to the current account's Calendar defaults. New unowned deep links and same-owner navigation retain valid state. This is client state isolation, not an authorization grant; server checks remain unchanged.

Follow-up validation: all **108 unit tests** passed, including two actor/company history cases and same-owner state preservation; both TypeScript projects and the production build passed. `MOCK_HISTORY_ONLY=1` passed actual browser logout/account-switch Back/Forward, Calendar → My Leave → Balances history, reload and Calendar-period restoration. No assertions were removed or weakened. Broader functional and fresh CI results are recorded separately when available. Native keyboard and actual SQL-provider limitations above remain applicable.


The broader functional journey then passed all twelve account/scope checks and account-switch history, but exposed lost expanded balance types after Calendar → My Leave. Clean routes recreate Workspace, so its old component-local balance presentation state was discarded. A leave-owned in-memory store now retains expanded types within one actor/company/session; a new login, account or company starts clean. The route regression test recreates Workspace and verifies retention; three additional cases verify company, actor and session isolation. All **112 tests in 22 files**, both TypeScript projects and the production build pass. Full functional browser revalidation passed (`MOCK_FUNCTIONAL_ONLY=1`, localhost:7073, Chrome 150/Node 22.22.3), covering all twelve accounts, balance retention, leave save, profile/organization settings, upcoming leave, session recovery, page focus and clean GUID routes; native keyboard checks were explicitly excluded. Fresh hosted CI remains pending; the new store holds only presentation flags/type IDs and does not change API contracts or balance calculations.
