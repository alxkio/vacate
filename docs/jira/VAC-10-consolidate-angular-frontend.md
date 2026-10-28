---
id: VAC-10
type: task
summary: Consolidate the deployed mock into Angular under frontend
status: released
created: 2026-10-25
updated: 2026-10-25
parent: null
depends_on: [VAC-8, VAC-9]
---

# VAC-10 — Consolidate the deployed mock into Angular under frontend

![Task](badges/task.svg) **🚀 Released** · Owner: Codex

## Description and scope

The founder intended `frontend/` to contain the frontend application and explicitly requested converting the currently deployed HTML/JavaScript mock into Angular components in this change. Use the existing Angular dependency lock; preserve current A/B/C screens, personas, eligibility states and mock-only request behavior. Angular owns rendering, navigation and event handling; the deployment must serve the Angular index without replacing it with a static mock.

## Dependencies

- [VAC-8](VAC-8-calendar-first-and-balances-page.md): released calendar-first layout, annual side card and separate balances page.
- [VAC-9](VAC-9-eligibility-contract-and-mock-decisions.md): released provisional GR decisions, review matrix and backend response contract.

## Acceptance scenarios

- [x] Angular sources, workspace, lockfile, current tooling and instructions use `frontend/`; legacy generated files are preserved outside the working tree and excluded from new artifacts.
- [x] Angular components render login, shell/calendar, balances, rule details, dialogs and request preview with existing keyboard, focus, mobile and history behavior.
- [x] All 12 accounts retain independent own records, scoped generic shared availability, denied identifiers and stale-session guards. This remains a public synthetic mock; server tenant isolation is not implemented.
- [x] Angular build output is deployed directly. CI and cloud smoke validate Angular routes/config/revision/assets without copying the old gallery over index.html.
- [x] Existing fixture/schema and browser acceptance are migrated to exercise the new sources and application. Hosted build/tests must pass before release is claimed.

## Responsibilities

Frontend: Angular components/services/templates, typed presentation contracts, routes, styles and source consolidation. QA/infrastructure: update fixture/browser tests, packaging and smoke workflow. UX/backend/database: preserve accepted design and mock contract; no new product policy, real API, migration or persistence.

## Sources and attachments

Founder confirmation and explicit Angular-conversion answer, 2026-10-25; [ADR-0001](../adr/0001-company-first-web-api.md), [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md), [previous release](../release-2026-10-25-calendar-eligibility.md).

## Comments and decisions

- C-1 · 2026-10-25 · Codex: Folder inspection found legacy generated output, cached dependencies and editor files in frontend; the whole prior directory is preserved under `/private/tmp/vacate-frontend-legacy-x06p7w71/frontend`. Existing docs/next-up.md edits are unrelated and preserved.
- D-1 · 2026-10-25 · Founder: include Angular conversion now, alongside correction to the intended frontend directory. Preserve the current mock scope and open product/policy questions.

- C-2 · 2026-10-25 · Codex: Strict Angular/AOT, fixture/schema, smoke/package and functional browser checks pass. QA fixed stale child-calendar state and shortlist ordering; trusted keyboard acceptance passed separately in a fresh Chrome process. [Local evidence and screenshots](media/VAC-10/verification.md). Hosted production checks remain pending.

- C-3 · 2026-10-25 · Codex: Hosted production build/unit/default browser checks passed, frontend-only Azure dev deployment succeeded, exact live revision matched and the full hosted browser suite/visual review passed. [Release evidence](../release-2026-10-25-vac-10-angular.md).

- C-4 · 2026-10-25 · Founder follow-up: keep the backend in its existing `api/` directory and keep repository context current. The proposed backend-folder rename was withdrawn before any backend files or paths were changed; root README records the agreed application roots.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-25 | Codex / assistant recorded | Consolidate source location and convert the interactive mock to Angular | Unknown | Founder request and source changes; active time not measured. |
| W-2 | 2026-10-25 | Codex / assistant recorded | Monitor CI, deploy Angular frontend to dev and verify live revision/browser journeys | Unknown | [Release evidence](../release-2026-10-25-vac-10-angular.md); no measured duration inferred. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded.

## History

- H-1 · 2026-10-25 · Codex: Created In progress for the authorized folder correction and Angular conversion; inspected released prerequisite outputs.

- H-2 · 2026-10-25 · Codex: In progress → QA after source conversion, strict compilation, fixture/schema, package/smoke and local functional/native keyboard verification. Await hosted production build and release evidence.

- H-3 · 2026-10-25 · Codex: QA → Released for Azure dev revision `7f7bfff` after hosted production checks, deployment and complete live acceptance passed. Backend publishing skipped.

## Verification and release

[Local acceptance and screenshots](media/VAC-10/verification.md) record the converted Angular application and parity checks. [Hosted release evidence](../release-2026-10-25-vac-10-angular.md) records successful CI, frontend-only Azure dev deployment of `7f7bfff`, exact revision and full live browser/visual acceptance.

## Open questions

Existing A/B/C selection, shortlist and policy exceptions remain open in VAC-8/VAC-9; conversion does not resolve them.
