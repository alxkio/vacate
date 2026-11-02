# Recurring native input readiness failure · VAC-15 · 2026-11-02

## Observed failure and baseline

The user supplied a CI failure in `prepareNativeFocus` at `frontend/verify.mjs:297`: 43 attempts, focused and visible document, active BODY, H1 anchor and hit target, but no trusted pointer, Shift keydown or Shift keyup events. The failure occurs in the readiness regression before the tested calendar action. Increasing the timeout or treating `document.hasFocus()` as proof would not establish native delivery.

GitHub run metadata confirms [push CI 41522503159](https://github.com/alxkio/vacate/actions/runs/41522503159) passed at head `a724241a217d6b41aade6c0f6879dc4076d3ce0f`, while [PR CI 41526519930](https://github.com/alxkio/vacate/actions/runs/41526519930) failed in the api-web job's paired verification step at the same head. A PR run uses its merge revision, so the executed revisions must not be conflated. The GitHub connection does not expose the requested job-log endpoint; its failure contents are established by the user-supplied stack trace, not independently retrieved logs. A successful Deploy Azure workflow status does not establish that the failing CI job passed.

Local baseline at `a724241`: minimal inert-page CDP input succeeds in Chrome 150.0.7871.125 with the existing flags, with the automation flag and with GPU disabling removed. The unchanged native application journey also passes, including all preparation fault scenarios, calendar/dialog, shortlist and account-menu checks. This supports intermittent behavior; it does not identify the exact Chromium state on the failed Linux runner.

## Bounded hardening

- Add `--enable-automation` to the temporary Chrome launcher. Chrome's tooling documentation describes this flag as suppressing password-saving UI and other browser-owned interruptions. Such interference is a plausible source of input loss after sign-in, but its role in this failure remains **UNVERIFIED**.
- Preserve the five-second inert-preparation budget, trusted pointer and Shift press/release evidence, hit testing, overlay rejection and single-attempt application actions. No synthetic fallback, native skip, focus emulation or increased timeout is introduced.
- Capture `native-input-failure.json` and `native-input-failure.png` before closing Chrome after a genuine readiness failure. Diagnostics include the existing document/event state plus elapsed time, Chrome/Node versions, platform and headful mode. Capture errors are recorded without replacing the original readiness failure.
- Upload those files from the paired CI job when it fails. The existing no-input regression validates that the JSON reports missing delivery and that a PNG is written, then removes its intentional-failure artifacts. Other deliberate negative scenarios do not capture artifacts.

Source checked 2026-11-02: [Chrome flags for tooling — catch-all automation](https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md#catch-all-automation). This documents the flag's behavior, not the failure's root cause.

## Verification

Environment: macOS, Node 22.22.3, Chrome 150.0.7871.125, cached Functions Core Tools 4.16.0 and the existing local Angular build. A dedicated fictional InMemory API runs on port 7074; no SQL or hosted data is used. The first host attempts selected incompatible system Core Tools 4.0.4483 and failed setup/sign-in; those attempts are not native-input verification. The supported binary was selected explicitly before the successful browser runs.

- Passed: unchanged baseline native-only journey.
- Passed: revised fresh-browser native-only journey, including delayed, missing, synthetic, pointer-only, keyboard-only and overlay checks, evidence capture/cleanup, trusted Escape, chooser and avatar/settings navigation.
- Passed: a second fresh-browser revised native journey at 4× CPU slowdown, with all native assertions and fault scenarios enabled.
- Passed: complete default browser suite with the revised launcher and every native check enabled. This covered all twelve accounts/aliases, own/shared projections, foreign-ID denials, logout/account-switch history, per-account display settings, profile and membership edits, organization settings, delegation/revocation, approval/carryover configuration and desktop/mobile journeys.
- Passed: Node syntax and changed-file whitespace checks. Whole-tree whitespace checks also report pre-existing edits in `docs/next-up.md`, which are outside this change.
- Passed: workflow/issue YAML parsing, new documentation links, VAC-15 status/backlog parity, 35 unique issue IDs and an acyclic dependency graph with valid targets. One old frontend README release link is already broken in HEAD; this change adds no broken link. Successful native and stress runs leave no intentional-failure artifacts.

Commands use `MOCK_API_URL=http://127.0.0.1:7074`, Node 22.22.3 and screenshots under `/private/tmp/vacate-native-*`. Native-only runs use `MOCK_NATIVE_ONLY=1`; stress adds `MOCK_CPU_THROTTLE=4`. These modes retain all native assertions. CI uses Node 24 on Linux; local results do not prove identical runner behavior.

## Remaining verification

The exact hosted failure remains unresolved. Hosted CI verification and inspection of any newly captured failure evidence are required before closing VAC-15. No commit, push, hosted rerun, release approval or deployment is performed by this investigation. Application/API/authorization code and lifecycle behavior are unchanged; tenant-isolation regression execution is not required for this launcher/evidence-only change.
