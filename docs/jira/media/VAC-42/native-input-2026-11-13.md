# Native input delivery follow-up · 2026-11-13

Existing VAC-42 UI-refinement subtask; no new issue or product behavior. User-pushed baseline `171134e104c897cc7837ff783b139507bb7a5354`, PR #6. [CI run 43488631807](https://github.com/alxkio/vacate/actions/runs/43488631807) executed merge revision `f5ca6632f46b13028b9b8837052489d99f4cf655`. Backend and frontend jobs passed; paired API/web acceptance failed before calendar keyboard activation.

## Evidence and bounded change

Retrieved job logs and failure artifact independently confirm Chrome 157.0.8103.50, Node 24.22.2, Ubuntu 24.04, headless mode: 43 preparation attempts in 5043 ms; focused/visible document, H1 hit target, no pointer or keyboard events. Screenshot shows the rendered calendar without a page overlay at the probe heading. This is an input-delivery failure, not evidence of a missing calendar date or failed application handler. Earlier [VAC-15 evidence](../VAC-15/verification-2026-11-02.md) records the same symptoms; its local pass did not establish a Linux fix.

CI now runs the complete default acceptance suite in headed Chrome under Xvfb with a 1600×1250 virtual display. All trusted input, missing/synthetic/partial input, dropped-probe recovery and overlay checks remain enabled; no synthetic fallback, native skip or increased readiness timeout. This is a bounded environment correction to verify on Linux, not a proven Chromium regression diagnosis. Native failures additionally retain target/window information and a bounded Chrome stderr tail, with intentional-failure artifacts removed by their regression check.

Independent QA reviewed the failure layer and preserved-check requirements. [Chromium input-handler source](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/devtools/protocol/input_handler.cc) supports requiring observed events rather than treating a protocol acknowledgment as delivery; it does not prove the precise cause on this runner. Checked 2026-11-13.

## Verification

- Local headed native journey: passed, Chrome 150.0.7871.125 / Node 22.22.3 / macOS, fictional InMemory API on port 7073. Includes dropped first three probes, rejection of no/untrusted/partial input, overlay rejection, trusted calendar activation, Escape/focus return, shortlist and avatar/settings navigation.
- Local headed native journey with 4× CPU throttling: passed with the same assertions.
- Local headless owner-feedback mode reproduced missing pointer/key events on Settings despite a focused/visible document, using Chrome 150 on the same machine. This further supports an environment investigation; the mode is a different journey and does not establish a controlled Chrome 157 headless/headed comparison.
- Chrome endpoint/startup regression suite: six passed. Independent QA review found no blocking issue in the CI, diagnostic or switch-interaction changes.
- Workflow YAML parsing and Node syntax: passed. New Linux display configuration requires an actual CI run; local headed success does not prove Chrome 157/Xvfb behavior or headless/headed causality.

During the earlier full functional rerun, owner feedback failed at the denied Settings profile assertion. Source review found the test still manipulated checkbox toggles using `selectedIndex`, leaving delegation enabled. The test now clicks explicit true/false switch states and distinguishes scope inheritance from explicit approval. Application permissions and Settings behavior are unchanged. Focused functional verification and complete CI result will be recorded below.

The first complete headed rerun passed native input, all twelve account/privacy/eligibility journeys, history and leave save/read checks, then exposed a calendar test race (`2026` read before the next-year action completed). Workspace controls await real HTTP session validation before applying changes; two rendered frames alone do not establish completion. Shared synthetic test clicks now wait for the selected scope/view or changed date before reading the resulting page. The existing exact year, privacy and navigation assertions remain intact. The second local complete run uses a bounded fifteen-minute overall suite deadline on this machine; native readiness remains five seconds and CI's suite deadline remains unchanged.

The second run passed the calendar/display-preference checks, then exposed the same asynchronous-session race when reading the mobile account menu before it opened. Account test clicks now await the changed `aria-expanded` state and presence/absence of the dropdown before proceeding. The mobile bounds assertion remains unchanged. These are test synchronization changes, not application input or permission changes.

A subsequent retry correctly rejected a changed Maya profile left in the local InMemory host by the interrupted profile-edit journey. The dedicated process was restarted to recover its fictional seeds before the final complete run; no SQL/shared database reset was performed. Full legacy acceptance requires a fresh disposable host. The future-request journey's record/balance/session teardown is separately verified and is not a claim that every legacy profile-edit assertion has failure teardown.

## Final local result

Complete default acceptance **passed** with every native and functional assertion enabled, against the fresh fictional InMemory host. This includes all twelve account/role/privacy/eligibility variants, trusted keyboard/dialog/chooser/account behavior, history, leave preview/save/read, calendar views, per-account layouts, profile and organization saves, delegated Settings denial/revocation and approval hierarchy, plus actual future-request creation/rendering and administrator deletion with exact record/calendar/balance restoration.

Command: `MOCK_HEADFUL=1 MOCK_SUITE_TIMEOUT_MS=900000 MOCK_API_URL=http://127.0.0.1:7073 MOCK_SCREENSHOT_DIR=/private/tmp/vacate-ci-complete-fresh node frontend/verify.mjs` (Node 22.22.3 / Chrome 150.0.7871.125 / Intel macOS). Screenshot artifacts are local; application UI was unchanged. Syntax, changed-file whitespace, workflow YAML parsing, new evidence links and six isolated Chrome startup regressions also passed. Independent QA found no blocking issue after review of native checks, display configuration, diagnostics and switch synchronization.

Linux Chrome 157/Xvfb CI verification follows the pushed revision; a local pass alone does not close that gate.

Backend/API/database are unaffected by this follow-up. The previously implemented deletion and teardown retain their separate [verification and SQL limitations](../VAC-43/upcoming-request-deletion.md). No merge, deployment or database operation. Assistant time unmeasured; human actual Unknown.
