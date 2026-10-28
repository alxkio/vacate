---
id: VAC-5
type: story
summary: Show common leave types first with an explicit show-all action
status: qa
created: 2026-10-23
updated: 2026-10-28
parent: null
depends_on: [VAC-1]
---

# VAC-5 — Show common leave types first with an explicit show-all action

![Story](badges/story.svg) **🔍 QA** · Owner: Codex

## Description

As an employee choosing leave, I want a short initial list of commonly repeated types and an obvious way to browse the full catalogue so that I can find routine choices without scanning every reference type.

The founder says the list is too long and requests a limited default view with an expansion action. On 2026-10-23, the founder selected 11 types and tentatively nominated study/examinations, then authorized implementation of the suggested defaults while keeping the questions open for revision; see the [canonical selection](../product/leave-types-review.md#vac-5-shortlist-selection--pending-review). No usage data has established popularity. The provisional implementation uses 12 shared choices in the request form and balance area, with annual and sick first, then category groups. Sick leave has an unknown allowance/pay preview; reviewed statutory rules remain open.

## Scope

- Apply the provisional shortlist to request selection, balance cards and their per-type example actions. Use the same list for all personas; no profile-based eligibility inference.
- Provide a labelled, keyboard-accessible **Show all leave types** action and a clear way to return to the short view, without losing an already selected type.
- Retain all 29 original catalogue entries and add a selectable unknown-allowance sick-leave preview: 30 entries / 29 requestable choices. The disability supplement remains explanatory, not an independently requestable allocation.
- Preserve the selected type's allowance/rule/source panel, units, unknown/excess projection behavior and five-day reference basis. Shortlisting changes presentation only; it grants no eligibility and removes no catalogue rule.
- Confirmed membership: annual, maternity, childcare, parental, school attendance, voting, sick leave, child illness (dependent illness), child hospitalization, marriage/civil partnership and paternity. Childcare appears once; this list does not establish display order.
- Dependent illness is shortlisted for children only, with the proposed label **Child illness (dependent illness)**. Preserve its source description and underlying allowance; a shortcut must not create another quota.
- Study/examinations is provisionally included under the founder's authorization to implement the suggestions; its inclusion question remains open for revision. Postgraduate/doctoral exams are excluded from the shortlist and remain in Show all.
- Show annual and sick first under Quick choices, then group the remaining choices by category; preserve the same group order in the full catalogue. Keep an uncommon selected request type visible on collapse and preserve dates, amount, units and open rules. Keep expanded uncommon balance cards visible too.
- Sick leave is explicitly requested as a new type. Research sources and the provisional unknown-allowance behavior are recorded in the [canonical review](../product/leave-types-review.md#sick-leave--research-and-provisional-mock-behavior). Show allowance, eligibility and pay to confirm, with no quota, percentage, proof collection or payroll calculation. Policy interpretation remains open; do not reuse another type's quota. Discretionary unpaid leave remains outside the selected scope.
- No usage tracking, personalized ranking, inferred family/medical eligibility or statutory entitlement calculations are included.
- Coordinate example/account coverage with [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md); independent of the admin inbox.

## Dependencies

Requires the released [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) request form and approved catalogue/rule panels to refine. This prerequisite is already available.

Coordinate per-person examples with the released [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md), but this remains a coordination link rather than a prerequisite. The founder authorized provisional defaults for the open questions; statutory sick-leave rules are explicitly deferred rather than guessed.

## Acceptance scenarios

- [x] Given a new request form, the initial chooser shows only the agreed short list in its reviewed order, with an obvious Show all action; it does not label rankings as measured usage.
- [x] Given Show all, every requestable catalogue type becomes reachable with its correct label/group; the non-requestable disability supplement is not accidentally enabled.
- [x] Given a less-common type selected from the full list, returning to the short view or opening its rules preserves and visibly identifies the selected value; it never silently substitutes another type.
- [x] Given any type selected from either view, its own allowance/rule panel, unit and projection behavior remain correct; no hidden choice inherits another type's amount or entitlement.
- [x] Given keyboard and mobile use, expansion/collapse, focus and selection are operable and announced meaningfully; the shorter list and rule content fit without horizontal overflow.
- [x] Given logout/login or a different scope/account, shortlist behavior follows the agreed shared-default contract without retaining the previous account's selection or inferring sensitive eligibility.
- [x] Given unknown balances, different units or event/schedule types, the existing explicit limits remain visible; the reduced list does not manufacture zero balances or combine units.
- [x] Given the selected child-illness shortcut, its label and request scope are children only, its source explanation remains available and it shares the dependent-illness allowance rather than creating a second quota.
- [x] Given sick leave, the provisional example/preview shows unknown allowance, eligibility and pay with a checked source and no balance percentage; no allowance is inferred from another type. Postgraduate/doctoral exams appear through Show all or as the retained selected type, and study/examinations is provisionally shortlisted.
- [ ] Tenant isolation is not exercised by the presentation-only mock. **Future server gate:** if company-specific catalogue/shortlist settings or request endpoints are added, test that A cannot load or change B's configuration, eligibility or requests through guessed identifiers. No browser list filtering is an authorization control.

## Subtasks and responsibilities

### UX

- [x] UX-1: Apply the founder-authorized provisional count/order, placement and wording; distinguish chosen defaults from verified popularity and keep the original questions open for revision.
- [x] UX-2: Specify show-all/collapse and selected-hidden-type behavior with accessible focus handling. Search/empty-search behavior is not needed for this native select and is not implemented.

### UI

- [x] UI-1: Add the approved short/default and full-catalogue presentation without duplicating type metadata.
- [x] UI-2: Preserve selection, validation, per-type rules and disabled supplement behavior across expansion and account resets.

### Backend

Not applicable: no ranking, analytics, preference or eligibility endpoint is included.

### Database

Not applicable: no persisted favorites, usage history or company shortlist table is included.

### QA and other responsibilities

- [x] Product-1: Record authorization to implement provisional defaults and preserve open questions. Sick leave uses an explicitly unknown-allowance preview; statutory policy interpretation is deferred.
- [x] QA-1: Verify every requestable type remains available; test shortlist/full-list toggles, uncommon selections, distinct units, keyboard/mobile and account changes.
- [x] Privacy-1: Same independently expected shortlist verified for all 12 personas; no family/health profile or colleague activity ranks the choices. Existing own/shared visibility checks pass. Independent production privacy review remains outside this public mock.
- Infrastructure: Not applicable beyond existing mock packaging.

## Attachments and sources

- Founder instruction, 2026-10-23: shorter default list of frequently repeated types, with an action to show all; related [idea note](../next-up.md).
- Founder selection, 2026-10-23 (paraphrased): 11 selected types, child-only dependent illness, tentative study/examinations, no postgraduate/doctoral exams; recorded in the [leave review](../product/leave-types-review.md#vac-5-shortlist-selection--pending-review).
- Founder implementation instruction, 2026-10-23: “implement with your suggestions, add a comment about it, and leave the questions open so we can revise.”
- [Sick-leave research and limited mock default](../product/leave-types-review.md#sick-leave--research-and-provisional-mock-behavior) and [policy-source register](../compliance/policy-sources.md), checked 2026-10-23; effective dates and statutory interpretation remain open.
- [Local acceptance evidence and review screenshots](media/VAC-5/verification.md), 2026-10-23.
- [Approved leave catalogue and unresolved additions](../product/leave-types-review.md), 2026-10-22.
- [Current balance design](../design/leave-balances-proposal.md) and [mock behavior/verification](../design/calendar-mock/README.md), 2026-10-22.
- [Release boundary](../release-2026-10-22-leave-mock.md), 2026-10-22: fictional data, reference rules, preview only.
- Two public fictional desktop/mobile screenshots are linked in the local acceptance record.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: The current balance area already starts with three cards, while the request selector contains the wider catalogue. The exact surfaces for this refinement need review; the request chooser is the proposed primary target.

- C-2 · 2026-10-23 · Codex: Founder requested type groups and common/repeated-use tags in the leave reference. The [29-row review table and unchecked candidate list](../product/leave-types-review.md#vac-5-shortlist-selection--pending-review) now support selection. Tags are proposals without usage evidence; no default shortlist has been approved or implemented.

- C-3 · 2026-10-23 · Codex: Founder supplied the shortlist membership recorded in the canonical review: 11 selected choices, counting childcare once. Study/examinations remains tentative; postgraduate/doctoral exams are excluded. Dependent illness is requested for children. Sick leave is a requested new type with no approved allowance/rules. This updates the selection state described in C-2; implementation has not started.

- C-4 · 2026-10-23 · Codex — implementation comment requested by founder: Implementing the suggested defaults provisionally: include study/examinations (12 choices), use the same shortlist for requests and balances across all personas, put annual/sick first then group the rest, and retain uncommon selected types when collapsing. Sick leave is selectable with unknown allowance/pay and sourced background; statutory calculations remain deferred. **All questions below remain OPEN FOR REVISION**, as explicitly requested; these defaults do not close them or establish measured popularity.

- C-5 · 2026-10-23 · Codex — pre-commit review: The independent `vac5_review` agent reported no blocking findings. Its one test-coverage suggestion was addressed with explicit end-date and school-hours preservation checks. Local QA and packaging/configuration checks are recorded in the [verification record](media/VAC-5/verification.md#pre-commit-review-and-qa--2026-10-23). A separate QA deployment is not needed before commit; hosted CI and an Azure dev smoke/browser check follow when commit/push/deploy are requested. The length of the 12-card balance area is a UX follow-up under the existing open questions, which remain open.
- C-6 · 2026-10-24 · Founder feedback implemented in [VAC-8](VAC-8-calendar-first-and-balances-page.md) and [VAC-9](VAC-9-eligibility-contract-and-mock-decisions.md): calendar first with annual-only rail; other balances move to a dedicated page. The 12-type base catalogue shortlist remains, with known-unavailable profile choices omitted from personal defaults and retained as disabled reference choices through Show all. Current-country mock gates and remaining legal questions are recorded separately. This revises the provisional page coverage/profile behavior without silently closing the historical questions below.
- C-7 · 2026-10-28 · Founder direction, implemented under [VAC-19](VAC-19-calendar-display-preferences-and-balances.md): keep the request chooser's shared shortlist and order; My balances may present the same eligible catalogue entries in a separate parent-aware order. This resolves the prior surface/order question only; shortlist membership and leave-policy questions remain open.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for mock: provide a short default list and explicit access to the complete type catalogue.
- D-2 · 2026-10-23 · Existing approved catalogue retained: this is a presentation change, not approval of new types, different allowances or eligibility defaults. See [canonical leave reference](../product/leave-types-review.md).
- D-3 · 2026-10-23 · Founder selection: use the 11 choices recorded in the [canonical shortlist](../product/leave-types-review.md#vac-5-shortlist-selection--pending-review); study/examinations is tentative and postgraduate/doctoral exams are not shortlisted. Count childcare once. Order and surfaces remain open.
- D-4 · 2026-10-23 · Founder direction / specification: shortlist dependent illness for children only. Proposed label: Child illness (dependent illness). Preserve the reference rule and one underlying allowance.
- D-5 · 2026-10-23 · Founder requested sick leave, expanding D-2's presentation-only scope to include specification of this new type. Inclusion is selected; policy/allowance approval is still pending and no figures are inferred.
- D-6 · 2026-10-23 · Founder authorized the recommendations as provisional implementation defaults, superseding the implementation hold in D-3/C-3. Implement the [12-type order and shared behavior](../product/leave-types-review.md#vac-5-shortlist-selection--pending-review) while preserving every open question for revision.
- D-7 · 2026-10-23 · Limited sick-leave implementation: checked official research is documented, but no statutory rule/allowance is approved. Provide an unknown-balance preview with illustrative working-day input; no entitlement/payroll calculation, diagnosis or proof collection. This narrows the earlier requirement for a complete rule specification before any preview.
- D-8 · 2026-10-28 · Founder: the request chooser retains annual/sick-first ordering. My balances instead promotes annual and, for parents, school attendance, childcare and parental; sick, maternity, paternity, voting and military appear lower. Display order does not change eligibility, shortlist membership or entitlements.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft shortlist outcome and regression scenarios | Unknown | No issue-specific duration captured; founder brief/source links above. VAC-1 historical time excluded. |
| W-2 | 2026-10-23 | Codex / assistant recorded | Record founder selection, child-only scope, tentative study inclusion and sick-leave specification gap | Unknown | Current founder instruction; canonical review, C-3 and D-3–D-5. No issue-specific duration captured. |
| W-3 | 2026-10-23 | Codex / assistant recorded | Implement provisional shared shortlist, preserve selection/drafts, research sick-leave preview, extend acceptance checks and update documentation | Unknown | Founder authorization; C-4, D-6–D-7; mock sources and verification below. No complete issue-specific duration captured. |
| W-4 | 2026-10-23 | Codex and independent review agent / assistant recorded | Review changes before commit, close draft-preservation test gap, run local QA and packaging/configuration checks | Unknown | Founder review request; C-5 and local verification record. Parallel review duration was not measured; no totals inferred. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; shortlist membership, size and affected surfaces need review. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

- H-2 · 2026-10-23 · Codex: Recorded shortlist membership and updated acceptance scope. Remains Specification pending study inclusion, sick-leave rules, order and surfaces; no UI or release change.

- H-3 · 2026-10-23 · Codex: Specification → In progress. Founder authorized the recommendations provisionally and explicitly requested that questions stay open. Existing prerequisite verified; implementation covers mock presentation and unknown-allowance sick leave.
- H-4 · 2026-10-23 · Codex: In progress → QA. Fixture checks, complete local Chrome acceptance and desktop/mobile visual inspection passed; implementation is ready for review. Product questions remain open by request. No commit, cloud build or deployment is claimed.
- H-5 · 2026-10-23 · Codex: Independent pre-commit review found no blockers; strengthened end-date/hour-unit coverage and recorded local QA/package checks. Status remains QA pending hosted CI/release checks. No commit or deployment performed; all product questions remain open.

## Verification and release

Implemented locally; [verification record and screenshots](media/VAC-5/verification.md) cover all 12 demo accounts, 12 shortlist defaults, 30 entries / 29 requestable rule panels, native keyboard controls, pinned uncommon selections/examples, preserved drafts, account resets/history, units/projections, shared privacy and A/B/C mobile overflow. Desktop/mobile images were visually inspected. Original allowance/rule/source fields remain intact; child illness adds a request scope and sick leave has no numeric quota. Syntax, fixture and documentation consistency checks passed. Status is QA for review; the existing Azure deployment still serves VAC-6. Hosted Angular/.NET build and deployment were not run for this local mock change.

## Open questions and follow-up

**OPEN FOR REVISION — retained at the founder's request.** Current defaults are authorized for implementation, not final answers: include study (12 choices), annual/sick first then groups, request and balance surfaces, same list for every persona, pinned uncommon selection. Sick allowance/eligibility/pay remain unknown. These questions are not current blockers within that limited mock scope.

1. Should tentative study/examinations be included, making 12 choices rather than 11? What is the final display order? Postgraduate/doctoral exams remain excluded.
2. Should the same shortlist control request selection, balance cards and example actions, or only the request form?
3. Should every demo persona use the same reviewed list? Per-person favorites and automatic ranking are outside scope unless separately requested.
4. Should collapsing retain a visibly pinned uncommon selection or keep the full list open while that type is selected?
5. What reviewed source and mock rules should define sick leave, including allowance/duration, eligibility, pay, units/period, evidence and balance display?
