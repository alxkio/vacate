---
id: VAC-7
type: task
summary: Temporarily skip backend work in UI deployments
status: qa
created: 2026-10-23
updated: 2026-10-27
parent: null
depends_on: [VAC-1]
---

# VAC-7 — Temporarily skip backend work in UI deployments

![Task](badges/task.svg) **🔍 QA** · Owner: Codex

## Description

The founder wants to temporarily disable backend work in the deployment workflow while UI work continues, because repeated backend testing takes time. A manual UI deployment should publish and verify the frontend while retaining the existing API version. Full backend delivery must remain selectable when backend implementation resumes.

## Scope

- Add a `deploy_backend` boolean to Deploy Azure, temporarily defaulting to `false`. Pass its inverse as `skip_backend` to reusable CI, whose normal default remains full coverage.
- Gate .NET build/tests/host/package/upload, API artifact download and API publishing for the manual deployment. Keep regular push/PR backend CI unchanged.
- Keep frontend checks, packaging and infrastructure validation/what-if/apply. The input does not disable backend resource provisioning in Bicep.
- Add frontend-only HTTP smoke mode that validates web/config/gallery revisions, API target URL, routes/assets/cache headers without contacting the API or requiring its revision to match the new frontend.
- Preserve the existing full API/CORS/revision smoke and API-only Functions-host check. Explicitly state skipped API work in deployment summaries.
- Document how to restore full backend delivery. No commit, push, Azure deployment or new environment is part of this task.

## Dependencies

Requires the released [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) workflow, frontend hosting/configuration and existing API. Frontend-only release assumes the target environment already has its API; first/full deployment must enable `deploy_backend=true`.

Related: [VAC-5](VAC-5-common-leave-types-chooser.md) is waiting for a UI deployment; its product questions are unrelated and remain open. It is not an implementation prerequisite.

## Acceptance scenarios

- [ ] Given a manual deploy with default inputs, frontend checks run and backend build/tests/host/package/upload are skipped; API artifact download and publish are skipped with `apply=true`.
- [ ] Given `deploy_backend=true`, backend build/tests/package/publish and matching-revision API/CORS checks remain enabled; an old API revision fails full smoke.
- [x] Given a UI-only release and an older or unavailable API, web smoke validates the new frontend without calling the API; stale web revisions or a wrong configured API target still fail. Covered by the nine local smoke regressions.
- [ ] Given `apply=false`, application publishing and endpoint checks remain skipped; Bicep validation/what-if and selected component build checks continue.
- [ ] Given standalone push/PR CI, existing backend coverage remains enabled.
- [ ] Given a completed frontend-only deployment, the summary identifies skipped API testing/publishing rather than claiming that both components share a revision.
- Tenant isolation: no customer-data endpoint or permission changes. Preserve the selected environment's checked-in subscription/resource-group validation and public config/CORS boundaries; full API CORS checks are still available. Frontend-only smoke does not establish server tenant isolation.

## Subtasks and responsibilities

- Infrastructure/CI: typed input and gated backend paths; preserve frontend and validation gates.
- QA: regression checks for independent component revisions, wrong web/config revisions, API-only/full paths and workflow conditions; independent source review.
- Documentation: [deployment instructions](../../infra/README.md), issue/backlog and temporary-default explanation.
- UX, product UI, backend business logic and database: Not applicable. The CLI smoke helper changes verification only.

## Attachments and sources

- Founder instruction, 2026-10-23: temporarily disable backend deployment work/testing until backend changes are implemented.
- [Deployment workflow](../../.github/workflows/azure-infrastructure.yml), [reusable CI](../../.github/workflows/ci.yml), [smoke helper](../../scripts/cloud-smoke.py) and [regression checks](../../scripts/test_cloud_smoke.py).
- [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), checked 2026-10-23: typed reusable inputs, caller input mapping and skipped-job semantics.

## Comments

