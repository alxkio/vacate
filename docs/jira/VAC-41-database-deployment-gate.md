---
id: VAC-41
type: task
summary: Gate application deployment on database migration and verification
status: qa
created: 2026-11-06
updated: 2026-11-17
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
- [x] Review SQL is retained with the same-release operator artifact; forward compatibility and failure recovery are documented.
- [x] Full dev SQL smoke checks read own membership and leave requests without resource writes; staging/production never enable fictional sign-in for the probe.
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

- C-5 · 2026-11-06 · Codex: At the founder's explicit request, committed/pushed the readiness correction as `e6751a4` and dispatched [full dev deployment 42232427359](https://github.com/alxkio/vacate/actions/runs/42232427359). Compilation, frontend/backend checks, paired API/browser acceptance and infrastructure apply passed. The availability probe then failed before migration writes with SqlClient post-login timeout -2; its initial policy explicitly added 40613 but did not cover -2. Both application publications and hosted smoke were skipped. Added -2 only to the read-only probe's retry policy, with a regression producing an actual SqlClient timeout through a local inert TCP listener. No write replay, AutoPause/free-limit change or paid fallback is introduced.

- C-6 · 2026-11-06 · Codex: Committed/pushed the verified -2 correction as `1558743`, then dispatched [full dev deployment 42234078829](https://github.com/alxkio/vacate/actions/runs/42234078829). Every job passed, including database migration/grant/schema verification, API/frontend publication and hosted smoke with the dev membership/request read probe. This attempt's readiness check succeeded without a logged retry; actual cold-start retry recovery is not established by that success. Issue remains QA pending the remaining SQL-provider scenarios and independent review.

- C-7 · 2026-11-17 · Codex: Reproduced the supplied [PR #12](https://github.com/alxkio/vacate/pull/12) CI failure at `3a3f74d`: the database-ordering test rejected `continue-on-error` globally after a separate artifact-cleanup job intentionally added it. Scoped ordering, failure tolerance and release-lock inspection to the `deploy` job. Added positive cleanup isolation and negative cases for job/step failure tolerance and both plain/expression `always()` publication conditions. Deployment workflow, application/API code, SQL and tenant permissions are unchanged. Acceptance: cleanup may run after failures, while any failure-tolerant deployment/database/publication step or always-run publication still fails the guard. All 7 database workflow tests and all 27 Python script tests passed locally, with whitespace checks. This is offline CI verification, not SQL execution, hosted deployment or a new CI pass. Issue/backlog status, summary and dependencies remain QA/unchanged.

## Decisions

- D-1 · 2026-11-06 · Founder acceptance: Database migration, runtime grants and verification precede API/frontend publication on every SQL backend release; separate identity, same-commit artifacts, environment serialization and compatible forward migrations are required. See the canonical deployment runbook and ADR-0004 amendment.

## Work log

| Entry | Date       | Actor / category              | Activity                                                                                                                  | Duration | Basis and evidence                                                                             |
| ----- | ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| W-1   | 2026-11-06 | Codex / assistant, unmeasured | Implement accepted database deployment gate, verification, regression checks and documentation                            | Unknown  | Local diff; no duration captured.                                                              |
| W-2   | 2026-11-06 | Codex / assistant, unmeasured | Document migration identity setup in infrastructure and link the deployment runbook                                       | Unknown  | Founder request and documentation diff; no duration captured or live setup performed.          |
| W-3   | 2026-11-06 | Codex / assistant, unmeasured | Handle reported first-connection SQL 40613 with read-only readiness retries and regression verification                   | Unknown  | Supplied deployment trace and local diff; no measured duration or live database change.        |
| W-4   | 2026-11-06 | Codex / assistant, unmeasured | Commit/push and dispatch authorized dev deployment; inspect its timeout and correct read-only SqlClient -2 retry coverage | Unknown  | Workflow 42232427359, deployment-job log and local diff; no assistant/human duration measured. |
| W-5   | 2026-11-06 | Codex / assistant, unmeasured | Push timeout correction, execute and monitor successful full dev deployment, record hosted evidence                       | Unknown  | Workflow 42234078829 and its deployment-job log; no measured assistant/human duration.         |
| W-6   | 2026-11-17 | Codex / assistant, unmeasured | Reproduce PR #12 cleanup-related CI failure; scope database workflow guards and verify positive/negative regressions | Unknown | Supplied CI log, `python3 scripts/test_database_deployment.py`, and `python3 -m unittest discover -s scripts -p 'test_*.py'`; no measured duration. |

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

### First authorized hosted attempt · 2026-11-06

[Run 42232427359](https://github.com/alxkio/vacate/actions/runs/42232427359) used `e6751a4620f774bc744ee110ff60ee5313189ede`, environment `dev`, `apply=true`, `deploy_backend=true`. All pre-deploy jobs, including paired browser acceptance, passed. Infrastructure apply succeeded. The database step failed during the initial read-only probe with SqlClient -2 post-login timeout, before history checks/migrations/grants. API/frontend publication and hosted smoke were skipped. The original SQL 40613 and this timeout are availability symptoms; the exact Azure cause remains unverified. Provider deployment verification is not complete. The follow-up -2 correction passed a zero-warning/error Release build and all 58 local NUnit tests (48 integration/offline, 10 unit); the 18 actual-SQL cases remained skipped. Its new regression uses a local TCP listener to obtain a real SqlClient -2 exception and verifies recovery through the read-only strategy.

### Successful hosted deployment · 2026-11-06

[Run 42234078829](https://github.com/alxkio/vacate/actions/runs/42234078829) deployed `1558743ff053634343529f4cd2f2445b0faa2933` to `dev`, with `apply=true` and `deploy_backend=true`. Compile, frontend/backend CI and paired API/browser acceptance all passed. The deployment job then passed infrastructure validation/apply, database verification, both application publications and same-revision hosted smoke checks.

The deployment log records:

- SQL availability succeeded before history/migration work; no transient retry was logged in this successful attempt.
- Forward migrations completed and `20261105214614_LeaveRequestSubmission` was verified, including runtime access to every mapped column.
- Runtime request/leave inserts and resource access were verified, with db_owner, DDL, physical DELETE, migration-history writes and Leaves UPDATE/DELETE denied to the application identity.
- API and Angular publication succeeded. Hosted smoke passed with the workflow's dev-only database-backed own-membership/request read enabled; only an ephemeral session is created/revoked by that probe.

Named targets: [dev web](https://lemon-beach-02f7a7103.4.azurestaticapps.net), [dev API health](https://vacate-dev-sc-wv5pdctnrzamu-api.azurewebsites.net/api/health), existing `vacate-dev-db` on `vacate-dev-srv`. The 18 opt-in actual-SQL regression cases remained skipped in CI; successful deployment/schema/grant checks do not replace those tests or independent acceptance. No AutoPause/free-limit change or paid recovery fallback was made by this correction. Shared deployment monitoring is logged here only, not duplicated in VAC-15.

## Open questions and follow-up

The configured dev migration credential and runtime grants were exercised successfully in run 42234078829. Actual cold-start retry recovery, opt-in SQL regression scenarios and independent review remain to verify. Staging/production identities, matching credentials and permission designs remain separate setup work; the successful dev deployment does not establish their readiness.
