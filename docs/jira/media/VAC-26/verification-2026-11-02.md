# VAC-26 Stage A execution evidence

Date: 2026-11-02 (Europe/Athens; command logs use UTC, including 2026-11-01) · Operator: Codex under explicit product-lead continuation after ADR-0004 acceptance.

## Exact target and applied change

Existing Azure SQL database: `/subscriptions/07d79495-1f4f-40fd-9fdf-84605214e5e6/resourceGroups/rg-vacate-dev/providers/Microsoft.Sql/servers/vacate-dev-srv/databases/vacate-dev-db` (Sweden Central). No new Azure resource, paid feature, Function App configuration or cloud application deployment was made by this implementation step.

Applied EF migration `20261101223127_InitialResources` using the explicit operator tool and existing Entra administrator, with encrypted SQL and certificate validation. Reviewed [forward SQL](../../../database/migrations/0001-initial-resources.sql) creates eleven Stage A/compatibility tables, seven positive noncycling sequences, constraints/indexes and two fixed system roles. EF creates its migration-history table. Running `migrate` a second time succeeded without duplicate roles/migration records. No downgrade/reset or future-feature migration was executed. Fictional fixture import was not run.

## Provider verification

All nine opt-in `SqlPersistenceTests` passed against the actual target (NUnit reported total 1.1389 minutes for this test command):

- New scoped context retains edited resource values, Greek/Nordic text and UTC lifecycle.
- Foreign-company reads and relationship edits are denied without mutation.
- Colleague projection excludes private-profile fields.
- Injected failure rolls back mutation and discards tracked aggregates.
- Composite SQL FK rejects a foreign-company team reference.
- Independent stale rowversion write fails.
- Concurrent admin disables cannot remove both active administrators.
- SQL rejects duplicate global username and multiple active memberships.
- Unrepresentable service precision is rejected atomically.

Tests use unique synthetic tenant roots and remove only their own dependent rows. Final inspection: `__EFMigrationsHistory=1`, `SystemRoles=2`; Users, UserPrivateProfiles, Organizations, Departments, Teams, Memberships, MembershipBalanceSnapshots, JobRoles, WorkSchedules and DevelopmentProvisioningAccess all have zero rows. No employee data or session/token material was imported.

## Build and HTTP verification

- Release solution build: passed, zero warnings/errors.
- C# whitespace formatting: passed.
- EF pending-model check: no changes; generated model and migration match.
- Existing NUnit baseline: 18 integration and 10 unit tests passed; nine SQL tests were initially ignored without an explicit connection and were then separately run successfully as above.
- `scripts/verify-api.py`: passed actual Functions HTTP acceptance for all twelve sessions, authorization/revocation, private projections, resource CRUD, timestamps and deletion conflicts.
- `frontend/verify-api-contract.mjs`: passed fixture/storage identities, public examples and all twelve live HTTP projections against JSON Schema.
- HTTP checks used explicit opt-in fictional data in default InMemory mode; no SQL-host HTTP, browser or hosted API restart/cutover result is claimed. Frontend files/routes/views are unchanged because API contracts remain compatible.
- The first local HTTP attempt used obsolete system Core Tools 4.0.4483 and exposed no functions (404); after using the already installed Core Tools 4.16.0, both checks passed. No repository workaround or paid dependency was introduced.

## Cost and security readback after execution

Read back actual Azure properties after migration/tests and network cleanup ([sanitized readback](sql-readback-2026-11-02.json)):

| Control | Actual value |
|---|---|
| SKU | GP_S_Gen5 / GeneralPurpose / serverless, 2 vCores |
| Free limit | `useFreeLimit=true` |
| Exhaustion behavior | `AutoPause` |
| Data maximum | 34,359,738,368 bytes (32 GiB) |
| Backup redundancy | Local |
| Collation | `Latin1_General_100_CI_AS_SC_UTF8` |
| Server TLS minimum | 1.2 |
| Public network access | Disabled |
| Firewall rules | Empty array |

A resolved single operator-IP firewall rule existed only for the migration/test window. Azure requires enabling the public interface before creating/deleting its firewall rules; there were no rules when it was enabled. Exit cleanup deleted the narrow rule and disabled public access. No unrestricted Azure-services rule, password credential, runtime administrator connection, private endpoint, Defender plan or monitoring ingestion was introduced. No permanent application network route was opened.

The existing free offer provides 100,000 vCore seconds, 32 GB data and 32 GB backup storage monthly. AutoPause accepts downtime after monthly allowance exhaustion until renewal; no BillOverUsage/paid fallback is authorized. Storage/retention controls and source links remain in [VAC-34 evidence](../VAC-34/verification-sweden-central-2026-11-01.md) and the [SQL runbook](../../../database/azure-sql-operations.md). These controls were not changed by schema execution.

## Remaining gates

VAC-26 remains In progress: hosted application connection principal with least-privilege grants, a verified narrow runtime network route, explicit fixture-vs-import choice, hosted restart/HTTP/browser acceptance, and zero-cost recovery/rollback decisions remain outstanding. Existing app services/settings are unchanged and mode stays InMemory. No paid restore/copy target is authorized. Global admission locking conservatively serializes resource transactions across companies; internal full-User hydration includes private dependent rows while response allowlists protect projections. No throughput or independent release-review claim is made.

No commit, push or merge. Human actual and total assistant duration were not measured; the test-command elapsed measurement above is automation time only.
