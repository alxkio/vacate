# Database deployment

Accepted by the founder on 2026-11-06 after the VAC-31 hosted invalid-column incident. [VAC-41](../jira/VAC-41-database-deployment-gate.md) implements this process under [ADR-0004](../adr/0004-relational-persistence.md). This acceptance authorizes implementation of the release process; it is not evidence of a completed hosted migration or new deployment.

## Release order

The existing **Deploy Azure** workflow builds and tests the selected commit, prepares infrastructure, deploys and verifies its database, publishes the API, publishes Angular, then runs HTTP smoke checks. One environment lock spans infrastructure, database and both application publications; cancellation does not interrupt an active release. Build checks can run independently before that lock.

Every full deployment to a SQL-backed environment runs the database stage. EF migration history makes an already-current schema a no-op, while runtime grants and schema reads are checked again. There is no optional database checkbox or changed-file heuristic. Preview (`apply=false`), frontend-only (`deploy_backend=false`) and InMemory environments do not mutate the database. SQL infrastructure provisioning remains separate: the application workflow expects the designated database to exist and never creates a paid replacement or changes firewall rules to recover connectivity.

CI publishes a `database-package` artifact alongside the API and frontend packages from the same workflow run. It contains the operator executable, generated idempotent `migrations.sql` for review and `revision.txt`. Deployment verifies both the artifact revision file and the operator's embedded assembly revision against the release commit. Review the migration source/generated SQL before dispatching an apply; there is no automatic human approval claim.

The `deploy RUNTIME_NAME RUNTIME_CLIENT_ID` operator command:

1. Validates the SQL connection against the hostname/database output by the selected Bicep deployment, requires certificate-verified TLS and a separate Entra migration service principal, and checks the executable revision before opening a connection.
2. Rejects unknown migration history and an unrelated nonempty database, then applies forward migrations only.
3. Refreshes runtime table/sequence grants for the resolved managed identity and verifies its limited permission boundary, including request inserts.
4. Requires no remaining migrations and compiles reads of every mapped column while impersonating the runtime principal. `TOP (0)` reads return no business records.

Any failure blocks both application publications. If migrations succeeded but grants or schema verification fail, the schema changes remain applied; repair permissions or add a forward correction and retry. No automatic `Down`, reset, fictional import, entitlement configuration or holiday seeding runs during deployment. Migration history checks do not detect every kind of manual schema drift; mapped-column reads catch missing objects/columns, not every altered constraint or unexpected data value.

## Migration credential setup

An administrator must provision a dedicated Entra service principal as a database user on the designated database, with the reviewed schema/data migration, runtime-principal grant and impersonation permissions required by the operator. Azure Contributor access alone does not establish SQL access. Use a different application/client ID from the runtime managed identity. The migration credential must never be placed in API app settings or the application package. Provisioning this identity and granting database authority require a separately authorized administrative action; this implementation does not do either.

Set the GitHub Actions repository secret for the selected environment: `AZURE_SQL_MIGRATION_CONNECTION_DEV`, `AZURE_SQL_MIGRATION_CONNECTION_STAGING` or `AZURE_SQL_MIGRATION_CONNECTION_PROD`. GitHub secret lookup is case-insensitive. Use this template, substituting the actual target, migration application ID and secret:

```text
Server=tcp:vacate-dev-srv.database.windows.net,1433;Database=vacate-dev-db;Authentication=Active Directory Service Principal;User Id=<migration-application-client-id>;Password=<migration-client-secret>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=90;
```

The connection is passed only to the database step as `VACATE_SQL_CONNECTION`, never as a command argument or log entry. Missing credentials, wrong targets, runtime-identity reuse and SQL-password authentication fail deployment. Other environments require their own matching connection and existing SQL target. Rotate expiring client secrets through the same repository secret. Keep the migration identity's elevated database authority separate from the API's limited runtime permissions.

## Compatibility and failure recovery

Database changes run while the previous API may still serve requests. Add compatible columns/tables first, deploy code that uses them, and remove obsolete structures only in a later reviewed release after all callers stop using them. Renames, new required fields and data transformations need an explicit compatibility plan; database-first ordering alone cannot make a breaking migration safe. Review blocking/locking effects and the applicable recovery plan before applying data-bearing migrations.

If application publication fails, retain compatible schema additions and redeploy a compatible application revision. The existing tool rejects migration history newer than its own; rebuilding the forward-compatible release or preparing a reviewed recovery release is required rather than using an older operator to downgrade the schema. There is no atomic transaction across schema, grants, API and frontend delivery. Existing free-database recovery and zero-incremental-cost constraints remain in force; no paid backup/restore target is authorized by this workflow.

## Verification

Offline tests cover target/identity/TLS rejection, principal validation, release ordering, artifact binding and smoke-check failure handling. Full dev SQL deployments additionally sign in as the existing fictional `nora` account, read its own membership and leave requests, then revoke the ephemeral session. No resource rows are modified and no response bodies/session tokens are logged. This probe runs only for the explicit dev SQL/full deployment combination; staging/production do not enable fictional sign-in and rely on the pre-publication SQL checks plus existing public smoke checks until production identity acceptance exists.

Actual-SQL migration application/replay, grants, constraints, concurrency and tenant-isolation checks still require an authorized target via `VACATE_SQL_TEST_CONNECTION`; offline passes or skipped tests are not a SQL pass. Inspect the target/revision and workflow evidence before calling a release verified. `/api/health` remains a liveness endpoint.

Reference: [EF Core applying migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying), consulted 2026-11-06. Repository implementation uses the existing EF Core 9 operator rather than assuming newer EF tooling is installed.
