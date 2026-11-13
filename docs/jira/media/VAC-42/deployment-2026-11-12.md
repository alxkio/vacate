# VAC-42 development release · 2026-11-12

## Revision and target

- Implementation commit: `cd9cd02ef8124dc180853fb7a20a065b6b2c896c`, branch `VAC-42-page-design-refinement`.
- [PR #4](https://github.com/alxkio/vacate/pull/4), merged into master as `94653183506398a757cc289c0d57e4dd69216a1e` after all PR checks passed.
- [PR CI 43215651701](https://github.com/alxkio/vacate/actions/runs/43215651701): backend, frontend and full paired API/browser jobs passed, including native keyboard checks.
- [Preview 43216685005](https://github.com/alxkio/vacate/actions/runs/43216685005): `environment=dev`, `apply=false`, `deploy_backend=true`; passed for merged revision `9465318`. Reviewed what-if: six existing resources modified, four unchanged, three ignored; no resources created/deleted and SQL provisioning untouched. This does not claim every reported metadata/default change was an actual change.
- [Full deployment 43217227468](https://github.com/alxkio/vacate/actions/runs/43217227468): `environment=dev`, `apply=true`, `deploy_backend=true`; all jobs passed for the same merged revision.
- [Dev web](https://lemon-beach-02f7a7103.4.azurestaticapps.net), [sign-in](https://lemon-beach-02f7a7103.4.azurestaticapps.net/login.html), [API health](https://vacate-dev-sc-wv5pdctnrzamu-api.azurewebsites.net/api/health).
- Existing resource group `rg-vacate-dev`, regional backend Sweden Central; existing SQL target `vacate-dev-srv` / `vacate-dev-db`. No new environment, paid fallback or SQL provisioning change was introduced.

## Verified release order

The deployment rebuilt the merged commit and passed infrastructure compilation, frontend/backend checks and complete paired API/browser acceptance before its environment-serialized release stage. Backend CI reported 10 unit tests and 48 integration/offline tests passed; 18 opt-in actual-SQL regression cases remained skipped.

Infrastructure validation/apply passed. The mandatory database step then passed before either application publication:

- `2026-11-12T12:29:56Z` (14:29:56 Europe/Athens): SQL availability verified; migration-history checks began.
- `2026-11-12T12:30:02Z` (14:30:02 Europe/Athens): migration `20261105214614_LeaveRequestSubmission` and runtime access to all mapped columns verified. The operator's successful deployment command includes runtime grant/least-privilege verification. This release introduces no migration source changes.
- API publication passed after the database gate; Angular publication completed at approximately `12:31:11Z` (14:31:11 Europe/Athens).
- Hosted endpoint verification passed, including web/API revision match, configured API origin, assets/deep links/cache headers, allowed/denied CORS, fictional own-membership and leave-request reads, and ephemeral session revocation.

The SQL check is a real schema/grant/read verification, not a complete SQL constraints/concurrency/tenant-isolation test run. The 18 skipped cases remain open. `/api/health` alone is liveness-only.

## Post-deployment checks

Independent `scripts/cloud-smoke.py --development-database` passed against the named web/API URLs and exact revision after one initial read timeout. This rechecked revision/configuration, route/asset/cache/CORS behavior and fictional database-backed reads without resource writes.

The first broader hosted Chrome check timed out waiting for the calendar after sign-in. A subsequent diagnostic run passed sign-in and rendered the calendar; session, organization summary, roles/memberships, saved requests and saved calendar reads returned HTTP 200. No JavaScript exceptions were reported. The browser's canceled-navigation requests are not classified as server errors. The initial timeout's cause remains **UNVERIFIED**; no claim of a proven cold-start cause or timing fix is made. The full hosted mobile/focus walkthrough did not complete on that initial attempt; the complete paired native-input suite and targeted mobile/focus checks passed locally/in CI as recorded separately.

[Rendered deployed calendar](hosted-calendar-desktop.png) shows the published development revision. The diagnostic check submitted no profile, organization, membership or leave changes; sign-in created a process-local development session. No tokens, credentials or private response bodies were retained in the evidence.

## Documentation boundary

This release-evidence update changes only documentation and issue status. The deployed application revision remains `94653183506398a757cc289c0d57e4dd69216a1e`; a later documentation commit does not imply a new application publication. No runtime source, migration, workflow or infrastructure files are changed by this evidence update.

## Authorization and work log

The product lead authorized branch commit, merge and deployment on 2026-11-12. Earlier no-commit/deploy statements describe the initial review boundary and were superseded for VAC-42 by that instruction. Assistant duration: unmeasured; human actual: Unknown. GitHub job timestamps are execution evidence, not inferred working hours. Staging/production, production identity, screen-reader conformance and unrelated policy/lifecycle scope remain unverified or deferred.
