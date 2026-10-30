# Native keyboard verification · VAC-15 · 2026-10-30

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
