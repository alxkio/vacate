# Lean page feedback · 2026-11-15–16

Related work: [VAC-42 feedback](../../VAC-42-implemented-page-design-review.md#owner-feedback-subtask--lean-page-refinement--2026-11-15), [VAC-52](../../VAC-52-angular-clean-navigation.md), [full parameter inventory](route-parameter-audit.md). This supplements earlier committed PR evidence; it does not inherit that revision's CI result for these new edits.

## Changes and review

| Perspective | Outcome and boundary |
|---|---|
| Product | Preserve existing saved-history, cancellation, expiry, disabled-approval and GUID person journeys. Refine their existing UI instead of adding duplicate screens or repeating database imports. Calendar remains landing; same-origin login stays current. |
| Design | Mobile Month has seven weekday columns in both layouts. Day buttons expose date/count and open existing details; week/day retain agenda layouts. Remove duplicated headings, context/legend/promotional panels and scroll instructions. Keep compact expandable balances, People search/You, and named hierarchy filters. Request type information is disclosed on demand; actionable warning/error feedback remains visible. Mobile request actions stack with 12px gaps. |
| Architecture | Query cleanup belongs to navigation. Date lives in actor/company-owned history plus tab storage, retaining legacy links, reload and Back/Forward. API public GUIDs and the personnel report year remain necessary. No API, domain, SQL or permission-contract changes. |
| Settings | Profile opens first. Admin navigation: Profile, Organization, Departments, Teams, System. Delegated users see permitted sections in the same relative order. Existing paths and API-owned visibility remain stable. |
| Code review | Preserve `RedirectCommand` state during canonicalization; avoid dropping legacy dates. Request `canSubmit` remains server-owned even when routine messages are hidden. A foreign-company URL remains explicit for denial. Unit/browser assertions were updated for the accepted settings order. These are assistant reviews using role guidance, not independent sign-off. |

## Acceptance evidence

- Clean-route paired Chrome checks passed: GUID login return, membership save and mismatch/foreign denials, hierarchy filtering, route cleanup, Calendar history and responsive layouts.
- New browser assertions passed for admin settings order/default Profile, info disclosure, mobile action gap, 320/375px Month grid, planner Month and no page overflow. These use functional DOM interactions; trusted keyboard coverage is reported separately below.
- Request component scenarios cover initially hidden explanations/exclusions, disclosure toggle, selected exclusions, warning/error roles, suppressed holiday fallback, top configuration errors and server-denied submission. Existing stale-response, actor-switch, retry, duration and save scenarios remain.
- Angular: **123 tests / 23 files passed**. Both TypeScript projects and the final production build passed. Existing fixture, eligibility-schema, profile and organization scripts passed; scoped Prettier and whitespace checks passed.
- Focused real-HTTP request journey passed: inclusive dates/Sunday exclusions, duration, unavailable hours, negative/unknown balances, zero working days, saved calendar/history and fully covered acknowledgement. Browser assertions now locate blocking errors in the top alert toast.
- Trusted keyboard checks passed for type-info open/close, shortlist/pinned draft preservation, modal Escape/focus return and account menu.
- Focused leave/People browser checks passed on a separate disposable 7073 host: unified all-years filters, collapsed/expanded balance state, selective and Calendar cancellation, balance restoration, search/You/scopes and unified admin history at desktop/375/320px.
- Focused page-focus checks passed after replacing removed `#people-heading` references with the remaining main title and labelled directory section. Landmark focus, visible control focus, reload, palette persistence and session revocation remain asserted.
- **Final complete browser suite passed**, including trusted input, all twelve accounts, privacy/denials, logout/history, request saves, profile/organization persistence, delegated settings, future-request lifecycle, recovery, page focus and clean-route/mobile acceptance. Browser: Chrome 150.0.7871.125. No unexpected browser exceptions.
- Earlier attempts exposed old settings-order/error-location expectations (updated without removing denial assertions), stale duplicate-heading selectors, a retained request on the reused 7073 host (starting balance changed from 17 to 15), and a balance-link assertion that read the DOM before the async route completed. The final run retains original balance assertions and awaits the actual destination/cards rather than adding a fixed delay. The API was reset before the isolated runs; the last timing failure occurred before any leave writes, with the original 17-day balance verified.

Commands use Node 22.22.3 on Intel macOS, with `NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0` for Angular. Run `ng test --watch=false`, `tsc --noEmit -p tsconfig.app.json`, `tsc --noEmit -p tsconfig.spec.json`, and `ng build --configuration production` from `frontend/`. The browser command from repository root is `MOCK_SUITE_TIMEOUT_MS=600000 MOCK_API_URL=http://127.0.0.1:7074 MOCK_SCREENSHOT_DIR=/private/tmp/vacate-lean-complete node frontend/verify.mjs`; start a fresh opt-in [test host](../../../../api/testing/README.md) before the complete suite. The ten-minute overall budget accommodates this older Mac; interaction/assertion timeouts are unchanged. Functional-only mode excludes trusted input and is not a substitute for this command.

## Rendered samples

Selected test-data captures were visually inspected and saved with this evidence:

- [Mobile Month, 320px](lean-pages/lean-calendar-month-320.png)
- [Mobile planner Month, 375px](lean-pages/lean-planner-month-375.png)
- [Request modal with info disclosure open, 320px](lean-pages/lean-request-320.png) — default disclosure is hidden; the modal scrolls to its spaced actions.
- [Collapsed My Leave balances, 320px](lean-pages/my-leave-collapsed-320.png)
- [Unified administrator People/history, 1440px](lean-pages/people-admin-balances-history-1440.png)
- [Profile-first administrator Settings, 375px](lean-pages/page-focus-admin-settings-brown-375.png)

Full local captures remain under `/private/tmp/vacate-lean-complete/`, `/private/tmp/vacate-lean-leave-people/` and `/private/tmp/vacate-lean-focus/`. Screenshots and overflow/style assertions do not establish assistive-technology or physical-device conformance.

## Remaining gates

No hosted deployment, SQL-provider execution, physical-device or screen-reader evaluation is claimed. Figma remains [VAC-51 Todo](../../VAC-51-focused-figma-follow-up.md). Independent approval remains separate from these assistant reviews. Unrelated `docs/next-up.md` and `docs/review-43.md` are preserved.

Assistant work unmeasured; human actual Unknown. VAC-42/VAC-52 issue metadata remains QA; no summary, dependency or backlog status change.

## Commit preparation · 2026-11-16

Owner explicitly requested local QA, commit and push. A fresh local run passed all 123 Angular tests, both TypeScript projects and the production build. The rebuilt application bundles match those exercised by the complete browser/keyboard and focused leave/People checks above; application code has not changed since those checks. Scoped formatting/whitespace and evidence links passed. API/backend code is unchanged.

Remote verification found PR #10 already merged; this follow-up therefore uses `VAC-52-lean-page-refinements` from its tested `fc8d9ce` head. Current `origin/master` additionally contains the separate PR #9 SQL/documentation merge, with no frontend/API source difference; that database work is not duplicated in this commit. Only the reviewed application, tests and linked evidence/specifications are included. `docs/next-up.md` and `docs/review-43.md` remain excluded. No merge or deployment is authorised by this request.
