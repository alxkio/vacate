# Page outline and session recovery · 2026-11-13

Baseline: merged PR #6, `30a02061da53e962c6d59c5dcb64d6d3b185986e`. Follow-up branch `VAC-42-page-session-recovery`. The owner's screenshot shows administrator People in the warm brown palette; clarification identifies the large main-content outline as the visual bug and selects a 30-minute session lifetime. Existing untracked `docs/review-43.md` is unrelated and preserved.

## Prioritized findings

1. **P1 — false session expiry on API failure.** Startup initialization clears the browser ticket after any failed refresh. The Settings route guard also logs out after any refresh failure; save handling clears sessions on 403/404. These source-confirmed paths treat unavailable connections or permission/resource denials as expired authentication. Retain the ticket, hide partial/stale private state and offer retry; only definitive authenticated 401 ends it.
2. **P1 — process-local session loss remains a separate limitation.** Both InMemory and SQL resource modes use `InMemorySessionStore`. A restart or another worker cannot resolve the old ticket before its configured expiry. The precise hosted trigger for the owner's interruptions is UNVERIFIED; no instance/network trace was provided. Shared SQL tickets require the separate owner decision requested under ADR-0004. Changing the duration alone does not fix this limitation.
3. **P2 — programmatic main focus draws a page frame.** `main#main` has tabindex -1 and receives focus after page navigation. The shared `[tabindex]:focus-visible` rule draws the screenshot's large outline. Exclude only the main landmark and its browser-default outline; preserve focus and all interactive indicators, including negative-tabindex controls. No layout, palette or typography redesign.

The prior configured duration was eight hours, not a newly shortened expiry. The owner now chooses 30 minutes; existing absolute/non-sliding semantics are retained.

Rendered focus verification additionally exposed an existing skip-link bug: literal `href="#main"` resolved against the application’s root base URL and reloaded the root route, losing the current page/query. Its URL now includes the current router path/query plus the main fragment. Acceptance checks retain the current page/state and focus the landmark.

The first complete rerun caught a different-account reset regression: honoring Login's return URL could carry the previous account's calendar scope into a replacement account. `ensureSession` now distinguishes an ended session (preserve its safe return destination) from a known replacement actor (discard prior private draft/context and start with the replacement account's defaults). The existing exact default-scope assertion is retained.

## Journey and recovery

| Stage / user goal                                | Current failure and evidence                                                        | Implemented response / completion signal                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Return to People/Settings after login or refresh | Programmatic main focus receives the global outline; screenshot and selector match  | Main remains focused without a frame; interactive and skip-link indicators remain           |
| Restore the workspace from a saved session       | Startup or Settings API failure discards the ticket in source                       | Hide incomplete/stale account state; show reconnect feedback and Retry connection           |
| Reconnect after a temporary failure              | Re-entering credentials was the only visible path                                   | Retry the same ticket; return to the original internal page without another sign-in         |
| Retry after actual expiry                        | A retry on Login could replace the original destination with workspace home         | Authenticated 401 clears the ticket; preserve the sanitized original return URL for sign-in |
| Switch accounts or overlap navigation            | Late failure must not clear a replacement actor; same-ticket restores could compete | Ignore replaced-ticket failures and share same-ticket restore work                          |

This map describes source-confirmed behavior and proposed verification, not participant research or measured completion time. No thoughts/feelings or hosted failure frequency are inferred.

## Verification

- Focused initial frontend checks: 30 passed; full Angular suite after recovery/routing safeguards: **95 passed / 19 files**.
- Focused HTTP/authorization checks: **19 passed**, including controlled-time session expiry at exactly 30 minutes, activity without renewal, independent sessions, token-only logout and disabled-account revocation.
- Final complete default browser suite: **passed**, including every native trusted-input/adversarial check, all twelve account/role/privacy/history cases, leave save/read, profile/organization/delegation and account-switch isolation, future-leave creation/deletion/restoration, plus the new session-recovery and desktop/mobile focus journeys. Node 22.22.3 / Chrome 150.0.7871.125 / Intel macOS; fictional InMemory API on port 7073. The local run uses a fifteen-minute overall deadline; native readiness remains five seconds.
- Focused rendered focus mode: **passed** at 1440/375/320px, including warm brown administrator People/reload/Settings, main focus after login/refresh/navigation, skip links and interactive/negative-tabindex indicators. Prior palette restored; all captured sessions revoked and rejected. Screenshots were inspected, including the reported administrator view.
- Workspace component/navigation suite after the skip-link change: **12 passed**. Node syntax and changed-file whitespace checks passed; mechanical detector found no new issue in changed Login/Workspace files.
- Full backend suites: **75 integration tests passed, 25 actual-SQL cases skipped; 10 unit tests passed**. Production Angular build passed.
- Focused rendered recovery mode: **passed** for temporary current-user/summary errors at desktop/mobile, Settings validation errors, later authenticated 401 with original destination preserved, and newly issued tickets surviving a failed initial workspace load. Captured sessions were revoked and rejected after cleanup. Injected failures are test-proxy responses, not evidence of the precise hosted outage.
- Independent QA identified return-URL loss on retry 401 and overlapping same-ticket restore races; both have focused regressions and fixes.
- Impeccable context/audit/harden guidance applied to the scoped recovery/focus change. Login detector returned no findings. Styles detector found only three pre-existing warnings outside the changed focus rules. Source detector output is not an accessibility-conformance or screen-reader pass.

The focused browser recovery mode injects one GET failure in the local acceptance proxy, never in production endpoints. It verifies transient current-user/summary and Settings failure recovery, later 401 navigation and successfully issued tickets surviving initial workspace failure. Captured fictional test sessions are revoked and rejected after teardown. The focus mode uses forced CSS pseudo states for deterministic computed-style probes; these do not prove trusted keyboard delivery. Existing native acceptance remains a separate required check.

Application/API contracts are coordinated for the duration and recovery semantics. No SQL schema, runtime grants, production identity or infrastructure change is included without the pending durable-session decision. Actual SQL-provider execution and the exact hosted early-logout trigger remain unverified. Assistant time unmeasured; human actual Unknown.

## Rendered evidence

- [Administrator People, warm brown, desktop](page-session-recovery/people-brown-1440.png)
- [Administrator People, warm brown, mobile](page-session-recovery/people-brown-375.png)
- [Saved-session reconnect, mobile](page-session-recovery/reconnect-375.png)

## Changed files and ownership

- Authentication service and HTTP-adapter tests: 30-minute absolute expiry and revocation/isolation scenarios.
- `api/README.md`, `docs/contracts/api.md`, `docs/contracts/openapi.yaml`: coordinated lifetime and process-local limitations.
- `frontend/src/app/core/state/workspace-api.service.ts` and its tests: retained-ticket recovery, single-flight restore, stale actor/partial-state rejection and denied-save handling.
- `frontend/src/app/core/http/session-navigation.ts` and tests, `frontend/src/app/app.routes.ts`: safe expiry/reconnect destinations and recoverable Settings guards.
- Login TypeScript/template: recoverable connection feedback and Retry connection; fixture provider supplies the updated test-double interface.
- Workspace TypeScript/template and shared styles: main outline removal, native skip-link destination and explicit replacement-account reset.
- Browser harness, new session-recovery/focus acceptance modules and frontend README: local fault injection, rendered/native regression coverage and captured-session teardown.
- Product charter, existing VAC-42 subtask, this evidence file and three fictional screenshots: accepted duration, findings/journey, verification and the pending shared-session decision. Backlog metadata/status/dependencies are unchanged; no new issue is created.
