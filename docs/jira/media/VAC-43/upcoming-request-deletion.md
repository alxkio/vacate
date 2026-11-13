# Future-request acceptance and administrator deletion follow-up

2026-11-13 · Baseline `b46e22b` on `VAC-43-admin-functionality` / PR #6. This follows the owner's reported `leah own upcoming entries` CI failure, request to create real future leave instead of asserting October fixtures, explicit teardown requirement and choice of **Administrators only** for permanent deletion.

## Behavior and ownership

`DELETE /api/organizations/{companyId}/leave/requests/{requestId}` permanently removes a personal request and its dated charge rows in one unit of work. Only a current active administrator in that company can delete; provisioning-only grants, employees, foreign companies and unknown IDs are denied. Generated closure leave is protected. Approved/pending consumption is released without changing imported opening consumption or other requests/companies. Repeated delete returns 404 without a second balance adjustment. This real API operation adds no frontend deletion button or test-only reset endpoint.

The owning contract is [API deletion](../../../contracts/api.md#permanent-personal-request-deletion--owner-decision--2026-11-13); [owner decision](../../../product/product-charter.md#owner-decision--permanent-personal-request-deletion--2026-11-13) and existing VAC-31/VAC-42 subtasks record authorization. Request creation/deletion is not a GDPR erasure assertion. The removed request's submission key can create a new request on later submission; a retained covered-only acknowledgment whose dates have become uncovered returns 409 and requires a new submission key.

## Test journey and teardown

`frontend/testing/upcoming-acceptance.mjs` chooses an available future working date via server preview, submits through the real Angular form, confirms a new server GUID absent from the baseline, reloads, checks the upcoming card/calendar/details at desktop and mobile sizes, then verifies another employee's own view does not disclose it. It does not reproduce the app's upcoming filter, move the clock or claim fixed October examples are future leave.

In `finally`, Node-side HTTP cleanup uses an administrator session to remove newly created personal test requests for that selected date. Before mutation it snapshots the employee's requests, calendar and used/pending/available balance. After deletion it checks exact baseline restoration, preserving existing records. It attempts all discovered deletions, aggregates cleanup errors, and revokes/verifies all captured test sessions. Any cleanup error fails acceptance, including when an earlier browser assertion also failed. Tests require a loopback API, fictional seed identity and finite configured annual allowance for the selected future year. Use disposable data; the harness cannot infer whether a local API points to a shared SQL database. Cleanup verification is currently InMemory; SQL behavior remains a separate provider gate.

`MOCK_UPCOMING_TEARDOWN_ONLY=1` injects a deliberate error at the first post-save screenshot after the record has been reloaded/rendered. It succeeds only if that exact error survives successful cleanup; an AggregateError from failed cleanup is not accepted. Recovery immediately after an unacknowledged server commit is supported by baseline/new-date discovery in source but is not a separately fault-injected runtime claim. Tests run serially per fictional employee.

## Verification

- API build: passed, zero warnings/errors.
- Integration suite: **72 passed, 25 SQL-provider cases skipped, zero failures**, including new approved/pending/mixed/declined deletion, role revocation/provisioning grants, cross-company/unknown/anonymous requests, closure protection, carryover/opening preservation, unrelated-record preservation, stale covered receipts and repeated deletion.
- Database deployment script checks: **3 passed**.
- Real future-request browser journey: **passed**, including permanent administrator cleanup, exact request/calendar snapshots, balance restoration and session revocation.
- Deliberate post-save failure browser journey: **passed**, proving cleanup completes on assertion failure.
- Complete functional browser rerun: pending at report creation; final result appended below. Native suite is unchanged and is not rerun or implied by functional mode.
- Node syntax, Prettier and changed-file whitespace checks: passed.
- Independent QA reviewed permissions and teardown, prompting stronger preservation and restoration assertions. No further confirmed production defect in that review.

Commands from repository root (Node path may vary):

```sh
dotnet build api/src/Vacate.Api --no-restore -m:1 -nr:false
dotnet test api/tests/Vacate.IntegrationTests --no-restore -m:1 -nr:false
python3 scripts/test_database_deployment.py
MOCK_UPCOMING_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 node frontend/verify.mjs
MOCK_UPCOMING_TEARDOWN_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 node frontend/verify.mjs
MOCK_FUNCTIONAL_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 node frontend/verify.mjs
```

Local environment: .NET 10, Core Tools 4.16.0, Node 22.22.3, Chrome 150.0.7871.125 on Intel macOS. API explicitly used fictional seeded InMemory persistence. Actual SQL hard deletion, concurrent deletion and runtime grants remain unverified: five new provider cases were added to the existing skips, making 25. No schema migration is required for deletion. The operator must refresh runtime permissions for DELETE on `Leaves` and `LeaveRequests` before a SQL-backed API uses it; other table DELETE permissions remain denied. No grant, migration, deployment or merge was performed.

The initial cross-period test failed because its fictional organization had no country while the assertion required GR carryover. The test now explicitly configures GR; production carryover behavior was preserved. Early full functional attempts exposed account-dialog/balance/form readiness races; shared click helpers now await completed router transitions and request-form rendering, preserving the existing assertions. The focused account-switch/Back/Forward and Calendar → My Leave → Balances history suite passed after this refinement. The full twelve-account roster/privacy/eligibility loop also passed. The focused organization/workweek/structure/membership persistence journey passed after replacing its retired `.org-membership-roster` selector with the implemented People table. Stale directory assertions now count rows separately from admin edit controls, and approvals now expect the implemented assigned inbox rather than the retired unavailable placeholder. Cleanup uses the accepted real DELETE operation; no database-reset endpoint or test-only write fallback was added.

## Rendered evidence

- [Desktop upcoming request](saved-future-upcoming-1440.png)
- [Mobile upcoming request](saved-future-upcoming-375.png)
- [Mobile saved-request details](saved-future-request-details-mobile.png)

Assistant implementation/review time: unmeasured; human actual: Unknown. Shared test results are recorded here once, not rolled up across related stories.
