---
id: VAC-42
type: task
summary: Review and refine every implemented Vacate page
status: qa
created: 2026-11-11
updated: 2026-11-14
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

## CI fixture-date regression · 2026-11-12

Owner supplied runner failure after the trusted native readiness checks passed: `keyboardClick` attempted to focus absent `[data-date="2026-10-01"]`. Source confirms native acceptance opened a month view without a date, while the accepted current-date refinement now opens the current month. The historical fixture journey now requests `date=2026-10-01` explicitly; keyboard target readiness and missing-selector diagnostics are added without bypassing trusted-event checks. Root will verify rendered October target and preserve the current-month default. Native runner rerun remains a separate check from local synthetic interaction. Tracked here as the existing UI-refinement subtask, not a new story.


2026-11-13 · Assistant / QA follow-up: found and corrected the second historical functional calendar load as well as the native load. Both explicitly request `date=2026-10-01`; default month remains today. The route regression passes in the 85-test Angular suite; rendered October target presence and DOM focus pass in admin browser acceptance. The isolated trusted native keyboard suite now passes locally on Chrome 150 / Node 22.22.3 / macOS, including readiness, October date activation, Escape/focus return, shortlist and avatar navigation. This verifies the reported absent-target regression locally; it does not claim a rerun of the supplied Linux CI job or every new administrator keyboard journey. [Shared evidence](media/VAC-43/verification.md).


### Upcoming-request CI follow-up · 2026-11-13

The owner reported `leah own upcoming entries`: the assertion still treated October 2026 fixture leave as upcoming after its dates passed. Owner direction: create real future leave and verify visualization, rather than reimplement upcoming filtering or pin time for that assertion. The new journey selects a future working date through server preview, submits through the rendered form, reloads, verifies the saved request in upcoming/calendar/details on desktop/mobile and checks another employee's own view. Admin-only permanent deletion (VAC-31 subtask) supplies `finally` teardown with balance/list/calendar checks and session revocation; cleanup errors fail the test. Verification pending.


2026-11-13 · Assistant verification update: API build and 72 integration checks passed, with 25 actual-SQL cases explicitly skipped. The real future-request UI journey and deliberate post-save assertion-failure journey both passed exact request/calendar/balance restoration and session revocation. Independent QA reviewed cleanup/preservation. [Follow-up evidence](media/VAC-43/upcoming-request-deletion.md). Full functional rerun result is recorded there; existing issue status remains QA.

### Native runner follow-up · 2026-11-13

The owner's pushed `171134e` failed paired CI before keyboard activation: Chrome 157/Linux headless acknowledged preparation but delivered no pointer/key events. Retrieved logs and screenshot confirm the failure layer. The existing refinement subtask now tracks a headed Chrome/Xvfb CI execution correction, enhanced failure diagnostics and correction of obsolete dropdown-style interactions with Settings switches. No product behavior or permissions change. Local headed native and 4× CPU runs passed; Linux CI remains the required gate. [Evidence and limits](media/VAC-42/native-input-2026-11-13.md). Assistant work unmeasured; human actual Unknown. Issue/backlog status remains QA.

### Page outline and session recovery subtask · 2026-11-13

Owner screenshot/clarification confirms the unwanted large brown outline is main-landmark focus, not a requested layout redesign. Preserve navigation/skip-link focus and control indicators while removing the frame. Owner selects 30 minutes for the existing absolute session lifetime. Source review additionally finds false sign-out after startup/Settings refresh failures and permission/resource denials; recovery must retain the ticket, hide partial/stale account state, retry without credentials and preserve the destination if retry subsequently expires.

- [x] Rendered login/refresh/navigation/skip-link checks at desktop/mobile, including warm brown administrator People/Settings and interactive/negative-tabindex focus indicators.
- [x] Network/current-user/summary failure recovery, 401 while reconnecting, safe return navigation, stale-account rejection and overlapping restore verification.
- [x] Controlled-clock HTTP tests verify exact 30-minute expiry, no activity renewal, separate sessions, logout and account revocation; existing actor/company authorization remains enforced.
- [x] Complete relevant frontend/backend and rendered regressions, independent QA review and evidence.

