---
id: VAC-15
type: bug
summary: Stabilize trusted keyboard browser acceptance
status: qa
created: 2026-10-28
updated: 2026-10-30
parent: null
depends_on: []
---

# VAC-15 — Stabilize trusted keyboard browser acceptance

![Bug](badges/bug.svg) **🔍 QA** · Owner: Codex

## Description

The CI browser acceptance test failed while checking trusted keyboard navigation from the leave-request dialog to the account menu.

Reproduction: run `node frontend/verify.mjs` against the built Angular app and API in CI. After manipulating the request dialog, the test closes it programmatically and immediately continues with trusted key input on the account button.

Actual: the test times out waiting for a trusted click; diagnostics report the dialog close button still active and the dialog still open when it tries to interact with the account button.

Expected: the dialog closes through a native keyboard action, focus returns to its trigger, and the next trusted keyboard action opens the account menu.

## Scope

Make the browser acceptance sequence use the user's native keyboard path to close the dialog and wait for both the closed state and restored trigger focus before proceeding. Keep product runtime behavior, API contracts and authorization unchanged.

### Reopened failure · 2026-10-30

At commit 6047b62, [CI run 41020923736](https://github.com/alxkio/vacate/actions/runs/41020923736) passed but [Deploy Azure run 41023946660](https://github.com/alxkio/vacate/actions/runs/41023946660) failed in the same reusable API/web check before deployment. The first calendar-date Enter action produced no trusted click although the emulated document reported focused and the button was active. This extends the existing native-input harness scope; no calendar or product behavior changes.

## Dependencies

None.

## Acceptance scenarios

- [x] Given the request dialog is open, when the browser acceptance test presses Enter on its close button, then the dialog closes and focus returns to the request trigger.
- [x] Given the dialog has closed, when the test opens account options using trusted keyboard input, then the account menu opens and the check passes in focused local browser verification.
- [x] Tenant isolation is not exercised: this issue changes only browser-test sequencing, not application data or authorization.

- [x] Native actions establish real renderer focus and require both a trusted Enter keydown and a trusted keyboard click; reported/emulated focus alone is insufficient.
- [ ] Repeated fresh-browser native acceptance and the complete hosted check pass without synthetic click fallback, skipped native assertions or retrying application actions.

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

## Decisions

D-1 · 2026-10-28 · Codex: Exercise the dialog's native keyboard close path rather than closing the dialog through DOM scripting immediately before another trusted keyboard check.

D-2 · 2026-10-30 · Codex: a DOM/emulated focus report does not establish native input delivery. Require trusted transport evidence and retain every application-action assertion; no scripted fallback, action retry or native skip.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis |
|---|---|---|---|---|---|
| W-1 | 2026-10-28 | Codex / assistant recorded | Investigate the browser failure and stabilize keyboard acceptance sequencing | Unknown | Session work; no complete issue duration measured |
| W-2 | 2026-10-28 | Codex / assistant recorded | Update issue evidence and backlog after focused browser verification | Unknown | Session work; no complete issue duration measured |
| W-3 | 2026-10-30 | Codex / assistant recorded | Reproduce deployment-check focus failure, validate native renderer transport and run repeated native/full-browser checks | Unknown | No complete session duration measured; current verification record |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-28 · Codex: Created as In progress for the reported CI browser-acceptance failure.

H-2 · 2026-10-28 · Codex: Moved to QA after the focused keyboard browser acceptance passed. Full CI remains pending; the full local browser suite exceeded its five-minute time limit after passing the keyboard checks and later account/scope checks.

H-3 · 2026-10-30 · Codex: reopened In progress after deployment checks failed despite CI success on the same commit.

H-4 · 2026-10-30 · Codex: returned to QA after three consecutive fresh-browser native-only runs and the complete default browser suite passed; hosted verification and independent acceptance remain pending.

## Verification and release

### Original verification · 2026-10-28

Focused browser acceptance passed with `MOCK_NATIVE_ONLY=1`, the locally built frontend, Chrome and the in-memory API. The complete `frontend/verify.mjs` run passed the trusted Escape, request-dialog keyboard, account dropdown and account/scope checks, then hit the test harness's five-minute overall deadline later at an unrelated request-type toggle. CI rerun and full-suite completion remain pending. `node --check frontend/verify.mjs` and `git diff --check` passed. No API, tenant-isolation or product-runtime behavior changed.

### Current correction · 2026-10-30

The existing real-HTTP suite, three consecutive fresh-browser native-only runs and the complete default browser suite passed against the actual local Functions API. All native assertions were enabled, including both trusted Enter delivery and trusted keyboard activation. Formatting, syntax and whitespace checks passed. [Current evidence and technical sources](media/VAC-15/verification-2026-10-30.md) record the focus correction. Hosted CI verification follows the push; no new Azure deployment is claimed.

## Open questions and follow-up

The full browser suite still needs to complete in CI to confirm the reported failure is resolved end to end.
