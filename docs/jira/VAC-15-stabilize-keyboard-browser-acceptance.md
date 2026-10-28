---
id: VAC-15
type: bug
summary: Stabilize trusted keyboard browser acceptance after closing a dialog
status: qa
created: 2026-10-28
updated: 2026-10-28
parent: null
depends_on: []
---

# VAC-15 — Stabilize trusted keyboard browser acceptance after closing a dialog

![Bug](badges/bug.svg) **🔍 QA** · Owner: Codex

## Description

The CI browser acceptance test failed while checking trusted keyboard navigation from the leave-request dialog to the account menu.

Reproduction: run `node frontend/verify.mjs` against the built Angular app and API in CI. After manipulating the request dialog, the test closes it programmatically and immediately continues with trusted key input on the account button.

Actual: the test times out waiting for a trusted click; diagnostics report the dialog close button still active and the dialog still open when it tries to interact with the account button.

Expected: the dialog closes through a native keyboard action, focus returns to its trigger, and the next trusted keyboard action opens the account menu.

## Scope

Make the browser acceptance sequence use the user's native keyboard path to close the dialog and wait for both the closed state and restored trigger focus before proceeding. Keep product runtime behavior, API contracts and authorization unchanged.

## Dependencies

None.

## Acceptance scenarios

- [x] Given the request dialog is open, when the browser acceptance test presses Enter on its close button, then the dialog closes and focus returns to the request trigger.
- [x] Given the dialog has closed, when the test opens account options using trusted keyboard input, then the account menu opens and the check passes in focused local browser verification.
- [x] Tenant isolation is not exercised: this issue changes only browser-test sequencing, not application data or authorization.

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

## Decisions

D-1 · 2026-10-28 · Codex: Exercise the dialog's native keyboard close path rather than closing the dialog through DOM scripting immediately before another trusted keyboard check.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis |
|---|---|---|---|---|---|
| W-1 | 2026-10-28 | Codex / assistant recorded | Investigate the browser failure and stabilize keyboard acceptance sequencing | Unknown | Session work; no complete issue duration measured |
| W-2 | 2026-10-28 | Codex / assistant recorded | Update issue evidence and backlog after focused browser verification | Unknown | Session work; no complete issue duration measured |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-28 · Codex: Created as In progress for the reported CI browser-acceptance failure.

H-2 · 2026-10-28 · Codex: Moved to QA after the focused keyboard browser acceptance passed. Full CI remains pending; the full local browser suite exceeded its five-minute time limit after passing the keyboard checks and later account/scope checks.

## Verification and release

Focused browser acceptance passed with `MOCK_NATIVE_ONLY=1`, the locally built frontend, Chrome and the in-memory API. The complete `frontend/verify.mjs` run passed the trusted Escape, request-dialog keyboard, account dropdown and account/scope checks, then hit the test harness's five-minute overall deadline later at an unrelated request-type toggle. CI rerun and full-suite completion remain pending. `node --check frontend/verify.mjs` and `git diff --check` passed. No API, tenant-isolation or product-runtime behavior changed.

## Open questions and follow-up

The full browser suite still needs to complete in CI to confirm the reported failure is resolved end to end.
