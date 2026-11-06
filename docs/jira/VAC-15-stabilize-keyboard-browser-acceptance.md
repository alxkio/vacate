---
id: VAC-15
type: bug
summary: Stabilize trusted keyboard browser acceptance
status: in-progress
created: 2026-10-28
updated: 2026-11-06
parent: null
depends_on: []
---

# VAC-15 — Stabilize trusted keyboard browser acceptance

![Bug](badges/bug.svg) **🔨 In progress** · Owner: Codex

## Description

The CI browser acceptance test failed while checking trusted keyboard navigation from the leave-request dialog to the account menu.

Reproduction: run `node frontend/verify.mjs` against the built Angular app and API in CI. After manipulating the request dialog, the test closes it programmatically and immediately continues with trusted key input on the account button.

Actual: the test times out waiting for a trusted click; diagnostics report the dialog close button still active and the dialog still open when it tries to interact with the account button.

Expected: the dialog closes through a native keyboard action, focus returns to its trigger, and the next trusted keyboard action opens the account menu.

## Scope

Make the browser acceptance sequence use the user's native keyboard path to close the dialog and wait for both the closed state and restored trigger focus before proceeding. Keep product runtime behavior, API contracts and authorization unchanged.

### Reopened failure · 2026-10-30

At commit 6047b62, [CI run 41020923736](https://github.com/alxkio/vacate/actions/runs/41020923736) passed but [Deploy Azure run 41023946660](https://github.com/alxkio/vacate/actions/runs/41023946660) failed in the same reusable API/web check before deployment. The first calendar-date Enter action produced no trusted click although the emulated document reported focused and the button was active. This extends the existing native-input harness scope; no calendar or product behavior changes.

### Chrome startup failure · 2026-11-06

The founder supplied a CI log in which real HTTP and shared-schema checks pass, then `frontend/verify.mjs` fails with `Chrome debugging endpoint unavailable` after 20 seconds on Node v24.22.2. This is a browser bootstrap failure before CDP connects, separate from the prior trusted-input failures. The previous harness discarded startup stderr from the failure message and discovered the endpoint only through a stderr announcement. Extend this existing harness issue to profile-file discovery and startup diagnostics; the precise hosted Chrome failure remains **UNVERIFIED** without its startup output. npm audit/install-script warnings in the supplied log do not establish the cause.

## Dependencies

None.

## Acceptance scenarios

- [x] Given the request dialog is open, when the browser acceptance test presses Enter on its close button, then the dialog closes and focus returns to the request trigger.
- [x] Given the dialog has closed, when the test opens account options using trusted keyboard input, then the account menu opens and the check passes in focused local browser verification.
- [x] Tenant isolation is not exercised: this issue changes only browser-test sequencing, not application data or authorization.

- [x] Native actions establish real renderer focus and require both a trusted Enter keydown and a trusted keyboard click; reported/emulated focus alone is insufficient.
- [x] Dropped preparation input recovers; absent, untrusted, pointer-only and keyboard-only input fails readiness; an overlay receives no preparation input. Application actions remain single-attempt.
- [ ] Repeated fresh-browser native acceptance and the complete hosted check pass without synthetic click fallback, skipped native assertions or retrying application actions.
- [x] Given readiness input is missing, its original failure includes runtime diagnostics and a screenshot/JSON artifact; the deterministic rejection test validates capture without leaving intentional-failure artifacts on successful runs.
- [x] Endpoint discovery accepts chunked stderr announcements and Chrome's fresh-profile port file; partial/invalid files cannot establish readiness, and missing executables, early exits and timeouts retain startup evidence. Six isolated launcher regressions pass.
- [ ] The reported hosted startup failure passes on a fresh runner, or its uploaded stderr establishes the remaining cause. Startup hardening alone is not proof of a hosted fix.

## Subtasks and responsibilities

### UX

Not applicable; this issue stabilizes automated coverage without changing user-facing behavior.

### UI

Not applicable; product UI behavior is unchanged.

### Backend

Not applicable; API behavior is unchanged.

### Database

Not applicable; no persistence behavior changes.

### QA and other responsibilities

- [x] Update the browser test to close the request dialog through trusted keyboard input and await focus restoration.
- [x] Run focused browser acceptance; the complete browser script also passed these keyboard checks before timing out later in an unrelated flow.
- [ ] Confirm the full browser suite passes in CI.

## Attachments and sources

- [Browser acceptance test](../../frontend/verify.mjs)
- CI failed while running `node frontend/verify.mjs` on 2026-10-28; the reported active element was the dialog close button and the dialog remained open.

## Comments

C-1 · 2026-10-28 · Codex: Replaced programmatic dialog closure immediately before the trusted keyboard account-menu check with Enter activation of the dialog's native close button, then wait for the closed state and restored request-trigger focus.

C-2 · 2026-10-28 · Codex: Focused native browser acceptance passed. A complete local browser run also passed all native keyboard assertions and subsequent account/scope checks, then reached its five-minute suite deadline later while evaluating a separate request-type toggle. Full CI verification remains pending.

C-3 · 2026-10-28 · Codex: User authorized deployment to Azure dev. Fetched master `f75decd` and retained its native dialog-close fix. Added the independently validated focus-helper correction: wait for rendered frames before selecting/focusing the target and verify focus before dispatch. The alternative local issue draft was consolidated into this existing VAC-15 record; its original remains outside the checkout in the setup backup. Earlier local full acceptance with the focus-helper correction passed all twelve accounts, privacy/isolation, catalogue, profile and organization journeys.

C-4 · 2026-10-28 · Codex: Git HTTPS reads work, but `gh run list` and a direct API request receive a network-proxy 403 for `api.github.com`. Saved that exact domain in the environment network draft; deployment dispatch and hosted verification remain blocked until applied. No credential values requested or extracted.

C-5 · 2026-10-28 · Codex: Combined master native-close and focus-helper fixes passed the complete local browser suite, including all twelve account/scope, privacy/foreign-ID, history, profile/organization, keyboard and responsive checks. Real HTTP API checks passed. A local rebuild while the host ran triggered duplicate function loading; restarting the host after the build cleared it before the successful acceptance run. Build finished with zero warnings/errors. Hosted deployment remains blocked by API network policy, not by these local checks.

C-6 · 2026-10-30 · Codex: reopened for the first-date native-input failure in deployment checks. The deployment workflow reuses the exact CI job; infrastructure deployment was skipped after the test failed. Investigating renderer input focus independently of focus emulation.

C-7 · 2026-10-30 · Codex: removed focus emulation, enabled standard renderer/background automation flags for all test modes, and added verified native renderer focus before Enter. Document-level evidence must observe both trusted Enter and trusted keyboard click on the intended control. Three consecutive fresh-browser native-only runs passed; full default suite is running. See [current verification](media/VAC-15/verification-2026-10-30.md).

C-8 · 2026-10-30 · Codex: correction C-7 passed standalone CI twice at 6ff8c24, but [Deploy Azure 41031274200](https://github.com/alxkio/vacate/actions/runs/41031274200) failed waiting for its single pointer focus probe. Reopened for bounded inert preparation, trusted pointer and modifier-key delivery checks, and deterministic dropped/missing/untrusted input and overlay regression scenarios. User requested extensive local verification before committing. Application actions remain single-attempt; product/API/authorization behavior is unaffected.

C-9 · 2026-10-30 · Codex: follow-up correction passed six fresh-browser native journeys (including 4× and 8× CPU slowdown), two complete default suites (normal/4×), and focused unified navigation/admin balances/history acceptance. All six preparation fault scenarios ran in every native/full journey. Existing frontend/backend tests, production frontend build, real HTTP/schema, TypeScript and fixture checks passed. Hosted execution of this correction and independent release acceptance remain separate from this local evidence.

C-10 · 2026-11-02 · Codex: During VAC-35 hosted SQL cutover checks, one diagnostic run passed native readiness, trusted Escape, shortlist and account-menu checks before a separate hardcoded same-origin test cleanup failed. Subsequent headless and visible Chrome 150 runs failed native readiness with focused/visible document but no trusted pointer/key events. Native assertions were retained; functional-only results are reported separately, never as a complete default pass. Existing QA gap remains open; no product runtime/native-helper change made. Shared effort belongs to VAC-35, not duplicated here.

C-11 · 2026-11-02 · Codex: user reported the same zero-event readiness failure after 43 attempts. The current push CI [41522503159](https://github.com/alxkio/vacate/actions/runs/41522503159) passed at head `a724241`; PR CI [41526519930](https://github.com/alxkio/vacate/actions/runs/41526519930) failed in api-web at the same head (PR execution uses its merge revision). Minimal Chrome input and the unchanged local native journey both pass, so a persistent application defect or specific Chrome cause is not established. Added the documented automation launcher flag to suppress browser-owned prompts and preserved failure evidence. This is bounded hardening, not proof that password-save UI caused the runner failure. See [new evidence](media/VAC-15/verification-2026-11-02.md).

C-12 · 2026-11-02 · Codex: revised native-only, 4× CPU-stressed native-only and the complete default suite passed locally with all native assertions enabled. The no-input regression verified evidence capture and cleanup. Syntax, workflow/issue YAML, changed-file whitespace, issue/backlog and dependency checks passed. Remains In progress because local success does not establish the cause or resolution of the hosted recurrence; hosted verification is pending. Existing changes to `docs/next-up.md` were preserved.

C-13 · 2026-11-06 · Codex: Followed up the founder's pre-CDP startup timeout. Added the documented DevToolsActivePort discovery path, bounded stderr capture, actionable startup failures/artifacts and CI version logging/upload. Six deterministic launcher tests pass; no dependency changes, timeout increase, native-input bypass, application/API change or hosted rerun is included. The original Chrome startup cause remains UNVERIFIED.

## Decisions

D-1 · 2026-10-28 · Codex: Exercise the dialog's native keyboard close path rather than closing the dialog through DOM scripting immediately before another trusted keyboard check.

D-2 · 2026-10-30 · Codex: a DOM/emulated focus report does not establish native input delivery. Require trusted transport evidence and retain every application-action assertion; no scripted fallback, action retry or native skip.

D-3 · 2026-10-30 · Codex: repeat only harmless preparation probes within five seconds, after waiting for rendered layout and verifying an inert hit target. Require both trusted pointer input and a complete trusted Shift press/release before dispatching the tested action once. Negative browser scenarios must still fail closed for absent, partially delivered or untrusted input.

D-4 · 2026-11-02 · Codex: suppress browser-owned prompts with the standard automation flag and retain runtime/screenshot evidence for genuine readiness failures. Do not extend the timeout, skip native checks, retry application actions or claim the intermittent hosted defect is resolved from local success alone.

## Work log

| Entry | Date       | Actor / category              | Activity                                                                                                                              | Duration | Basis                                                                 |
| ----- | ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| W-1   | 2026-10-28 | Codex / assistant recorded    | Investigate the browser failure and stabilize keyboard acceptance sequencing                                                          | Unknown  | Session work; no complete issue duration measured                     |
| W-2   | 2026-10-28 | Codex / assistant recorded    | Update issue evidence and backlog after focused browser verification                                                                  | Unknown  | Session work; no complete issue duration measured                     |
| W-3   | 2026-10-30 | Codex / assistant recorded    | Reproduce deployment-check focus failure, validate native renderer transport and run repeated native/full-browser checks              | Unknown  | No complete session duration measured; current verification record    |
| W-4   | 2026-10-30 | Codex / assistant recorded    | Investigate repeated focus-preparation failure, add deterministic browser fault scenarios and verify locally under CPU throttling     | Unknown  | No complete session duration measured; current verification record    |
| W-5   | 2026-11-02 | Codex / assistant recorded    | Inspect the recurring CI failure, isolate local Chrome transport, harden launcher/evidence capture and run native browser regressions | Unknown  | No complete session duration measured; November 2 verification record |
| W-6   | 2026-11-06 | Codex / assistant, unmeasured | Investigate reported browser bootstrap timeout, add dual endpoint discovery and startup evidence, verify isolated launcher behavior   | Unknown  | Supplied CI log and local diff; no session duration measured          |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-28 · Codex: Created as In progress for the reported CI browser-acceptance failure.

H-2 · 2026-10-28 · Codex: Moved to QA after the focused keyboard browser acceptance passed. Full CI remains pending; the full local browser suite exceeded its five-minute time limit after passing the keyboard checks and later account/scope checks.

H-3 · 2026-10-30 · Codex: reopened In progress after deployment checks failed despite CI success on the same commit.

H-4 · 2026-10-30 · Codex: returned to QA after three consecutive fresh-browser native-only runs and the complete default browser suite passed; hosted verification and independent acceptance remain pending.

H-5 · 2026-10-30 · Codex: reopened In progress because deployment checks still failed at 6ff8c24 despite two successful standalone CI executions. Extensive local verification of the preparation correction is in progress before committing.

H-6 · 2026-10-30 · Codex: returned to QA after deterministic input-failure scenarios, repeated native/stressed/full browser journeys and focused navigation passed locally. See the follow-up evidence; this does not claim an Azure release.

H-7 · 2026-11-02 · Codex: reopened In progress after the reported CI zero-event readiness failure. Prior passing evidence is retained; the intermittent hosted defect remains unresolved pending verification of the hardening and captured runner evidence.

## Verification and release

### Original verification · 2026-10-28

Focused browser acceptance passed with `MOCK_NATIVE_ONLY=1`, the locally built frontend, Chrome and the in-memory API. The complete `frontend/verify.mjs` run passed the trusted Escape, request-dialog keyboard, account dropdown and account/scope checks, then hit the test harness's five-minute overall deadline later at an unrelated request-type toggle. CI rerun and full-suite completion remain pending. `node --check frontend/verify.mjs` and `git diff --check` passed. No API, tenant-isolation or product-runtime behavior changed.

### Current correction · 2026-10-30

The existing real-HTTP suite, three consecutive fresh-browser native-only runs and the complete default browser suite passed against the actual local Functions API. All native assertions were enabled, including both trusted Enter delivery and trusted keyboard activation. Formatting, syntax and whitespace checks passed. [Current evidence and technical sources](media/VAC-15/verification-2026-10-30.md) record the focus correction. Hosted CI verification follows the push; no new Azure deployment is claimed.

### Follow-up preparation correction · 2026-10-30

The first correction above was insufficient on the deployment runner. The follow-up now verifies both pointer and keyboard delivery, waits for rendered/hit-tested inert text and repeats only harmless preparation within a five-second retry budget. Six focused native runs, two complete default runs and focused navigation acceptance passed locally, including CPU slowdown and deterministic absent/partial/untrusted input scenarios. The [follow-up evidence](media/VAC-15/verification-2026-10-30.md#follow-up-after-the-second-deployment-check-failure) records the full local matrix and the original runner-state uncertainty. No application, API, permissions or fixture changes.

### Recurring hosted failure · 2026-11-02

[November 2 evidence](media/VAC-15/verification-2026-11-02.md) records the unchanged passing baseline, launcher/evidence hardening, passing revised native/stressed/full-browser checks and unresolved hosted cause. The API implementation, frontend application, authorization and lifecycle behavior are unaffected; no backend or product changes were needed. No hosted result is claimed for these uncommitted changes.

### Browser bootstrap verification · 2026-11-06

Six Node launcher regressions passed: split stderr announcement, profile-file discovery without stderr, partial file completion, early exit with retained output, missing executable and invalid/missing endpoint timeout. Three independent fresh Chrome 150.0.7871.125 launches on local macOS passed endpoint discovery, actual `/json/version` access and consistency with `DevToolsActivePort`. No API was contacted during these startup checks. JavaScript syntax, changed-file formatting, CI YAML/shell syntax and `git diff --check` passed. The hosted Linux failure was not reproduced locally; neither these focused checks nor a startup fallback establish full native/browser acceptance or a hosted fix. CI now uploads the missing startup evidence. [Chrome's protocol documentation](https://chromedevtools.github.io/devtools-protocol/) confirms both endpoint publication methods (checked 2026-11-06).

## Open questions and follow-up

Local verification cannot establish the precise Chromium state in the earlier failed runner; that remains UNVERIFIED. Hosted CI and deployment verification of the follow-up are still required at the time of this local evidence record.

The November 2 failure's exact browser/input-suppression cause remains UNVERIFIED. Current run metadata is available through the GitHub connection, but its job-log endpoint is unsupported; the supplied stack trace is the failure evidence. A hosted rerun of the launcher/evidence changes remains required. No commit, push, rerun or deployment was performed in this investigation.
