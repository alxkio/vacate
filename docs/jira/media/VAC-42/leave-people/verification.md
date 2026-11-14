# VAC-42 leave and People refinement · 2026-11-14

Status: local implementation/verification; actual SQL migration/import and deployment remain unverified. Branch: `VAC-42-page-session-recovery`; no commit, push, merge or deployment in this follow-up. Unrelated untracked `docs/review-43.md` preserved.

## Authority and decisions

The owner's 2026-11-14 feedback authorizes the [product-charter refinement](../../../../product/product-charter.md#owner-refinement--leave-lifecycle-and-unified-people--2026-11-14). [API contract](../../../../contracts/api.md#employee-cancellation-and-expiry--vac-42--2026-11-14), OpenAPI and [schema amendment](../../../../database/schema-catalogue.md#vac-42-cancellationexpiry-amendment--2026-11-14) describe the coordinated change. No architecture/provider/production-identity change is made.

My Leave puts a collapsed annual balance first, with expandable balances/type guidance, followed by one actual saved date/status table for every year. The current annual amount uses finite saved configured inputs and derived consumption; reference allowances for other types remain explicitly labelled. A configured allowance is labelled when its evaluated policy minimum is unresolved. History filters combine status, type and inclusive From/To dates. Static personal calendar examples no longer mask cancellation/expiry; own calendars use saved dates. Other-company/private colleague access remains unavailable.

Cancellation retains date history as Cancelled and releases charges/coverage. Employees can select all eligible dates or trim a subset; moving dates is cancellation followed by a new authoritative request/preview. Today/future are eligible, past is protected by company-local date; generated closures remain protected. Permanent history deletion is still admin-only. Past Pending dates expire individually on server access, including only the past portion of a mixed request. Expired dates cannot be approved/cancelled or consume/reserve/cover leave. Undated opening totals are not assigned invented expiry dates.

People uses one directory table. Employees see public directory fields only, with You, name/email/structure search and My team/My department/All organization filters. Relationship colours supplement team/department names and the legend, replacing the relationship column. Admins additionally see annual allocation/used/pending/available, recorded history and membership editing on that page. The old balance URL opens People; its separate navigation item is removed. Approval Requests explains a disabled effective setting without hiding other-scope or pre-existing assigned work. Shared secondary controls align consistently.

## Journeys: baseline → implemented experience

These are task-based actors, derived from the owner's brief and source/functional observations. No participant research, feelings or measured usability improvement is claimed.

| Stage and goal | Baseline friction | Implemented action and response | Recovery / handoff | Evidence and completion signal |
| --- | --- | --- | --- | --- |
| Employee checks leave and remaining amount | Saved list, reference history and balances separated | Open My Leave; annual summary first; expand details if needed; filter one saved all-years table | Loading/error distinguishes unavailable from empty; refresh/retry; invalid period names its fields | Component and browser checks; visible rows match saved dates/statuses, no separate reference history |
| Employee reduces a future request | No employee cancellation; admin permanent deletion was the only removal operation | Choose Cancel/modify, retain selected eligible dates to cancel, confirm; past dates remain unchanged | Server rechecks owner/company/date/status/provenance atomically; failed save retains selection; success refreshes history and balance | Service/HTTP/component/browser partial cancellation; only selected date becomes Cancelled and charge is restored |
| Employee cancels from a calendar | Saved detail said changes unavailable; reference entries could reappear | Select a date or own request; same cancellation control; close after server success | Native dialog Escape/focus return; private colleague request controls absent; reopening uses refreshed state | Browser calendar cancellation; no active calendar date for the cancelled request; original accounting restored |
| Pending request crosses midnight | Could remain actionable and reserve balance indefinitely | Next server access expires dates before company-local today | Future pending portion stays assigned; declined/approved history is preserved | Controlled-clock integration tests and offline migration/model checks; actual SQL scenario remains skipped |
| Employee locates self and related people | Separate relationship column, no scope filters | You marker; team/department label colours; scope and search | Empty/error/retry and no-team/no-department cases remain explicit | Browser checks You, team scope and absence of balance/private controls |
| Admin checks a person's balance/history | Separate balance page and personnel overview | Search People; read annual columns; open recorded history inline; edit membership in existing editor | Year load retains the actual loaded-year label; history opening receives focus and closing returns to its row | Browser desktop/mobile checks, legacy route and existing membership permission tests |

ASSUMPTION / usability hypothesis: consolidating related tasks reduces navigation effort. Validation so far is implementation and expert rendered inspection, not a measured user study. The smallest follow-up is an owner walkthrough of “check balance, cancel one date, find a teammate, inspect one employee's leave”; observe completion, mistaken actions and recovery. Baseline time/error rates and target thresholds are Unknown. No analytics installation or participant contact is implied.

