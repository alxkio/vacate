---
id: VAC-3
type: story
summary: Lead the administrator experience with organization and team overviews
status: specification
created: 2026-10-23
updated: 2026-10-23
parent: null
depends_on: [VAC-6]
---

# VAC-3 — Lead the administrator experience with organization and team overviews

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an administrator reviewing company availability, I want organization, department and team overviews to be the primary experience so that I can see who is away before looking at my own leave.

The founder identifies HR personnel and company owners as possible admin personas and says overviewing is their common use case. This is product direction for the mock, not evidence from user research or approval of a production access model. Their exact differences need specification.

## Scope

- Make the demo administrator's landing and navigation prioritize company availability and accessible department/team views instead of personal balances and requests.
- Retain an explicit route to the administrator's own leave. Do not merge their own balances into company totals.
- Use the simple synthetic department/team fixtures agreed in [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md); no arbitrary hierarchy builder or production manager role is included.
- Link the approvals destination from [VAC-4](VAC-4-admin-approval-inbox-mock.md) and organization settings from [VAC-2](VAC-2-organization-settings-mock.md) without implementing those stories here.
- Keep shared calendars focused on availability. An overview role does not automatically reveal private leave categories, reasons, balances or evidence.
- **PO PROPOSAL / ASSUMPTION:** HR/operations and owner are two jobs sharing explicit admin capability, organization-first landing and generic company availability; the owner gets no additional permission tier. VAC-6 proposes employees land on own leave and non-admin team leads on department availability, with no lead approval rights. Review the [persona/fixture matrix](VAC-6-company-personas-and-visibility-fixtures.md#po-proposal--personas-and-fixture-company) before implementing these scopes.
- Existing A/B/C alternatives remain proposals; this story does not choose a final application-wide design.

## Dependencies

Requires [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) for the reviewed personas, department/team roster and per-account availability scopes.

Coordinate destination links with [VAC-2](VAC-2-organization-settings-mock.md) and [VAC-4](VAC-4-admin-approval-inbox-mock.md). Those features can be integrated as delivered; their completion is not required to implement the overview itself.

## Acceptance scenarios

- [ ] Given an admin demo login, the first content is the agreed organization overview with a visible active scope; personal leave is available through an intentional secondary action.
- [ ] Given an employee demo login, its personal-first starting experience is preserved rather than inheriting the previous administrator's landing state.
- [ ] Given an allowed department/team selection, the heading, people and availability update consistently; switching back restores the organization scope without stale rows or incorrect counts.
- [ ] Given an empty scope or date period, a clear empty state preserves the selected company/group context.
- [ ] Given shared calendar cards or detail dialogs, only approved availability fields appear; private leave types, medical details and another person's balance remain absent unless a separate explicit permission decision authorizes them.
- [ ] Given account/logout/scope changes, the previous account's personal balances, settings links and selections are cleared or rebound correctly; UI hiding and direct navigation follow the agreed demo visibility matrix.
- [ ] Given narrow-screen and keyboard use, the active scope, overview navigation and own-leave action remain reachable and understandable.
- [ ] **Future server gate:** before real data, users/admins of A cannot read B's overviews, people or availability through guessed IDs, query filters, exports or requests. The mock can demonstrate scope behavior but cannot establish server tenant isolation.

## Subtasks and responsibilities

### UX

- [ ] UX-1: Describe HR and owner jobs, default landing and the route to personal leave; compare with the employee journey.
- [ ] UX-2: Specify organization/department/team navigation, active-context labels, empty states and mobile behavior.

### UI

- [ ] UI-1: Implement the approved role-aware starting view and explicit own-leave navigation in the mock.
- [ ] UI-2: Connect fixture scope filtering, availability-only details and account-change reset behavior.

### Backend

Not applicable to this synthetic UI iteration. Record future overview query authorization requirements; no organization business API is included.

### Database

Not applicable: use fictional fixtures; do not introduce persisted hierarchy or employee records.

### QA and other responsibilities

- [ ] Product-1: Agree persona differences, default scope and visibility matrix with VAC-6 before Todo.
- [ ] QA-1: Verify admin/employee starting views, each group, empty periods, direct navigation, logout/account changes and personal-data separation.
- [ ] Privacy-1: Review every shared overview/detail field and document the future server isolation checks.
- Infrastructure: Not applicable beyond existing mock packaging.

## Attachments and sources

- Founder instruction, 2026-10-23: admin overview should primarily serve organization/department/team review; HR or owner are possible personas. Related [idea note](../next-up.md).
- [Charter](../product/product-charter.md), [proposed MVP](../product/mvp-scope.md) and [ADR-0001](../adr/0001-company-first-web-api.md), 2026-10-20: simple teams and permission-aware availability; complex hierarchies remain deferred.
- [Calendar design proposal](../design/calendar-ui-proposal.md) and [released mock](../release-2026-10-22-leave-mock.md), 2026-10-22: alternatives remain unselected; demo role is not authorization.
- No new attachments needed.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: Split overview/navigation from approvals so each outcome has clear scenarios. Persona and scope decisions are shared with VAC-6.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for mock: admin overview comes before personal leave; HR and owner are candidate personas, with details still open.
- D-2 · 2026-10-23 · Source boundary retained: department/team display uses limited fixtures; no production hierarchy or new real-data permission is approved by this issue. See [MVP boundary](../product/mvp-scope.md).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft admin overview outcome and scenarios | Unknown | Issue-specific duration not captured; founder brief and source links above. VAC-1 historical time excluded. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; persona scopes and landing details remain open. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

## Verification and release

Specification only. Acceptance scenarios are unexecuted and this admin-first experience is not released. On 2026-10-23, document checks passed for matching metadata/heading/backlog, valid local link targets, unique issue allocation and whitespace.

## Open questions and follow-up

1. Does each admin start at organization level or a remembered allowed scope?
2. What does an HR persona need that an owner does not, and do their visibility scopes differ?
3. Which overview facts are useful besides generic availability, without exposing private reasons or balances?
4. How should simple department/team navigation be presented while A/B/C direction selection remains open?
