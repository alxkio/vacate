---
id: VAC-41
type: task
summary: Gate application deployment on database migration and verification
status: qa
created: 2026-11-06
updated: 2026-11-06
parent: null
depends_on: []
---

# VAC-41 — Gate application deployment on database migration and verification

![Task](badges/task.svg) **🔍 QA** · Owner: Unassigned

## Description

The hosted VAC-31 API was deployed while its required Leaves columns were absent. The founder accepted an integrated database-first release process on 2026-11-06 so application publication cannot bypass migration, runtime grants and database verification.

## Scope

Use the existing GitHub deployment workflow and Vacate.Database operator. Package SQL/tooling with the same commit as the API, serialize releases per environment, require a separate migration identity, and preserve compatible forward-only schema evolution. The canonical process is [database deployment](../database/deployment.md).

No live provisioning, migration, credential creation, GitHub secret change, commit, push or deployment is performed by this implementation. No new frontend, HTTP contracts, tenant permissions, product rules or paid resources are introduced.

## Dependencies

None. Existing ADR-0004 and operator tooling are present. VAC-31 is the incident motivating this task, not an implementation prerequisite. Initial hosted use needs administrator-provisioned SQL migration authority and the matching environment secret; these operational prerequisites do not imply a new issue dependency.

## Acceptance scenarios

- [ ] Every full SQL deployment applies pending migrations and refreshes/verifies runtime grants before publishing the API or frontend; a current schema is a no-op for migration application.
- [ ] Missing migration credentials, a different SQL target, runtime identity reuse, a mismatched artifact, migration/grant failure or missing mapped columns blocks both publications.
- [ ] One environment lock spans database and application changes; different environment targets cannot be substituted through the connection secret.
- [ ] Preview, frontend-only and InMemory deployment paths do not run database mutation.
- [ ] Review SQL is retained with the same-release operator artifact; forward compatibility and failure recovery are documented.
- [ ] Full dev SQL smoke checks read own membership and leave requests without resource writes; staging/production never enable fictional sign-in for the probe.
- [ ] Actual-SQL migration replay, permissions and existing tenant-isolation tests run on an explicitly authorized target before hosted readiness is claimed. Tenant authorization logic is unchanged; target isolation and credential boundaries receive offline regression checks.
- [ ] A temporarily unavailable SQL target receives bounded read-only readiness retries before migration-history access; persistent or nontransient failures still block publication, with no automatic migration/grant replay or change to AutoPause/free-limit controls.

## Subtasks and responsibilities

- Backend/database: extend the existing operator with guarded deployment and runtime-column verification.
- Infrastructure/QA: package artifacts, gate publication, preserve release serialization and add meaningful offline regression checks.
- Documentation: record accepted direction and credential/compatibility/recovery steps.
- UX/UI: Not applicable; deployment behavior only. Frontend application and API resource contracts are unaffected.

## Attachments and sources

- [ADR-0004](../adr/0004-relational-persistence.md), [deployment runbook](../database/deployment.md), [infrastructure guide](../../infra/README.md).
- [VAC-31 report](VAC-31-leave-request-accounting-transactions.md), including C-7 and earlier verification that no hosted migration was applied.

## Comments

- C-1 · 2026-11-06 · Codex: Founder accepted the recommended release sequence. Implementation proceeds locally; existing VAC-31 investigation edits are preserved.
- C-2 · 2026-11-06 · Codex: Local checks passed; SQL-provider cases remain skipped. The implementation is ready for QA, while migration identity provisioning, target permissions and the first hosted run remain unexecuted. No release approval is inferred.
- C-3 · 2026-11-06 · Codex: At the founder's request, documented the complete migration identity setup in the infrastructure guide and linked it from the deployment runbook. Includes app registration, client secret, SQL user mapping, explicit dev-only full database authority, GitHub secret, first run and rotation. Documentation only; no identity, permission or secret was created.

- C-4 · 2026-11-06 · Codex: Founder supplied a deployment failure with SQL 40613 from the first GetAppliedMigrations connection. The trace precedes migration writes. Serverless auto-resume is a likely but unverified cause. Added an isolated read-only EF readiness probe with bounded transient retries before migration history; the writer context and explicit runtime-grant transaction strategy remain unchanged. No live availability, credential correctness, provider retry result or migration success is inferred from the stack trace.

