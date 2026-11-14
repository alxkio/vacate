# Shared SQL sessions · 2026-11-13

Owner authorization: after reviewing the storage, migration, revocation and verification requirements, the owner instructed “go on do it”. This extends the existing [VAC-42 refinement subtask](../../VAC-42-implemented-page-design-review.md#page-outline-and-session-recovery-subtask--2026-11-13), with no new story. The [ADR-0004 amendment](../../../adr/0004-relational-persistence.md#product-lead-amendment--shared-sessions--2026-11-13) and [product charter](../../../product/product-charter.md#session-and-page-focus-refinement--2026-11-13) record acceptance. Branch: `VAC-42-page-session-recovery`; prior browser recovery/lifetime revision: `6a714d4`.

## Behavior and ownership

SqlServer mode selects a scoped `SqlSessionStore` through the existing `ISessionStore` port. InMemory remains process-local for disposable fictional development. The same SQL target stores account-keyed `ApiSessions`: SHA-256 hash of a random 32-byte opaque ticket, UserId, CreatedAt and ExpiresAt. Raw tickets and passwords are never persisted. No tenant/role claims are cached; current application authorization still resolves the account and membership.

The 30-minute absolute lifetime is unchanged. Resolution rejects expiry at the exact boundary. Logout revokes only the chosen ticket in the same unit of work as validation; disable/delete revokes every ticket for that account in the account mutation transaction. Failed mutations roll back their session deletes. SQL storage exceptions propagate rather than becoming a false 401. Existing browser recovery retains the ticket on server/network failure and retries without credentials.

Expired tickets never authenticate. Successful sign-in reclaims up to 100 expired rows; without further sign-ins, expired hashes can remain stored. This bounded cleanup is not a general personal-data retention policy. The immutable table permits runtime SELECT/INSERT/DELETE, with UPDATE explicitly checked unavailable. No extra Azure service, paid resource, activity renewal, refresh token or production identity is introduced.

Frontend calls and payloads are unaffected by this adapter: the recovery UI and sanitized return navigation are already implemented and verified in the [preceding evidence](page-session-recovery-2026-11-13.md). API contract descriptions are coordinated with backend storage behavior; no new endpoint is needed.

## Migration and cutover

`20261113214204_SharedApiSessions` adds the table, UTC/hash/expiry checks, account FK and user/expiry indexes. Review [0005 forward SQL](../../../database/migrations/0005-shared-api-sessions.sql). The existing [database-first gate](../../../database/deployment.md) applies migrations, refreshes limited runtime permissions and compiles mapped-column reads before publication. No migration or grant has been applied by this work.

The table addition is compatible with the old API. Memory tickets cannot be imported, so users need one fresh sign-in after upgrading. During mixed-version publication, old instances cannot resolve SQL tickets; continuity applies between upgraded instances using the same database. The API never falls back to memory when SQL fails. No merge or deployment is included here.

## Verification

Verification on 2026-11-14, Intel macOS / .NET 10:

- Complete backend suite: **79 integration tests passed, 31 actual-SQL cases skipped; 10 unit tests passed**. This includes the existing controlled-clock 30-minute HTTP scenarios and the new storage-failure propagation check.
- Offline SQL adapter/DI selection, immutable hash-only model, account FK/indexes, incremental idempotent migration generation and exact checked-in script comparison passed. EF reported no pending model changes. Tool build passed without warnings/errors.
- Database release-order/artifact checks: **3 passed**. Changed-file formatting, whitespace, local Markdown links and OpenAPI YAML parsing passed. An initial account-deletion test compile error was corrected before the passing run.
- Real local Functions HTTP checks passed across all twelve fictional accounts: bearer/revocation, private projections, resource operations, timestamps and deletion conflicts. This host uses InMemory; it does not execute the SQL adapter.
- Focused browser reconnection passed on Chrome 150.0.7871.125 / Node 22.22.3: current-user/summary and Settings failures retain tickets, retry recovers the prior page without credentials, definitive 401 preserves sign-in navigation, and captured test sessions are revoked. This checks the existing UI against the updated InMemory API, not SQL restart continuity.
- QA supplied independent persistence/security scenarios and identified the tracked-ticket edge case: bulk revocation must also cancel an unsaved ticket created earlier in the same transaction. The adapter now discards matching tracked tickets and has an opt-in SQL regression. Root reviewed the final implementation and ran checks; no completed final independent release approval is claimed.

No `VACATE_SQL_TEST_CONNECTION` is configured. No hosted credential or unrelated database has been used. The six new opt-in SQL cases cover separate providers/scopes and recreation, exact expiry/selected logout/all-user revocation, disabling rollback/commit/re-enable, deletion, concurrent sign-in versus disable and revoking newly issued tickets before commit. They are among the **31 skipped cases**, not SQL passes. SQL execution, runtime principal grants, restart/instance continuity and hosted recovery remain verification gates.

New opt-in SQL scenarios allocate synthetic tenants/accounts, preserve foreign-company isolation and remove only their own rows—including sessions—in teardown. Existing unrelated `docs/review-43.md` is preserved. Assistant work unmeasured; human actual Unknown.
