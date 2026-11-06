# ADR-0004: Relational resource persistence through Infrastructure adapters

Status: ACCEPTED
Date: 2026-11-01
Accepted: 2026-11-02
Owner: Product lead / founder

## Context

ADR-0003 establishes domain aggregates, application authorization and repository/unit-of-work ports. At the decision baseline, resource state was in memory and VacateDbContext was empty. VAC-22 requests schema design; the founder separately authorizes one empty dev SQL free-offer database only under verified zero incremental cost. Infrastructure authorization does not accept this runtime persistence proposal.

## Decision

Use Azure SQL / SQL Server with EF Core infrastructure adapters and shared company-keyed tables for existing resources, numeric internal IDs and immutable public GUIDs. Retain Users as global accounts and at most one non-deleted Membership per user for MVP. Every company-owned row carries CompanyId; composite FKs plus application authorization protect relationships. Private profile facts are physically separated and projected only through existing allowlists.

Implement the Stage A [catalogue](../database/schema-catalogue.md) and [integrity/transaction design](../database/integrity-and-verification.md) subject to the reviewed mapping/cutover gates. ADR acceptance approves the architecture and staged plan; it does not declare the runtime gates satisfied. Use scoped EF row mappings, SQL sequences for preallocated IDs, rowversion for stale writes and transaction-owned company locks for cross-row invariants. Preserve server-owned UTC lifecycle; no automatic cascade/erasure. Existing balances use explicit compatibility snapshots until real policy/accounting work is accepted.

The [mapping/migration plan](../database/persistence-migration-plan.md) governs cutover, synthetic seeds, legacy CarryoverYears and recovery. Annual history/revisions and day/hour quantities are proposed extension boundaries, not authorization to implement VAC-27–VAC-33. No country-policy values, retention period or production identity provider is selected.

## Consequences

A shared relational model fits current resource contracts and permits database-enforced tenant relationship checks. Authorization and active-reference checks remain in application services; a GUID, FK, private table or EF filter alone cannot enforce access. Company locks serialize some writes and require all relevant code paths to participate; SQL integration/race tests are mandatory before cutover. Infrastructure-only work leaves API/frontend unchanged.

Free-offer downtime is accepted for the separately authorized empty development target. It does not establish production availability or recovery. Microsoft currently does not support restore/copy into a free-tier DB, so future recovery may require authorization outside zero-cost scope. Application persistence, identity, migrations and durable sessions remain separate work.

## Alternatives considered

- Continue in-memory adapters: useful for fictional development but loses resource state on restart and cannot prove SQL constraints.
- Database per company: stronger physical separation but adds operational/provisioning complexity; no accepted requirement selects it today.
- Direct EF entity annotations/context in Domain or endpoints: conflicts with ADR-0003 boundaries.
- Immediate request ledger/policy/onboarding schema: depends on unresolved decisions and expands authorized scope.

## Evidence and links

- Accepted [ADR-0001](0001-company-first-web-api.md), [ADR-0002](0002-azure-static-web-app-and-functions.md), [ADR-0003](0003-domain-and-application-services.md).
- [VAC-25](../jira/VAC-25-persistence-adr-and-migration-plan.md) and linked prerequisite design evidence.
- [Product charter](../product/product-charter.md), [user contract](../contracts/user.md), [API contract](../contracts/api.md).
- [Microsoft free-tier FAQ](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-tier-faq), checked 2026-11-01.

## Product lead acceptance — 2026-11-02

The product lead explicitly accepted ADR-0004 in the schema-review conversation on 2026-11-02. Acceptance covers shared company-keyed SQL tables, EF Infrastructure adapters, the Stage A mapping boundary and the staged migration/cutover plan. This resolves the earlier acceptance question; design-task completion alone did not accept it.

Implementation gates remain mandatory: reviewed schema/migration/import choices, SQL isolation/concurrency and API/browser verification, secure connection principal/network permissions, and an agreed recovery/cutover procedure. Unresolved choices identified by the mapping plan remain open; no test, migration or cutover is declared complete by this acceptance.

The zero-incremental-cost Azure constraint is unchanged. Paid resources, overages, restore targets or additional services are not authorized. Invitation/identity/policy/leave/carryover features remain separately scoped. [VAC-26](../jira/VAC-26-azure-sql-resource-persistence.md) retains its remaining readiness gates.

## Product lead amendment — derived consumption · 2026-11-02

The product lead explicitly requested immediate replacement of compatibility snapshots with leave records and read-time balance calculation, including a scoped fixture migration. [VAC-36](../jira/VAC-36-derived-balances-from-leaves.md) owns the amendment: MembershipEntitlements retains current period/allocation inputs; Leaves supplies consumption; no Used/Pending/Available totals are persisted. Known fictional legacy totals are labeled opening entries without invented dates/history. This supersedes the snapshot physical mapping above, while retaining authorization, tenant constraints and forward-only migration gates. No leave submission/approval endpoints or policy evaluator are authorized by this amendment. Organization settings remain logically separated within the existing aggregate/table.

## Product lead amendment — database deployment gate · 2026-11-06

The founder accepted database migration as a mandatory stage of every SQL backend release after the VAC-31 hosted schema mismatch. [VAC-41](../jira/VAC-41-database-deployment-gate.md) and the [deployment process](../database/deployment.md) implement same-commit operator/SQL artifacts, forward migrations, runtime grant verification and mapped-column reads before API/frontend publication. One environment lock covers all mutating release stages. A separate Entra migration service principal owns elevated operator authority; the API retains limited managed-identity permissions and never migrates at startup.

Schema changes must remain compatible with the running API: add structures before code uses them and remove obsolete structures in a later release. Any database-stage failure blocks application publication; no automatic downgrade, reset, seed or paid recovery is authorized. Preview, frontend-only and InMemory deployments do not mutate SQL. This accepts the process and its implementation, not a hosted migration result or credential/permission provisioning.