## Fictional database history

`SeedData__Enabled=true SeedData__LeaveHistoryEnabled=true` explicitly adds fixed-date history to the disposable InMemory fixture. The SQL operator command `dotnet run --project api/tools/Vacate.Database --no-build -- seed-fictional-history` requires `VACATE_SQL_CONNECTION` for a known authorized demo target and the forward migration first.

The SQL import checks `IsDemo`, known fixture company/membership GUIDs, the recognized fictional opening source, current entitlement year, sufficient opening amounts, deterministic request keys and overlap. It converts up to two known used opening days per member to fixed August 2026 Approved dates, preserving used totals. Known October Pending opening examples become actual dated requests and then expire naturally on access. It skips already imported/changed/absent/incompatible cases without overwriting requests or resetting a database. Monthly/event reference examples are not converted into whole-day charges. InMemory repeatability/consumption/expiry tests pass; this is not actual SQL execution.

No SQL connection or local API settings was configured in this workspace. The database target/access question is pending; the live import has not run. Production data, legal policy and allowance generation are outside this refinement.

## Verification

- Frontend: 96 tests in 20 files passed; both TypeScript projects and production Angular build passed with the documented older-macOS flags.
- Backend: 86 integration tests plus 10 unit tests passed; 32 actual-SQL cases skipped, including new durable cancellation/expiry across scopes. Offline migration/model parity, incremental constraint SQL and legacy decline preservation passed.
- Real local Functions/API plus Chrome 150 / Node 22.22.3: new history/filter/balance, selected-date cancellation, calendar cancellation, accounting restoration, directory scopes/search/You, employee privacy, admin consolidation, legacy route and 1440/375/320px layouts passed. Created requests are deleted and sessions revoked in `finally`.
- Full existing functional browser regression passed on a separate fresh InMemory API: all 12 accounts/aliases, scope/visibility denial, saved leave, Back/Forward and direct URLs, retained balance expansion, balance zero/unknown states, type catalogue, profiles, organization edits, delegated settings, approval hierarchy, future-request cleanup, session recovery and focus/palette checks. Old static-history/link/amount assertions now exercise saved history and the consolidated surface. The zero-allocation render probe intercepts one local current-user response and restores the real response; it does not rewrite server data.
- Existing trusted native-keyboard regression passed: readiness rejects missing/untrusted input and overlays, Escape/focus return, shortlist/pinned selection/draft preservation, avatar menu/Settings. This verifies those existing journeys; new checkbox flows are functionally checked, not separately certified with trusted keyboard or a screen reader.
- Fixture, eligibility-contract, profile and organization scripts passed. OpenAPI YAML parses. Working-tree whitespace check passed. New/changed evidence links resolve; a pre-existing broken release-evidence link in `frontend/README.md` remains outside this refinement.
- Impeccable detector ran once on changed UI targets: three warnings in pre-existing global styles (Inter font and two thick accent borders); no finding in the new components. Existing identity/unrelated styling was preserved. This is not a WCAG conformance evaluation.

The browser check caught and fixed absolute screen-reader-label overflow within the history scroll region. Rendered refinement also corrected an oversized checkbox, title/close-button overlap, nested balance surfaces and inline-panel focus. Temporary test-host reload failures were isolated by running a copied API artifact; passing runs use that isolated host. Sandbox pipe/socket restrictions were rerun with approved escalation, separately from product failures.

## Remaining gates

Actual SQL migration, runtime execution and demo import require the selected database and access; the 32 skipped tests remain open. No live publication/release claim. Physical-device/screen-reader evaluation and owner acceptance remain separate. Existing shared-session SQL gates in VAC-42 are unchanged.


## Rendered examples

- [My Leave desktop](my-leave-collapsed-1440.png), [mobile collapsed](my-leave-collapsed-375.png), [320px expanded](my-leave-expanded-320.png).
- [Calendar cancellation](calendar-cancel-dates-375.png).
- [My team on mobile](people-my-team-375.png).
- [Admin balances/history desktop](people-admin-balances-history-1440.png), [320px](people-admin-balances-history-320.png).


Final verification: full functional regression and targeted seeded-history run passed after preserving inner balance expansion through the shared workspace state and eliminating duplicate balance-section IDs. The fixed October examples appear Expired and read-only in final captures, with future pending dates still cancellable. SQL pending scenarios use scoped controlled clocks; unrelated provider/session scenarios retain their normal clock. No actual SQL target was accessed.
