---
id: VAC-42
type: task
summary: Review and refine every implemented Vacate page
status: done
created: 2026-11-11
updated: 2026-11-12
parent: null
depends_on: []
---

# VAC-42 — Review and refine every implemented Vacate page

![Task](badges/task.svg) **✅ Done** · Owner: Assistant implementation; product lead review

## Description and scope

Review active routes, role variants, dialogs and shared navigation on desktop/mobile; improve truthful copy, accessibility, responsive presentation and recovery within implemented behavior. Preserve identity and accepted permissions/policy. Initial review excluded commit, push and deployment; the product lead authorized branch commit, merge and deployment on 2026-11-12. Review authorization: 2026-11-11 request to review and improve every currently implemented page.

## Dependencies

None. Related: VAC-20 navigation, VAC-31 saved requests, VAC-37 frontend architecture. Their existing implementations are the review baseline, not a claim that all their release gates passed.

## Acceptance scenarios

- [x] Inventory includes every active page, role variant, layout and dialog, with current multi-page journey maps.
- [x] Users can distinguish reference examples from API saves and unavailable approval/hourly functions.
- [x] Request/info dialogs have accessible names and preserve native Escape/focus return.
- [x] Saved-request loading/failure does not assert an empty history; retry is available.
- [x] Directory failure supports retry; membership dismissal returns keyboard focus.
- [x] Desktop/mobile rendered review and focused automated checks are recorded with limits.
- [x] Session/account changes cannot expose stale leave state; existing authorization boundaries remain intact.

## Responsibilities

UX/UI: inventory, critique, clarify, adapt, audit and polish. QA: focused component/service checks, TypeScript, build and rendered checks. Backend/database/infrastructure: unaffected; no contract, policy or authoritative calculation changes.

## Sources and attachments

- [Review and journey evidence](../design/implemented-page-review.md)
- [Product charter](../product/product-charter.md)
- [Accepted frontend ADR](../adr/0005-frontend-capability-architecture.md)
- [Product Designer](../../.github/agents/product-designer.agent.md)

## Comments

- C1 · 2026-11-11 · Assistant: clean initial working tree. Independent Impeccable design and technical assessments found misleading persistence copy, unnamed dialogs and missing loading/retry states. Source detector reported zero findings; that is not an accessibility pass.

- C2 · 2026-11-12 · Assistant: rendered review completed across active pages and role/layout variants. Final fault/focus checks passed after correcting disabled-control focus loss; native full-suite acceptance passed. Evidence and limits are linked below.

- C3 · 2026-11-12 · Product lead: “lets commit in a branch, merge and deploy”. Assistant will use the existing dev target and database-first release workflow.

## Decisions

- D1 · 2026-11-11 · User-authorized refinement: preserve existing transactions, routes, permissions and visual identity. Label the existing writable balance action honestly; do not invent a read-only preview workflow or approval inbox.

- D2 · 2026-11-12 · Product lead authorization: commit the verified VAC-42 scope on its own branch, merge after checks and deploy to the existing dev environment. This supersedes the initial no-commit/push/deploy restriction only for this work.

## Work log

- W1 · 2026-11-11 · Assistant recorded: review/implementation/verification; duration unmeasured. Human actual: Unknown. Automation durations are recorded only where emitted by checks; no inferred hours.

## History

- 2026-11-11 · Assistant · Created In progress for authorized cross-page review/refinement.

- H2 · 2026-11-12 · Assistant · In progress → QA: implementation and automated/rendered checks complete; product-lead review remains. No commit/push/deployment.

- H3 · 2026-11-12 · Assistant · QA → Done after completed verification/reviews and product-lead authorization to merge/deploy. Released status requires actual named deployment evidence.

## Verification and release

[Local verification](media/VAC-42/verification-2026-11-12.md): 71 tests/17 files, both TypeScript projects, production build, fixture/schema scripts and complete native browser/API acceptance passed. Final focused checks verify refresh focus, explicit company/session feedback isolation and admin lower forms at 1440/375/320px. Independent design/technical reviews found no blocking issue after refinements. Release authorized on 2026-11-12; deployment pending. Local evidence does not claim physical-device/screen-reader or SQL/deployed validation.

## Open questions

Approval handoff without an inbox, future read-only request examples and future production identity remain product decisions; continue independent refinements.
