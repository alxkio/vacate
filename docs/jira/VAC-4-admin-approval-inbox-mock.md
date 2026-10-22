---
id: VAC-4
type: story
summary: Preview an administrator-only leave approval inbox
status: specification
created: 2026-10-23
updated: 2026-10-23
parent: null
depends_on: [VAC-6]
---

# VAC-4 — Preview an administrator-only leave approval inbox

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As a demo administrator, I want an approval inbox so that I can review pending leave and explore a decision journey without losing organization context.

The founder confirms a temporary **admin-only** approval rule for the mock. This does not settle the company's production approver assignments, self-approval, manager authority or fallback rules. The current release only previews requests; adding an inbox must clearly distinguish existing fixtures from any newly agreed simulation.

## Scope

- Show fictional pending requests in an admin-only inbox, linked from [VAC-3](VAC-3-admin-overview-first-experience.md).
- Define the minimum review fields, request details, empty state and decision interactions before implementation. Real medical documents, sensitive reasons and evidence uploads are excluded.
- Allow approval only for demo administrators. Employees and any team-lead persona have no approval action under this temporary mock rule.
- **ASSUMPTION — proposed for review:** a simulated approve/reject journey is useful. Rejection, decision comments, persistence/reset behavior and effects on balances/calendar are not confirmed by the brief.
- No real request submission, persisted decision, balance ledger or API is included. If simulation changes fixtures, label it clearly and define exactly-once transitions and reset behavior before Todo.
- Multi-level chains, delegation, notifications, bulk actions and production audit storage are outside scope.
- Depends on [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) for per-person accounts, pending-request fixtures and the visibility matrix.

## Dependencies

Requires [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) for per-person accounts, explicit admin capabilities, pending-request fixtures and the reviewed visibility matrix.

Coordinate entry navigation with [VAC-3](VAC-3-admin-overview-first-experience.md); the inbox does not require the overview to be completed first. Self-approval and simulation effects remain decisions within this story.

## Acceptance scenarios

- [ ] Given an admin account, opening Approvals shows only the agreed fictional company's reviewable requests, with clear pending/empty states and no implied production authority.
- [ ] Given an employee or team-lead demo account, navigation, direct-entry and action attempts do not expose or execute approval controls under the temporary admin-only rule.
- [ ] Given a request, opening details displays only fields accepted for the admin persona; private medical explanations/documents are not fabricated or exposed.
- [ ] Given an administrator's own request, the inbox follows a separately confirmed self-approval rule; until then it does not silently enable self-approval or invent an alternate approver.
- [ ] Given a confirmed simulated decision, the UI follows the agreed preview/session persistence contract and says what was simulated. Reopening or repeating an action cannot apply the same transition twice.
- [ ] If balance effects are included after product agreement, approval moves a pending reservation to used exactly once without reducing available twice; rejected/cancelled reservations follow only agreed behavior. Otherwise balances remain unchanged and the UI states that limitation.
- [ ] Given account changes, a previously opened request or unsaved decision comment is not retained as another person's view; generic shared calendars do not expose private request details or decision notes.
- [ ] **Future server gate:** before real approvals, test both role and request ownership/scope on the server. Company A admins cannot list/read/decide B's requests through guessed IDs or payload changes; non-admin A accounts cannot decide A's requests. Verify concurrent/repeated decisions and company balance isolation. Mock controls do not satisfy this gate.

## Subtasks and responsibilities

### UX

- [ ] UX-1: Specify inbox/list/detail/empty states, minimum decision context and keyboard/focus behavior.
- [ ] UX-2: Review self-request, confirmation, reject/comment and reset flows with the product lead.

### UI

- [ ] UI-1: Build the admin-only mock inbox and role-aware navigation using agreed fixtures.
- [ ] UI-2: Implement only the agreed simulation states and effects, including duplicate-action prevention and explicit persistence messaging.

### Backend

Not applicable to the mock. Record future authorization, concurrency and transition invariants; no approval business endpoint is included.

### Database

Not applicable: no request/decision tables, balance mutations or stored comments are authorized by this story.

### QA and other responsibilities

- [ ] Product-1: Resolve admin self-approval, decision options and simulation effects before Todo; keep production approval policy open.
- [ ] QA-1: Verify admin/non-admin, own/other requests, pending/decided/empty states, duplicate actions, account changes and any agreed balance effects.
- [ ] Privacy-1: Review inbox fields against minimum necessary information; retain generic shared availability.
- Infrastructure: Not applicable; existing mock package is sufficient.

## Attachments and sources

- Founder instruction, 2026-10-23: approval requests view; temporarily admin only can approve. Related [idea note](../next-up.md).
- [Charter](../product/product-charter.md) and [MVP acceptance scenarios](../product/mvp-scope.md), 2026-10-20: assigned authorization, self-approval/fallback unresolved, reservation-to-used exactly once.
- [Released mock boundaries](../release-2026-10-22-leave-mock.md), 2026-10-22: requests do not save or change balances; approvals not implemented.
- [Approved mock balance reference](../product/leave-types-review.md), 2026-10-22: units/periods stay separate; no automatic statutory eligibility engine.
- No new attachments needed.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: Temporary admin-only approval is confirmed for the prototype. It does not replace the charter's unresolved production approver/self-approval policy.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for mock: the approval journey is temporarily restricted to administrators; team leadership alone does not grant approval rights.
- D-2 · 2026-10-23 · Existing source boundary retained: real requests, approvals and ledger changes are outside the released mock. Any simulation effects need explicit agreement; see [release record](../release-2026-10-22-leave-mock.md).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft approval inbox scope, boundaries and scenarios | Unknown | No issue-specific timing captured; founder brief/source links above. VAC-1 historical time excluded. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; self-approval, decision options and persistence/effects remain open. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

## Verification and release

Specification only. Acceptance scenarios are unexecuted; there is no approval implementation or release evidence for this issue. On 2026-10-23, document checks passed for matching metadata/heading/backlog, valid local link targets, unique issue allocation and whitespace.

## Open questions and follow-up

1. Can administrators decide their own requests in the mock? If not, what should the blocked/alternative-review state show?
2. Should this iteration simulate approval only, or also rejection and optional comments?
3. Should decisions be preview-only or session-only? What resets them, and should balances/calendar reflect a simulated decision?
4. What fields and request scopes may HR versus owner review? Production assigned approvers and fallback routing remain separate decisions.