- C-1 · 2026-10-23 · Codex: Backend omission is scoped to the manual deployment's duplicate checks/publishing; normal push/PR CI retains coverage. The existing API revision can differ from the new frontend, so frontend-only smoke deliberately avoids API health/CORS calls and revision assertions. It still verifies the frontend's configured API URL.
- C-2 · 2026-10-23 · Independent `deploy_backend_review` agent: No blocking findings in workflow or smoke-helper changes. Boolean input inversion, absent-input behavior for regular CI, backend-only artifact/publish gates and independent component revision checks are consistent. Bicep still applies backend resources, so the switch is specifically for API code delivery/testing. Hosted GitHub execution remains unverified.
- C-3 · 2026-10-23 · Founder handoff: Commit and push the reviewed changes, wait for regular CI to succeed, then hand deployment back to the founder. No automatic Azure deployment is included. The deploy-time backend checkbox remains off by default; regular CI still includes the backend.

## Decisions

- D-1 · 2026-10-23 · Founder direction: temporarily omit backend work from UI deployments to reduce deployment testing time.
- D-2 · 2026-10-23 · Engineering implementation: reversible `deploy_backend=false` default with an explicit full-deploy opt-in; existing API code retained, infrastructure path unchanged. See [deployment contract](../../infra/README.md#deployment).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Codex / assistant recorded | Add optional backend delivery, frontend-only verification, regression coverage and documentation | Unknown | Founder request; workflow/helper changes and verification below. No complete issue-specific duration measured. |
| W-2 | 2026-10-23 | Independent review agent / assistant recorded | Review conditional workflow paths, skipped jobs and smoke semantics | Unknown | C-2; read-only source review and nine local regressions. Parallel duration unmeasured; not added to another elapsed window. |
| W-3 | 2026-10-23 | Codex / assistant recorded | Prepare reviewed commit, push and monitor CI for founder handoff | Unknown | Founder instruction and C-3. CI completion to be reported with the exact run; no duration inferred. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded. VAC-1 historical time is not duplicated.

## History

- H-1 · 2026-10-23 · Codex: Created In progress for authorized workflow work; dependency output verified in the existing released workflow/API setup.
- H-2 · 2026-10-23 · Codex: In progress → QA after nine smoke regressions, static workflow-condition/type/dependency checks and independent review passed. No hosted run or deployment performed.

## Verification and release

Passed locally on 2026-10-23:

- `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test_cloud_smoke.py`: all nine tests pass. Covers frontend-only with an unavailable API, wrong web/gallery revisions, wrong configured API URL, full API revision/CORS verification, API-only host checks and invalid frontend-only CLI input.
- Parsed both workflow YAML files and checked boolean defaults, inverted reusable input mapping, backend/frontend/apply gates, standalone push/PR triggers and valid job/reusable-workflow dependencies. Python syntax and whitespace checks pass.
- Independent source review found no blockers; skipped-job/type behavior checked against GitHub documentation. `actionlint` is unavailable locally, so this is not an actionlint or hosted workflow result.

Workflow acceptance boxes remain pending where they require actual GitHub execution/artifact delivery. Run the updated Deploy Azure workflow after commit/push with `deploy_backend=false` to verify skipped backend jobs, no missing-artifact failure, frontend smoke and the accurate summary. Full backend mode remains available for a subsequent full release. No hosted run, resource change or release is claimed.

## Open questions and follow-up

- Revisit the temporary backend-off deployment default when backend implementation resumes. Enable `deploy_backend=true` for API changes and first deployments of new environments.
- Hosted validation of skipped backend jobs, artifact selection and frontend-only release remains pending. No new Azure environment is requested.

## Resumption of backend work · 2026-10-27

C-4 · 2026-10-27 · Codex: Founder requested API-backed CRUD and paired frontend/API verification in [VAC-13](VAC-13-api-backed-settings.md). This ends the temporary backend-off default in D-2: deploy_backend now defaults true. Explicit UI-only mode remains available, but skips the paired API/web acceptance and is unsuitable for API-backed contract changes. This historical issue stays QA; no hosted release is claimed. Work/time for this adjustment belongs to VAC-13.
