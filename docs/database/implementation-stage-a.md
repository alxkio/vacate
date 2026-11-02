# Stage A persistence implementation

Date: 2026-11-02 · [VAC-26](../jira/VAC-26-azure-sql-resource-persistence.md) · [accepted ADR-0004](../adr/0004-relational-persistence.md).

## Implemented boundary

EF Infrastructure row mappings and scoped repository/unit-of-work adapters implement existing Users/private profiles, Organizations/optional Departments/Teams, Memberships, SystemRoles, company JobRoles, shared WorkSchedules and period/allocation inputs plus read-time consumption from Leaves (the VAC-36 amendment replaces initial compatibility snapshots). Seven SQL sequences allocate positive internal IDs before construction; immutable public GUIDs and UTC lifecycle are preserved through typed domain restoration factories. No Domain EF dependency, new HTTP route or changed response schema.

The baseline migration and [reviewable idempotent forward SQL](migrations/0001-initial-resources.sql) also include DevelopmentProvisioningAccess solely for the existing opt-in fictional provisioning markers. It is not a production invitation/backoffice role implementation. The two fixed system roles retain current IDs/GUIDs; no accounts are seeded by migration. WorkSchedule/configuration references remain unchanged. Current fixtures have null calendar/policy IDs and the API rejects non-null values; a SQL null-only check preserves that boundary until reviewed reference catalogues exist.

Annual allowance/yearly history, policies, requests, ledger/carryover processing, invitations/production identity, notification and retention/erasure decisions remain outside this migration. Legacy CarryoverYears and current CustomAllocation snapshot semantics are preserved. No evaluated policy result is invented or written back as an allowance override.

## Runtime and transactions

Select `Persistence__Provider=SqlServer` and `ConnectionStrings__Vacate` explicitly; default remains InMemory. SQL configuration requires encryption and certificate validation. No migration, fictional import or paid fallback runs at host startup. Request services become scoped so each SQL unit of work owns one DbContext. A failed operation discards all tracked/mutated domain instances; rowversion/unique/FK conflicts map to existing conflict semantics without exposing SQL details.

Initial lock refinement: synchronous repository ports can traverse account and several organizations before a tenant is known. A transaction-owned exclusive `vacate:resource-use-cases` admission lock prevents cross-process write skew and tenant-lock ordering deadlocks, followed by transaction-owned company locks as organizations/memberships are resolved. This serializes unrelated companies' operations too; it is a deliberate conservative first implementation, not a throughput guarantee. Narrowing the admission lock later requires explicit tenant-aware ports and the same race tests, not removing checks. Direct external writers are still detected by rowversion/database constraints; privileged direct SQL can bypass application rules and is not runtime authority.

Private facts remain in a dependent table. Existing aggregate repository ports hydrate the full User aggregate internally, including its private dependent; application projection allowlists continue to exclude those facts from colleague/admin-colleague responses. Narrow private-read query ports are a later optimization, not a new permission or reliance on UI hiding. No sensitive payload logging is enabled.

ISessionStore stays process-local and development-only; this does not provide durable authentication or cross-worker session continuity. Development credential aliases/presentation use embedded opt-in fixture metadata, resolve actual users by stable GUID and cannot authenticate an arbitrary same-number SQL account. Development provisioning markers are durable only in SQL mode and ignored unless development authentication is enabled. No production permission derives from them.

## Operator commands and migration safety

`api/tools/Vacate.Database` is a tooling executable, not another application. `script` generates idempotent SQL without connecting. `inspect` reports table names/counts only. `migrate` requires an explicit VACATE_SQL_CONNECTION, rejects unknown migration history and refuses to baseline a nonempty unrelated database. It runs reviewed forward migrations only; no downgrade/reset command is exposed. Repeat migration applies no duplicate seeds.

`seed-fictional --empty-only` is a separate explicit import of all twelve existing fixture accounts/catalogues, only into empty resource tables. It refuses existing data rather than merging/overwriting. Fixture identities/lifecycle/balance values are preserved; sequence restarts only advance. Production credentials/session tokens are never copied. No export of ephemeral hosted memory state is claimed.

Example (the value is an Entra connection template, not a credential):

