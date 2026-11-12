---
id: VAC-42
type: task
summary: Review and refine every implemented Vacate page
status: qa
created: 2026-11-11
updated: 2026-11-12
parent: null
depends_on: []
---

# VAC-42 — Review and refine every implemented Vacate page

![Task](badges/task.svg) **🔍 QA** · Owner: Assistant implementation; product lead review

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

- C4 · 2026-11-12 · Assistant: [PR #4](https://github.com/alxkio/vacate/pull/4) merged after CI; full dev deployment of `9465318` succeeded, including live database gate, both publications and hosted smoke. Independent smoke and diagnostic sign-in/calendar recheck passed after initial timeouts; cause unverified. [Release evidence](media/VAC-42/deployment-2026-11-12.md).

## Decisions

- D1 · 2026-11-11 · User-authorized refinement: preserve existing transactions, routes, permissions and visual identity. Label the existing writable balance action honestly; do not invent a read-only preview workflow or approval inbox.

- D2 · 2026-11-12 · Product lead authorization: commit the verified VAC-42 scope on its own branch, merge after checks and deploy to the existing dev environment. This supersedes the initial no-commit/push/deploy restriction only for this work.

## Work log

- W1 · 2026-11-11 · Assistant recorded: review/implementation/verification; duration unmeasured. Human actual: Unknown. Automation durations are recorded only where emitted by checks; no inferred hours.

- W2 · 2026-11-12 · Assistant recorded: branch/PR/merge, preview, deployment monitoring and release verification; duration unmeasured. GitHub job execution timestamps are linked as evidence, not inferred human or assistant working hours.

## History

- 2026-11-11 · Assistant · Created In progress for authorized cross-page review/refinement.

- H2 · 2026-11-12 · Assistant · In progress → QA: implementation and automated/rendered checks complete; product-lead review remains. No commit/push/deployment.

- H3 · 2026-11-12 · Assistant · QA → Done after completed verification/reviews and product-lead authorization to merge/deploy. Released status requires actual named deployment evidence.

- H4 · 2026-11-12 · Assistant · Done → Released: revision `94653183506398a757cc289c0d57e4dd69216a1e` available at the named dev target after [successful deployment](https://github.com/alxkio/vacate/actions/runs/43217227468) and post-deployment checks. Broader SQL regression and assistive-technology limits remain.

## Verification and release

[Local verification](media/VAC-42/verification-2026-11-12.md): 71 tests/17 files, both TypeScript projects, production build, fixture/schema scripts and complete native browser/API acceptance passed. Final focused checks verify refresh focus, explicit company/session feedback isolation and admin lower forms at 1440/375/320px. Independent design/technical reviews found no blocking issue after refinements. Released to the [existing dev web](https://lemon-beach-02f7a7103.4.azurestaticapps.net) at revision `9465318`; [deployment evidence](media/VAC-42/deployment-2026-11-12.md) distinguishes verified live schema/grants/reads and publication from the 18 skipped SQL regression cases, initial timeout/recheck and unverified physical-device/screen-reader behavior.

## Open questions

Approval handoff without an inbox, future read-only request examples and future production identity remain product decisions; continue independent refinements.

## Owner feedback subtask · 2026-11-12 · QA

Reopened from the released baseline to implement owner feedback. The owner requested these refinements remain a subtask of this UI review. The released baseline above remains historical evidence; this follow-up is not yet released.

### Acceptance scenarios

- [x] Login week and workspace default/Today match the current local date; explicit URL dates and history remain intact.
- [x] Invalid/missing/reversed dates and invalid durations identify their fields accessibly; warnings remain distinct from blocking errors, drafts survive recovery and stale previews cannot submit.
- [x] Company colleagues appear in a shared table with department/team names, relationship text and supplementary color; another company and private membership/family/leave facts stay excluded.
- [x] Administrators can edit memberships from the table; employees/leads cannot acquire edit access through direct routes or controls.
- [x] Company workspace/at-a-glance precede organization configuration, then clearly separated structure; booleans use accessible switches without losing inherited/null states.
- [x] Admin department/team creation dialogs validate, preserve drafts on failure, await server saves, refresh counts and restore focus; non-admin/foreign company calls remain denied.
- [x] Calendar/planner preferences apply immediately for the current account and survive navigation/reload without sign-out.
- [x] Focused frontend/backend tests, TypeScript/build and desktop/mobile/API/browser verification are recorded.

### Sources and decisions

- [Product charter](../product/product-charter.md), [request rules](VAC-31-leave-request-accounting-transactions.md), [frontend ADR](../adr/0005-frontend-capability-architecture.md).
- D1 · 2026-11-12 · Owner: implement the seven feedback items above. This authorizes frontend structure creation and shared directory presentation, superseding earlier API-only/create exclusions for departments/teams only.
- D2 · 2026-11-12 · Owner confirmed: keep past dates allowed with warnings. Invalid dates and reversed ranges remain blocking errors.

### Journey and responsibilities

Employee: current calendar → colleagues/relationships → request → field correction/preview/warnings → server-confirmed save. Admin: shared People table → membership editor → focus return; Settings → workspace/summary → switches → create structure dialog → server-confirmed counts; System → select layout → immediate workspace update.

Backend/contracts: sanitized directory structure projection only; existing create/authorization/lifecycle APIs reused. Database/infrastructure: no new schema or provisioning required. UI validation supports the server and does not replace it.

### Comments

- C1 · 2026-11-12 · Assistant: began from staged VAC-42 documentation on VAC-42-release-evidence; preserve those changes and their index state.

### Work log

- W1 · 2026-11-12 · Assistant recorded: source inspection, implementation and verification; duration unmeasured. Human actual: Unknown.

### History

- 2026-11-12 · Assistant: created In progress for explicit owner feedback.

### Verification

Implementation and functional checks passed. [Verification, file manifest, journeys and screenshots](media/VAC-42/owner-feedback/verification.md). Native trusted keyboard input remains unavailable in this environment; manual keyboard QA is still required. No release claim.

### Open questions

None for the accepted feedback scope.

### Additional owner feedback · 2026-11-12

- [x] Vacate logo navigates to workspace home.
- [x] Expired authenticated API sessions navigate to login and resume the previous internal page after successful authentication; unsafe external redirects and stale-account responses are rejected.

- [ ] Manual native keyboard QA: Space toggles, Tab sequence, Escape and focus return. Automated trusted input delivery was unavailable in both headless/visible Chrome; source semantics and functional focus are verified separately.

- 2026-11-12 · Assistant: reopened the released baseline for the owner-feedback subtask; implementation moved to QA after functional/browser/API checks. No separate issue/story, commit or deployment. Original staged release evidence preserved.
