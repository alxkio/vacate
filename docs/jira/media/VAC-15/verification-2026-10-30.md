# Native keyboard verification · VAC-15 · 2026-10-30

The first correction below was insufficient: deployment checks failed again at `6ff8c24`. The follow-up section records the current correction and its separate verification.

## Reported failure

[CI run 41020923736](https://github.com/alxkio/vacate/actions/runs/41020923736) passed at commit `6047b62`, but [Deploy Azure run 41023946660](https://github.com/alxkio/vacate/actions/runs/41023946660) failed in `checks / api-web` on the same commit. The first Enter on the 1 October calendar button did not produce the expected trusted click. Diagnostics reported an active button and a focused, visible document, with the dialog still closed. The actual infrastructure deployment was skipped because the shared test job failed.

Both runs use the same reusable [CI workflow](../../../../.github/workflows/ci.yml). This is an intermittent native-input test failure rather than evidence of different deployment application code.

## Correction

The [browser acceptance harness](../../../../frontend/verify.mjs) now:

- Disables renderer/background-window/timer throttling for every test mode, using established Chrome automation flags.
- Removes forced focus emulation. On each fresh document, it brings the page forward and focuses the renderer through a trusted pointer interaction on inert heading text. It verifies native pointer delivery and real document focus before attempting keyboard activation.
- Keeps the existing rendered-frame and active-button checks before pressing Enter exactly once.
- Records events at the document instead of attaching the evidence listener to a replaceable Angular button. Passing requires both a trusted Enter keydown and a trusted zero-detail keyboard click matching the intended control.
- Captures native focus, key/click events and current DOM focus if activation fails. It does not substitute scripted clicks, retry application actions, skip native tests or increase timeouts.

A pointer focus precondition does not activate the tested calendar/request/menu control; that control must still be activated by native Enter. Modal/account headings take priority over the page heading so focus preparation stays within the active UI context.

## Verification

- Existing real-HTTP API acceptance passed: all twelve accounts, session revocation, sanitized projections, tenant rules, CRUD/lifecycle and deletion conflicts.
- **Three consecutive fresh-browser native-only runs passed** against the actual Functions API and built Angular application. Each exercised calendar Enter, native Escape/focus restoration, request dialog/chooser keyboard actions, native dialog close, account dropdown, Settings and return navigation.
- The **complete default browser suite passed** with native assertions enabled, followed by all twelve accounts, authorization/foreign-group checks, history, display preferences, profile and membership/organization HTTP persistence, and desktop/mobile journeys. Hosted checks follow the correction push.
- JavaScript syntax, changed-code formatting and whitespace checks passed.

No application/build inputs, API contracts, authorization, tenant policy, fixtures, dependencies, records or lifecycle transitions changed. Existing frontend/backend build and unit evidence remains applicable. Native/browser verification is the relevant check for this transport/sequencing correction. Independent release approval and a new Azure deployment are not claimed.

## Technical sources

Checked 2026-10-30:

- [Chromium focus-emulation protocol definition](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Emulation.pdl): focus emulation simulates a focused, active page; it is not evidence that the renderer received native input.
- [Puppeteer Chrome launch arguments](https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/node/ChromeLauncher.ts): primary-source precedent for disabling background timer, occluded-window and renderer throttling during browser automation. No Puppeteer dependency was added.

## Follow-up after the second deployment-check failure

[Standalone CI 41026552180](https://github.com/alxkio/vacate/actions/runs/41026552180) passed twice at `6ff8c24`, but [Deploy Azure 41031274200](https://github.com/alxkio/vacate/actions/runs/41031274200) failed in `prepareNativeFocus`. Its one pointer preparation attempt never satisfied `window.__nativeFocusReady && document.hasFocus()`. That error had no delivery diagnostics; the precise Chromium state on that runner is **UNVERIFIED**. Actual Azure deployment was skipped.

The current correction addresses observable harness weaknesses:

- Enable `--allow-pre-commit-input`. [Chrome's tooling guide](https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md#rendering--gpu) documents input acceptance before frame commit; [Puppeteer uses this flag](https://github.com/puppeteer/puppeteer/blob/main/packages/puppeteer-core/src/node/ChromeLauncher.ts). **ASSUMPTION:** a compositor/input-readiness race contributed to the dropped input; the old log cannot establish this conclusively.
- Wait two rendered frames after scrolling, calculate fresh coordinates, and require the pointer hit target to be inert heading text. Never click a control or an overlay during preparation.
- Repeat only harmless preparation within five seconds. Every attempt requires a trusted heading pointer event, a trusted Shift keydown and keyup, and actual document focus. Every attempt resets its evidence and aborts the previous listeners, so cached readiness cannot pass.
- Keep Enter and each subsequent application action single-attempt, with all existing trusted activation and product assertions. No scripted fallback or native skip.
- Include attempt count, pointer/key delivery, visibility, focus, hit target and coordinates in preparation errors. Log Chrome version and support explicit local CPU throttling.

Default native acceptance now deterministically checks three discarded preparation attempts followed by real input; permanently absent input; untrusted DOM events; pointer-only delivery; keyboard-only delivery; and an overlay that must receive zero input. Missing/partial/untrusted input must fail readiness even after an earlier successful probe. The application dialog must remain closed throughout these preparation scenarios.

### Follow-up local verification

Verification uses Node 22.22.3, Chrome 150.0.7871.125 and the actual Functions 4.16.0 host with fictional seed data on port 7072. Native Chrome runs are sequential, each with a new temporary profile. The user requested local verification before committing.

- Passed: 43 frontend tests, 22 backend tests, both TypeScript project checks, five existing fixture/contract/profile/organization scripts and 11 smoke-helper tests.
- Passed: production frontend build. Existing organization stylesheet budget warning remains (4.44 kB against 4 kB; 438-byte excess).
- Passed: fresh Release backend build with zero warnings/errors and all 22 Release backend tests, matching CI configuration. These repeat the same 22 tests already checked in Debug, not 22 additional scenarios.
- Passed: existing real-HTTP acceptance across all twelve accounts, revocation, projections, CRUD/lifecycle timestamps, deletion conflicts and tenant authorization.
- Passed: complete native journey with all six readiness fault scenarios, followed by three consecutive fresh-browser repetitions and fresh-browser runs at 4× and 8× CPU slowdown. Each passed the original trusted keyboard/calendar/dialog/account/Settings assertions.
- Passed: all twelve live account/membership projections against the shared frontend JSON Schema.
- Passed: complete default browser acceptance twice, at normal speed and 4× CPU slowdown against the freshly built production artifact. Both included every native assertion, all twelve accounts, privacy/foreign-ID denials, Back/Forward, preferences, profile and organization persistence, and responsive screenshots.
- Passed: focused unified Settings, own-team membership, People editor/directory, personal leave, admin balance filters, employee denials, explicitly unavailable approvals, account/period history and desktop/mobile navigation journey.

Local commands use `MOCK_API_URL=http://127.0.0.1:7072` and the Node executable above. Native checks use `MOCK_NATIVE_ONLY=1`; CPU checks add `MOCK_CPU_THROTTLE=4` or `8`. Complete checks omit all test-mode selectors. Angular test/build commands use `NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0` for this older macOS host. Fresh-run output and screenshots are under `/private/tmp/vacate-focus-*`; the durable result is recorded here without fictional credentials or personal data.

Product code, API contracts/server behavior, authorization, tenant boundaries, account options and fixture records are unaffected. Existing API isolation tests are rerun as regression evidence; no new tenant-isolation scenario is needed for a test-harness-only change. Hosted verification and Azure release are not claimed by these local results.