```sh
export VACATE_SQL_CONNECTION='Server=tcp:vacate-dev-srv.database.windows.net,1433;Database=vacate-dev-db;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;'
dotnet run --project api/tools/Vacate.Database --configuration Release -- script
dotnet run --project api/tools/Vacate.Database --configuration Release -- inspect
dotnet run --project api/tools/Vacate.Database --configuration Release -- migrate
```

The current dev server has public access Enabled and one all-IPv4 firewall rule, explicitly authorized by the user for initial app/VS Code/portal access. Entra-only authentication, scoped permissions and TLS remain enforced; no SQL password or paid network dependency is added. The SQL-only wrapper safely defaults to Disabled, so preserving the current route requires explicit publicNetworkAccess=Enabled. A future switch to Restricted must explicitly remove the open rule and use resolved allowlisted addresses. This development exception does not authorize broad access in another environment. Runtime application managed-identity database principal/permissions/network and cloud cutover were subsequently verified for the explicitly authorized development target; do not run the app as the migration administrator.

## Verification and recovery boundary

Use the existing NUnit projects and `VACATE_SQL_TEST_CONNECTION` for opt-in actual-SQL tests. Tests allocate unique synthetic organizations/users, operate through the real SQL adapters/application services, verify foreign-company denials, composite FK rejection, persistence across contexts, Unicode text/lifecycle, private projections, rollback, rowversion, username/membership uniqueness, precision rejection and concurrent last-admin protection. Cleanup removes only roots allocated by each test and their dependent rows; it never drops/recreates the database or clears unrelated tables. No SQL test pass is inferred from an ignored test or EF metadata inspection.

No real-data migration, production backup guarantee or application cutover is implied. The free database cannot be restored/copied into another free-tier database under the currently documented offer. No paid restore target is authorized. Before real-data/app cutover, agree recovery objectives, explicit fixture-vs-import choice and secure runtime principal/network. Before the authorized cutover the app used memory mode; the development API now uses SQL, and switching back after durable writes is not a lossless rollback.

Execution results and remaining gates are recorded in VAC-26 and its verification evidence. The frontend transport/views are unchanged because resource contracts/projections are preserved; actual HTTP/browser compatibility checks must still pass for the selected host mode.


## Authorized demo marker and import — 2026-11-02

Organizations.IsDemo is required SQL bit default false, internal metadata only; explicit fixture import sets true. Migration 20261101230540_OrganizationDemoMarker applied after the baseline, and repeated migration succeeded. All ten actual-SQL tests passed (including persistence of the marker through edits and foreign-company denial). Test roots were cleaned before explicit fixture import: twelve fictional users/memberships and one organization; that organization reads IsDemo=true. No production data imported or invitation sent. Public API/frontend schemas are unaffected.

Operator `grant-runtime NAME CLIENT_ID` binds a resolved managed identity using Azure SQL CREATE USER WITH SID/TYPE (client ID for service principals/managed identities), then grants only current table DML and ID-sequence permissions through a dedicated role. The runner verifies db_owner, CREATE TABLE, physical DELETE and migration-history UPDATE are unavailable. No Graph permission, SQL password, runtime DDL or automatic grants at app startup. Application use of those permissions must also pass live HTTP checks.


## Hosted cutover and cleanup — 2026-11-02

[VAC-35 post-cleanup evidence](../jira/media/VAC-35/verification-post-cleanup-2026-11-02.md) records the active Sweden Central managed-identity SQL API, real restart persistence, hosted HTTP/schema/functional browser checks, minimum diagnostics/storage and retired old backend. The user explicitly selected initial-development public IPv4 access with Entra-only/TLS for app/VS Code/portal use; no production network exception or paid SQL/Defender/network feature. Native/default browser reliability remains VAC-15 QA. Operator wrappers now live in infra/deployments; SQL-only public networking is explicit and disabled by default. No automatic memory fallback is used after SQL errors/exhaustion.

## Derived consumption replacement — 2026-11-02

The product lead explicitly selected immediate replacement under [VAC-36](../jira/VAC-36-derived-balances-from-leaves.md). [Derived mapping and migration](derived-leave-balances.md) supersedes earlier snapshot descriptions in Stage A evidence. Runtime Leaves access is SELECT only; consumption/remaining totals are derived. Forward migration preserves allocation edits and converts only verified fictional quantities into explicitly labeled undated openings. No actual request history is fabricated. Verification of this amendment is recorded separately from the earlier ten-provider-test run.
