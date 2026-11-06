# VAC-31 request creation verification · 2026-11-05

QA scope: current request-creation slice F-1–F-32 and organization timezone configuration. Approval decision/cancellation workflows, automatic entitlement renewal/expiry and client-timezone conversion remain deferred. This record concerns the uncommitted implementation; it does not establish a release or production readiness.

## Acceptance coverage and execution

| Check | Coverage | Result |
|---|---|---|
| `scripts/verify-leave-requests.py` | Actual HTTP own/foreign/unauthenticated access, inclusive working-day range/duration, Sunday exclusion, finite/negative balance rejection, malformed/tampered fields, actual UTC timestamp, concurrent identical retries, conflicting key, concurrent partial/full overlap, saved dates/calendar projection | Added; execution pending disposable seeded Functions host |
| `MOCK_LEAVE_ONLY=1 node frontend/verify.mjs` | Built Angular against real API: selected-type balance, Sunday warning/exclusion, duration end, disabled Hours with hidden end/duration, negative/missing period/zero-day guards, save and full-overlap acknowledgement | Added; execution pending build and API |
| Existing complete `frontend/verify.mjs` | Existing privacy, account/history isolation, reference catalogue, native keyboard, responsive layouts and settings regressions; obsolete demo-only form assertions updated for real request flow | Execution pending |
| Python compile / Node syntax | New HTTP harness and modified browser harness parse | Passed |
| Backend deterministic cases | Holiday/six-day schedules, allocation boundaries, mixed approval states, organization-local today, carryover attribution/cutoff, cancelled/rejected coverage | Backend-owned; results pending |
| SQL persistence | Forward migration, included dates/provenance, transaction concurrency/replay, period/year calculations and tenant isolation | Not executed; authorized migrated test target required |

The HTTP script deliberately accepts only loopback URLs. It adds fictional dates to a disposable host and requires a fresh seed state; restart the InMemory host afterward. It must not be pointed at a deployed environment. The browser harness's focused journey may acknowledge pre-existing matching dates on reruns; fresh-state HTTP checks independently verify actual creation and charges.

## Review focus

- A pending date covers overlap but does not consume remaining balance; projected charging is distinct from allocation and Used/Pending totals remain derived.
- Server recomputes the selection, amount, entitlement attribution and authorization. Identical transport retries cannot create a second request; changed drafts cannot reuse the same key.
- Zero working days blocks. Fully covered working dates acknowledge without new records, preserving type/status. Partial overlap never extends a range to replace covered days.
- Unknown selected-type/year entitlement blocks rather than granting a fabricated quota. Explicit yearly entitlements must preserve legacy consumption attribution.
- Date-only values retain calendar dates. Server UTC timestamps and organization-local today are distinct. Existing frontend local display remains unchanged.

## Remaining limits

No deployment, SQL target, native browser pass, independent human review or complete-slice acceptance is claimed until actual execution evidence is recorded below. Missing holiday coverage explicitly falls back to company weekdays; the blocked external holiday import is tracked separately under VAC-40.


## Subsequent execution

The pending checks above describe the 2026-11-05 baseline. See [2026-11-06 verification](verification-2026-11-06.md) for the subsequent committed-baseline failures, corrective changes and actual local execution results. SQL-provider gates remain unexecuted.