## Decisions

- D-1 · 2026-11-06 · Founder acceptance: Database migration, runtime grants and verification precede API/frontend publication on every SQL backend release; separate identity, same-commit artifacts, environment serialization and compatible forward migrations are required. See the canonical deployment runbook and ADR-0004 amendment.

## Work log

| Entry | Date       | Actor / category              | Activity                                                                                                | Duration | Basis and evidence                                                                      |
| ----- | ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| W-1   | 2026-11-06 | Codex / assistant, unmeasured | Implement accepted database deployment gate, verification, regression checks and documentation          | Unknown  | Local diff; no duration captured.                                                       |
| W-2   | 2026-11-06 | Codex / assistant, unmeasured | Document migration identity setup in infrastructure and link the deployment runbook                     | Unknown  | Founder request and documentation diff; no duration captured or live setup performed.   |
| W-3   | 2026-11-06 | Codex / assistant, unmeasured | Handle reported first-connection SQL 40613 with read-only readiness retries and regression verification | Unknown  | Supplied deployment trace and local diff; no measured duration or live database change. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed and estimates: not recorded.

## History

- H-1 · 2026-11-06 · Codex: Created In progress after explicit founder acceptance of the deployment recommendation.
- H-2 · 2026-11-06 · Codex: In progress → QA after local build, offline regression and artifact verification. Hosted SQL acceptance and independent review remain open.

## Verification and release

Local verification on 2026-11-06:

| Check                                                                                              | Result                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Locked dependency restore                                                                          | Passed after recording the new existing-project test reference; no package versions changed                                         |
| Release solution build                                                                             | Passed; one Functions SDK extension restore fallback warning (`AZFW0108`), no errors                                                |
| NUnit solution suite                                                                               | 53 passed (43 integration/offline guards, 10 unit), 18 actual-SQL tests skipped because no authorized test connection is configured |
| Python deployment/smoke regressions                                                                | 17 passed (3 workflow gates, 14 smoke cases)                                                                                        |
| Workflow syntax                                                                                    | Both YAML files parsed; 25 Bash steps passed `bash -n` after replacing GitHub expressions with literal placeholders                 |
| Bicep compilation and existing Functions-template validator                                        | Passed using the installed standalone Bicep binary; existing resource-type metadata warnings only                                   |
| Local operator publication and SQL generation                                                      | Passed; generated script contains `20261105214614_LeaveRequestSubmission` and the missing Leaves columns                            |
| C# formatter, changed Markdown/workflow formatting, new documentation links and `git diff --check` | Passed                                                                                                                              |

The Azure CLI wrapper could not download Bicep because of its local certificate chain; the installed standalone binary compiled the template successfully. These local checks do not establish GitHub runner execution, actual-SQL migration/grant behavior, deployed smoke success or independent human acceptance. No live database changes, credential/permission provisioning, commit, push or deployment were performed. No frontend source or HTTP resource contract changes were needed for this release-process change.

### SQL availability follow-up verification · 2026-11-06

The readiness correction passed a Release solution build with zero warnings/errors and the complete NUnit suite: 57 passed (47 integration/offline tests, 10 unit), with the same 18 actual-SQL cases skipped. Four new offline cases exercise the configured EF SQL Server strategy for transient recovery, finite retry exhaustion, immediate nontransient rejection and isolation from the operator's writer strategy. The existing three deployment-gate Python regressions also passed. C# formatting, changed Markdown formatting and `git diff --check` passed. No real SQL connection or auto-resume was exercised; provider/hosted verification remains pending. API behavior, frontend code and tenant authorization are unaffected; the probe reads only a constant. No commit, push, deployment, resource/permission or AutoPause/free-limit change was performed for this correction.

## Open questions and follow-up

Which dedicated migration service principal will the administrator provision and authorize for each SQL environment? The workflow deliberately fails until its matching credential and permissions exist. A hosted rollout and actual-SQL checks remain to execute after that setup.