[Accepted duration/recovery behavior](../product/product-charter.md#session-and-page-focus-refinement--2026-11-13). The owner subsequently approved shared SQL sessions on 2026-11-13 after reviewing the required storage/migration/revocation work. The [ADR-0004 amendment](../adr/0004-relational-persistence.md#product-lead-amendment--shared-sessions--2026-11-13) records this bounded extension; production identity remains separate. Implementation remains the existing refinement subtask, with status QA unchanged. Unrelated untracked `docs/review-43.md` is preserved. Assistant implementation/review time unmeasured; human actual Unknown. [Evidence and remaining gates](media/VAC-42/page-session-recovery-2026-11-13.md).

- [x] Shared SQL adapter, hashed-ticket mapping, forward migration and limited runtime grant implementation; no target application implied.
- [x] Cross-scope/provider expiry, logout, account-revocation and identity-isolation coverage added; offline checks passed and actual SQL execution is explicitly skipped.
- [ ] Actual SQL execution and final independent release review; requires an authorized migrated test target. Coordinated API/database documentation and QA-authored scenarios are complete; PR verification is recorded in the linked evidence.

2026-11-14 · Assistant verification: 79 integration and 10 unit tests passed; 31 actual-SQL cases skipped. Offline migration/model checks and real local HTTP checks passed. SQL application/cross-instance execution and deployment remain unverified. [Shared-session implementation and gates](media/VAC-42/shared-session-recovery-2026-11-13.md). No issue summary/type/status/dependency change; backlog row remains unchanged.


## Leave and People review improvements · 2026-11-14 · QA

Owner instruction: implement this follow-up under VAC-42 as review/improvements to previous work. Accepted behavior is recorded in the [product charter](../product/product-charter.md#owner-refinement--leave-lifecycle-and-unified-people--2026-11-14) and [API contract](../contracts/api.md#employee-cancellation-and-expiry--vac-42--2026-11-14). This extends D1's previous preserve-transactions boundary only for explicitly requested own cancellation and expiry; permanent deletion remains admin-only. No commit/push/deployment authorization is inferred for this follow-up.

- [x] My Leave: collapsed expandable balances first; one all-years saved-history table with combined status/type/date filters; no separate reference-history block.
- [x] Own multi-date requests: cancel all eligible dates or selected dates from history and calendar dialogs; server protects past dates, other people/companies and generated closures. Retain cancelled history and UTC lifecycle.
- [x] Past Pending dates expire in company timezone; pending totals, coverage and assigned inbox release them without affecting approved history or future pending dates.
- [x] People: identify You; relationship colours on structure labels; search and team/department/organization filters. Administrators see annual balances, history and membership actions together; preserve direct legacy routes and employee privacy.
- [x] Explain disabled approval configuration; align secondary buttons.
- [x] Prepared idempotent fixed-date demo-history import preserves existing data and total approved consumption; distinguish prepared import from actual SQL execution.
- [x] Frontend/backend/contracts, focused lifecycle/isolation tests, build and rendered desktop/mobile checks documented with limits.

Work log: W1 · 2026-11-14 · Assistant recorded · inspection, design, implementation and verification · duration unmeasured; human actual Unknown. Unrelated untracked `docs/review-43.md` preserved. No configured local SQL connection or local API settings was found; actual database import/migration remains unverified until a target is available. No unresolved product decision for the requested scope; moving a request is implemented as trimming plus a new authoritative preview/submission.

History: QA → In progress for the owner's new review scope. Prior release/QA evidence above remains historical and does not verify this change.


Verification update · 2026-11-14 · Assistant: In progress → QA after 96 frontend tests, 86 integration + 10 unit tests, production build, both TypeScript projects, schema/fixture scripts, offline migration/model parity, real local API/browser desktop/mobile journey and existing trusted keyboard regression passed. [Journeys, screenshots, commands, scope and remaining gates](media/VAC-42/leave-people/verification.md). Actual SQL migration/import and 32 SQL-provider cases remain unverified; the database target/access question is pending. No production, commit or deployment claim.

- [ ] Apply and verify the forward migration and fictional import on the selected demo SQL target; execute durable SQL cancellation/expiry tests. Existing shared-session SQL gates above remain open.


Final local regression · 2026-11-14 · Assistant: complete functional browser acceptance passed on a separate disposable API, alongside the targeted final seeded-history/cancellation/People run. The suite now verifies saved ledger amounts after its own submissions and preserves inner balance expansion across navigation; zero/unknown states still have explicit checks. [Final evidence and screenshots](media/VAC-42/leave-people/verification.md). Status remains QA with live SQL and owner acceptance outstanding.

Review preparation · 2026-11-14 · Product lead authorized committing this follow-up and explicitly selected combining session recovery and leave/People improvements in existing [PR #7](https://github.com/alxkio/vacate/pull/7), on `VAC-42-page-session-recovery` targeting `master`. This supersedes the assistant's proposed separate branch/stacked PR. No merge or deployment is part of this instruction. Full SQL deployment applies forward migrations before API/frontend publication; `seed-fictional-history` remains a separate explicit operation afterward. Unrelated `docs/next-up.md` and `docs/review-43.md` changes are excluded. Status remains QA; no issue metadata/backlog change.

Work log: W2 · 2026-11-14 · Assistant recorded · branch isolation, commit and PR preparation · duration unmeasured; human actual Unknown. Existing local verification is linked above; hosted CI and SQL execution are separate checks.

CI follow-up · 2026-11-14 · Assistant: combined head `0c29c82` passed backend/frontend jobs, but [CI run 43578824965](https://github.com/alxkio/vacate/actions/runs/43578824965) failed the first native readiness probe on both the original attempt and one unchanged retry (43/40 attempts, 5057/5016 ms). Chrome 157.0.8103.50 / Node 24.22.2 / Ubuntu headed under Xvfb reported focus/visibility and an unobstructed H1, but observed zero pointer/key events. Downloaded screenshot confirms a rendered calendar without a page overlay. D-Bus stderr errors do not establish cause. The native probe implementation was unchanged apart from formatting in the combined head; no application handler failure is demonstrated.

Candidate verification change: Linux Chrome chooses its compositor instead of forcing `--disable-gpu`; macOS keeps its existing flag. A new application-free document probe distinguishes browser delivery from the later app journey. All trusted-event/adversarial checks, five-second readiness deadline and complete CI mode remain required. Local headed native acceptance and six startup regressions passed; Linux verification and precise cause remain open. Backend/API/contracts and tenant permissions are unaffected. Work log W3 · Assistant recorded · CI log/artifact investigation, unchanged rerun and bounded launcher experiment · duration unmeasured; human actual Unknown. Status remains QA.

CI verification update · 2026-11-14 · Assistant: candidate `559257b` passed all three jobs in [CI run 43591960174](https://github.com/alxkio/vacate/actions/runs/43591960174), using merge revision `be3b88d1206f280e48cf4b63cddad176133bd0b2`. Linux Chrome 157.0.8103.50 / Node 24.22.2 passed the application-free probe, dropped-probe recovery, missing/synthetic/partial-input and overlay rejection, trusted keyboard/calendar/dialog/chooser/avatar journeys, complete twelve-account functional suite, recovery/focus regression and final HTTP leave checks. This supersedes the candidate's pending Linux verification above. The two-part launch/probe adjustment has a passing runner result; exact Chromium cause and recurrence risk remain unverified. No application/API behavior changed in this follow-up. SQL-provider and release gates remain open; no merge or deployment. Work log W4 · Assistant recorded · CI result inspection and PR/evidence update · duration unmeasured; human actual Unknown.

### Shared tables and feedback-release preparation · 2026-11-14

Owner clarified that the requests-table refinement applies to My Leave and requested a common table component/design across pages. Added shared `DataTable` presentation for My Leave, People and administrator tables; features retain their existing data, decisions, filters and authorization. My Leave has a visible all-years caption, consistent status labels and aligned actions. People and the legacy administrator-balances route now share one rendering block; Nora's balance/history/membership tools remain together under People. Acceptance: personal filters/cancellation still work; Nora can search People, inspect balances/history on that page and use the legacy URL without a second table/page implementation; employee and cross-company denials remain intact.

Verified locally: 96 frontend tests, both TypeScript projects and production build passed. Real API/browser checks passed for personal history/filters, partial/calendar cancellation and accounting restoration, People scopes/search/You/privacy, Nora's consolidated balances/history, the legacy URL, and matched computed table spacing/type at desktop/mobile widths. Administrator acceptance passed holidays, closures, routing, decisions, personnel and employee/foreign-tenant denials. Its fixture now expects the authoritative `canCancel:false` closure field, and login activation avoids awaiting rendered frames in a document that navigation destroys. Source review/functional checks are not new trusted-keyboard or screen-reader evidence.

Live read-only check confirmed web config and API health both at `30a0206`, while PR #7 remained unmerged at `559257b`; the screenshot's older layout was not proof of a missing branch fix. Owner then explicitly authorized deploying all changes for the next feedback round. Prepared a default-off, full-dev-only `import_demo_history` deployment option that invokes the existing idempotent demo-history operator after migration, app publication and endpoint verification. Unsupported selections fail before Azure writes. Four offline deployment-gate tests and workflow YAML parsing passed. No new cloud resource, secret, paid fallback or startup import.

Work log W5 · Assistant recorded · shared table implementation, local/browser verification, live revision comparison and release preparation · duration unmeasured; human actual Unknown. Status remains QA until actual release verification. Unrelated `docs/next-up.md` and `docs/review-43.md` edits remain excluded.
