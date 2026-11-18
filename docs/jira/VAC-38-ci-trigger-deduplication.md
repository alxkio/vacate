---
id: VAC-38
type: task
summary: Avoid duplicate CI triggers and preview application builds
status: qa
created: 2026-11-05
updated: 2026-11-18
parent: null
depends_on: []
---

# VAC-38 — Avoid duplicate CI triggers and preview application builds

![Task](badges/task.svg) **🔍 QA** · Owner: Assistant implementation; hosted review pending

## Description

Before merging the frontend branch, the product lead requested a review of repeated CI/deploy work, especially PR checks followed by merge checks. Existing CI triggers both push and pull_request without filtering, so an update to an open PR can run the full suite twice. Merge runs it again; manual deployment calls CI again, including when apply=false.

## Scope

Use PR-only automatic CI and retain workflow_call for exact-revision manual deployment checks. Cancel superseded PR validation runs while preserving distinct manual deployment runs. Preview-only Azure runs compile/validate/what-if infrastructure without application builds/tests. Applying still requires successful checks for the selected revision and uses artifacts from the same workflow run. No cross-run artifact reuse, automatic deployment, permission changes or application changes.

ASSUMPTION: the recommended PR-only policy is used in the absence of a different preference; an optional policy question was presented during implementation. Direct branch/master pushes deliberately have no automatic CI under this policy; use a PR for pre-merge validation. Deployment validates its selected commit independently because a PR merge ref and a final merge/squash commit may differ. This repeated PR/deployment validation is intentional, not eliminated by claiming two revisions are equivalent.

## Dependencies

None. Related: [VAC-7](VAC-7-optional-backend-deployment.md) owns historical frontend-only deployment support; its deploy_backend default and full/limited smoke distinction are preserved. [VAC-15](VAC-15-stabilize-keyboard-browser-acceptance.md) owns native-browser coverage; these assertions remain enabled.

## Acceptance scenarios

- [x] Configuration/condition verification: updating an open PR starts one automatic application CI workflow, with no separate branch-push run; merge does not start another application CI run.
- [x] Concurrency verification: a newer update cancels older CI/infrastructure PR validation for that PR; validation namespaces do not collide with manual deployment checks.
- [x] Condition-matrix verification: apply=false skips reusable application CI but still requires successful infrastructure compilation before Azure validation/what-if; no publish/artifact steps execute.
- [x] Condition-matrix verification: apply=true requires successful infrastructure and application checks. Failed, skipped or cancelled required checks block the deploy job; cancellation also blocks preview.
- [x] Static coverage/artifact verification: full and frontend-only application checks, same-run artifacts, deployment environment serialization and post-deploy smoke modes are retained.
- [x] Tenant isolation is unaffected: no runtime authorization/data paths change, and existing full CI still includes API/browser isolation checks. No new tenant test applies to workflow scheduling.

- [ ] Observe the new policy on GitHub after commit/push, including successful preview/apply and blocked deployment after failed/cancelled checks.

## Subtasks and responsibilities

- Architecture/QA: trace events, reusable workflow context, skipped dependency behavior and artifact provenance; verify an event/result matrix and workflow syntax.
- Repository steward: maintain issue/backlog and deployment documentation.
- UX/UI, backend product behavior and database: Not applicable.

## Attachments and sources

- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.github/workflows/azure-infrastructure.yml](../../.github/workflows/azure-infrastructure.yml)
- [Deployment documentation](../../infra/README.md)
- GitHub primary documentation checked 2026-11-05: [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [job conditions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions).

## Comments

C1 · 2026-11-05 · Assistant: static audit confirmed duplicate unfiltered push/PR triggers, no standalone CI cancellation, repeated manual deployment checks, and application checks during infrastructure-only preview. Deploy Azure is manual; merge alone never applies infrastructure or publishes applications. The GitHub connector returned no PR-triggered runs for f3ccd30; it cannot establish all push/manual execution history, so findings are configuration-based.

C2 · 2026-11-05 · Assistant: observed one application CI run and one infrastructure-only PR check for PR #3, no duplicate merge-triggered run at b482402, then one manual full deployment (42072424616) with all checks/apply/publish/smoke passing. [VAC-39 release evidence](media/VAC-39/release-2026-11-05.md) records exact revisions/runs. Preview and negative/cancellation behavior remain locally model-verified; hosted preview/cancellation scenarios and repository protection settings remain unverified, so VAC-38 stays QA.

## Decisions

D1 · 2026-11-05 · Assistant implementation choice under the product lead's request: PR-only automatic validation plus exact-commit manual deployment checks. Keep full and frontend-only coverage unchanged. Explicit job status handling permits preview after skipped application checks while failing closed for apply. Do not reuse PR artifacts for a different merged SHA or add automatic deployment.

## Work log

W1 · 2026-11-05 · Assistant recorded · Review workflows and deployment docs, consult GitHub documentation, implement trigger/concurrency/preview gates and verify conditions · Duration: Unknown (not measured); human actual: Unknown. No time totals inferred.

## History

H1 · 2026-11-05 · Assistant · Created In progress for the authorized CI/deployment duplication review and bounded corrections.

H2 · 2026-11-05 · Assistant · QA after local configuration, 192-case gate matrix, concurrency, artifact, syntax and documentation checks passed; hosted validation remains open.

## Verification and release

Local checks passed: see [verification and event matrix](media/VAC-38/verification-2026-11-05.md). Hosted execution, required-check settings and branch-protection enforcement remain unverified. The later product-lead-authorized VAC-39 release exercised commit/push/merge and full dev apply. This issue itself grants no external-setting permission; no repository protection settings were changed.

## Open questions and follow-up

Hosted PR and full apply passed through the VAC-39 release; hosted preview, failed/skipped dependency and cancellation scenarios remain unobserved. Required PR checks and protection against direct master pushes are repository settings outside these files and were not changed. Additional reduction across successful CI and deployment requires a separate exact-revision artifact provenance design; this task retains the deployment gate.

## Owner-feedback subtask · One PR workflow · 2026-11-18

C3 · Assistant: the owner supplied PR #12's Actions list showing both CI #67 and Deploy Azure #48. The second run was infrastructure compilation triggered by deployment-workflow path changes, not an Azure deployment. The owner requested a single PR workflow. This supersedes the separate infrastructure PR run described in the historical verification matrix.

D2 · Owner-requested refinement: CI is the sole automatic PR workflow. Add its `infrastructure` job to compile Bicep, SQL/firewall templates and all dev/staging/prod parameters without credentials, preserving the existing Functions and zero-cost SQL checks. This job runs on every PR, alongside application jobs. Deploy Azure exposes only `workflow_dispatch`; manual preview/apply still owns its original compile job, and reused application CI skips the PR-only infrastructure job. Preserve same-revision artifacts, manual apply gates, permissions, environment serialization and no deployment on merge.

Acceptance: a PR update creates only CI, with backend/frontend/paired-browser and infrastructure validation. Manual preview still compiles before Azure validation/what-if; manual apply still requires successful application and infrastructure checks. No application/API/data/tenant behavior changes; existing tenant-isolation checks remain enabled. Branch-protection settings are UNVERIFIED and unchanged; an existing required Deploy Azure check would need owner adjustment after merge.

Verification: nine offline deployment/workflow regression tests passed, including trigger ownership and mandatory template gates at both PR/manual entry points. Both workflow YAML files parse; changed-file whitespace checks passed. [Deployment guidance](../../infra/README.md) now identifies CI as the infrastructure PR check. Hosted observation of the new trigger policy is pending push; no manual Azure run is requested. Status, summary and dependencies remain unchanged, so the backlog row is unchanged.

W2 · 2026-11-18 · Assistant recorded · Review screenshot/event ownership, consolidate PR checks and verify deployment gates · Duration Unknown (not measured); human actual Unknown. No inferred time totals.

The complete offline script suite passed 29 tests; all embedded Bash in both workflows passed `bash -n`. The preceding Linux application CI at `bd0720e` passed all backend/frontend/browser jobs before this scheduling-only update.
