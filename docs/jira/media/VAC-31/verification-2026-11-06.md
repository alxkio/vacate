# VAC-31 local regression verification · 2026-11-06

Baseline: founder commit `4287fe5` on master, plus the uncommitted corrective changes described below. The pre-existing edit to `docs/next-up.md` was preserved. No commit, push, hosted CI run, deployment or live database change was performed in this verification.

## Failures reproduced and corrected

1. Seven backend integration cases failed and the real request preview was blocked. The request service relied only on the legacy policy-derived Allocation, which is null for fictional accounts whose policy floor is unknown even though an explicit CustomAllocation exists. Requests now use that explicit finite current-period allowance first, otherwise an evaluated policy amount; neither missing values nor other years receive an invented allowance. The legacy policy projection remains unchanged. Added a regression proving removal of the explicit allowance blocks submission again when policy remains unknown.
2. The focused HTTP negative-balance test supplied both a duration and the old range end date. The server correctly returned 400 before balance calculation. The test now clears the range end date for duration mode, with a separate assertion that contradictory mode fields are rejected.

## Checks actually executed

| Check | Result |
|---|---|
| Release solution build, no restore | Passed, zero warnings/errors |
| NUnit solution tests | 39 passed (29 integration/service, 10 unit); 18 SQL cases skipped |
| Angular application and test TypeScript projects | Both passed |
| Production Angular build | Passed |
| Complete Angular/Vitest suite | 16 files, 65 tests passed |
| Python script tests | 17 passed |
| Existing fixture/profile/organization/schema scripts | Passed; pre-existing Node module-format warnings only |
| Existing actual HTTP regression (`scripts/verify-api.py`) | Passed: 12 sessions, authorization/revocation, private projections, resource CRUD, UTC timestamps and deletion conflicts |
| Live API/frontend schema check (`API_CONTRACT_URL=... verify-api-contract.mjs`) | All 12 own account/membership responses passed |
| Complete built-Angular Chrome acceptance (`node frontend/verify.mjs`, default mode) | Passed, including trusted native input, keyboard/focus, 12 accounts, scopes/privacy, history, mobile/settings and the new leave journey |
| Focused actual HTTP leave checks (`scripts/verify-leave-requests.py`) | Passed: validation, foreign/unauthenticated denials, date exclusion, finite/negative guards, timezone settings, replay/key conflicts, concurrent overlap, UTC creation and exact calendar dates |
| EF `migrations has-pending-model-changes --no-build` | No pending model changes |
| OpenAPI/CI YAML parsing and corrective diff whitespace | Passed; unrelated whitespace in the founder's pending next-up notes was excluded and left unchanged |

The API used a disposable local InMemory host with explicit development authentication/seeding, Azure Functions Core Tools 4.16.0 and .NET 10. The globally installed older Core Tools must not be used for this project. Chrome 150 and Node 22.22.3 ran the default browser suite; no functional-only substitute or relaxed native-input assertions were used. Screenshots were written under `/private/tmp/vacate-vac31-20261106`.

Frontend build/test commands used the documented older-macOS settings `NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0`. Backend build/test used Release, no restore, disabled build servers and one MSBuild node.

## CI trigger finding

`.github/workflows/ci.yml` has `pull_request` and `workflow_call` triggers. A direct push to master therefore does not run CI. This matches the previously selected trigger-deduplication policy (VAC-38); the verification did not restore duplicate push/merge runs or change deployment policy.

## Remaining gates

The 18 SQL-provider cases were explicitly skipped because `VACATE_SQL_TEST_CONNECTION` was not configured to an authorized migrated target. EF model/migration consistency is not proof that the migration, database constraints, runtime grants, SQL rollback/replay or SQL concurrency work on the provider. Apply/review the forward migration and least-privilege grants and run those cases before declaring SQL/deployment readiness. Nothing was applied to the deployed database.

VAC-40 still owns the provider's incorrect 2027/2028 holiday responses; missing holiday data uses the accepted schedule-only fallback. Automatic statutory defaults/renewal, approval-decision/cancellation workflows and client timezone conversion remain outside this request-creation slice. No Done/Released claim or independent human acceptance is made.
