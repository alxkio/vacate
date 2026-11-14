# Database-owned test organization

Product lead direction, 2026-11-14, under VAC-42: persist test-company facts in SQL and remove runtime fixture fallbacks. Accepted ADR-0003/0004 remain the architecture/persistence authority. This is fictional development data, not a statutory entitlement calculation or production identity rollout.

SQL owns the organization/test marker, employees, employment dates, reporting relationships, prior service, structure/settings, explicit development login allowlist, entitlement inputs and dated requests. Balances remain derived from leave rows; do not persist replacement Used/Pending/Available totals. PriorServiceYears is experience before the current employer, with explicit zero distinguished from unknown.

The member workspace endpoint supplies current structure/directory and privacy-safe away dates. The frontend preserves public GUIDs, consumes saved own leave separately and never generates colleague absences. Names, lead labels, account hints and groups come from stored records. Provisional catalogue descriptions/rules are code/reference material, not stored employee facts. Browser display preferences retain their accepted per-browser behavior.

`DevelopmentLogins` is an explicit operator-owned allowlist. IsDemo is an additional boundary, not a login grant by itself. No passwords are persisted. SQL mode never instantiates InMemoryDatabase or loads the embedded fictional roster. The SQL seeder and its empty-database bootstrap command are removed. Deterministic InMemory setup and the roster live under `api/testing/`, compiled only into automated tests or an explicit non-publishable test build. Default API/Infrastructure assemblies contain neither the fixture loader nor its JSON resource. Frontend company/leave fixtures live only under `frontend/testing/`.

## Cutover order

1. Review/apply the forward DatabaseDevelopmentLogins migration and runtime read grant against the designated existing dev database. The migration contains schema only and leaves existing business rows untouched.
2. Populate the explicit login allowlist for the already-public test users through an authorized database operation. Include any required legacy login aliases as non-advertised rows. Do not overwrite another account's alias, restore an intentionally disabled login or enable users from an unmarked tenant. Verify the allowlist before publishing the new API; an empty allowlist deliberately means no SQL development sign-in.

   Full dev deployment sets `VACATE_REQUIRE_DEVELOPMENT_LOGINS=true`. After schema/grant verification, the operator requires an active advertised enabled login in an active marked test tenant before either application publication. An empty allowlist stops the deployment with an explicit provisioning instruction; it never silently creates users/logins or publishes an unusable sign-in. Populate the rows through the separate authorized database operation, then rerun the deployment. Other environments do not enable development authentication or this dev-only prerequisite.
3. Apply the separately reviewed test-company data update, if selected. Preview the plan and keep it scoped to the exact existing marked tenant/members. Use the application's transaction admission lock, validate all changes before commit and preserve existing employee-created requests. Only positively identified synthetic opening/example records may be converted into dated history. Record occurrence dates separately from current UTC import/decision timestamps. Replays must add no duplicate requests or restore subsequently cancelled dates.
4. Publish matching API/frontend revisions and verify all public test users, role changes, renamed/reassigned groups, own balances/history and shared availability. Check employee/foreign-company denials and perform an independent SQL readback/replay. Builds or InMemory checks are not SQL evidence.

The requested company scenario has one owner/root without a manager; everyone else reports through stored leads/managers. It supplies hire dates and prior service, fixed 2025/2026 history, staggered two-week July/August blocks and smaller breaks elsewhere, aiming for 5–9 current-year days remaining against the existing configured allowances. Existing requests and stored holiday exclusions take precedence; conflicting consumption requires review rather than overwrite. Historical quotas are explicitly fictional inputs, not inferred Greek legal entitlements. ASSUMPTION: Daria remains the existing owner/root; Nora remains HR/operations, and the scenario covers both 2025 and 2026. These choices await product-lead feedback and are not domain policy.

The fixed-date history seeder, its startup flag, operator command and deployment checkbox are retired. Earlier deployment evidence remains historical evidence; no application deployment refreshes business test data.

## Verification boundary

Local tests cover API projection/tenant isolation, canonical identities, fixture-free SQL registration, live client projections and failure/session handling. Actual SQL allowlist reads, the one-time data operation, replay/rollback and publication require separately recorded execution evidence. No database write or new hosted deployment is established by this document.

## Explicit data scripts

The versioned [2026-11-14 Northstar update](data/2026-11-14-northstar-refresh.sql) contains the prepared employment/history/login correction for the existing twelve-member company. It is not a new-company bootstrap: it refuses a missing or changed tenant, validates known identities, and preserves employee-created requests. `@Apply = 0` is the default and rolls the transaction back after showing the plan. Review that output before explicitly selecting `@Apply = 1` for the same named dev target. Actual SQL execution and idempotence remain UNVERIFIED; checking this file into source control does not execute it.

Use an approved SQL client with the operator identity to connect directly to `vacate-dev-srv.database.windows.net` / `vacate-dev-db`, open the script and run the complete batch. Apply the schema migration and runtime grants first, as described above. Do not run fragments separately, run it as part of EF migrations, or add it to application/deployment startup. The script checks the database name, exact marked company and member identities, and takes the same transaction lock as resource writes.

For a future test organization, add a separately reviewed SQL script with explicit company identity, structure, employees, login grants and dated requests. Use new public GUIDs, server UTC lifecycle values and a transaction; validate the target and make replays preserve existing edits. Keep mandatory schema/reference-data migrations applicable to every environment separate from opt-in test-company records. Do not recreate an application seeder or a general scenario generator for these occasional operations.

See [test tooling](../../api/testing/README.md) for the disposable InMemory host used by CI and local browser acceptance. Ordinary InMemory hosting starts empty and has no development login provider; existing SQL sign-in still reads the explicit allowlist.
