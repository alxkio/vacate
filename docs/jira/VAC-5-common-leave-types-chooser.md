---
id: VAC-5
type: story
summary: Show common leave types first with an explicit show-all action
status: specification
created: 2026-10-23
updated: 2026-10-23
parent: null
depends_on: [VAC-1]
---

# VAC-5 — Show common leave types first with an explicit show-all action

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an employee choosing leave, I want a short initial list of commonly repeated types and an obvious way to browse the full catalogue so that I can find routine choices without scanning every reference type.

The founder says the list is too long and requests a limited default view with an expansion action. No usage data has established which types are most popular. The initial shortlist and order must be reviewed rather than presented as measured popularity.

## Scope

- Apply a product-approved shortlist to the request-type chooser; agree whether balance cards and per-type example actions should use the same list.
- Provide a labelled, keyboard-accessible **Show all leave types** action and a clear way to return to the short view, without losing an already selected type.
- Retain all 29 approved catalogue entries and the existing distinction of 28 requestable choices. The disability supplement remains explanatory, not an independently requestable allocation.
- Preserve the selected type's allowance/rule/source panel, units, unknown/excess projection behavior and five-day reference basis. Shortlisting changes presentation only; it grants no eligibility and removes no catalogue rule.
- **ASSUMPTION — proposed starting point:** discuss annual leave and other repeatedly relevant company types using existing fixtures; do not automatically adopt the current three balance cards as the final shortlist.
- General sickness or discretionary unpaid leave are not added merely because they may sound common; their catalogue/policy questions remain open in the approved reference.
- No usage tracking, personalized ranking, inferred family/medical eligibility or statutory entitlement calculations are included.
- Coordinate example/account coverage with [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md); independent of the admin inbox.

## Dependencies

Requires the released [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) request form and approved catalogue/rule panels to refine. This prerequisite is already available.

Coordinate per-person examples with [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md), but the shortlist can be implemented against existing fixtures independently. Its membership and affected surfaces still need review.

## Acceptance scenarios

- [ ] Given a new request form, the initial chooser shows only the agreed short list in its reviewed order, with an obvious Show all action; it does not label rankings as measured usage.
- [ ] Given Show all, every requestable catalogue type becomes reachable with its correct label/group; the non-requestable disability supplement is not accidentally enabled.
- [ ] Given a less-common type selected from the full list, returning to the short view or opening its rules preserves and visibly identifies the selected value; it never silently substitutes another type.
- [ ] Given any type selected from either view, its own allowance/rule panel, unit and projection behavior remain correct; no hidden choice inherits another type's amount or entitlement.
- [ ] Given keyboard and mobile use, expansion/collapse, focus and selection are operable and announced meaningfully; the shorter list and rule content fit without horizontal overflow.
- [ ] Given logout/login or a different scope/account, shortlist behavior follows the agreed shared-default contract without retaining the previous account's selection or inferring sensitive eligibility.
- [ ] Given unknown balances, different units or event/schedule types, the existing explicit limits remain visible; the reduced list does not manufacture zero balances or combine units.
- [ ] Tenant isolation is not exercised by the presentation-only mock. **Future server gate:** if company-specific catalogue/shortlist settings or request endpoints are added, test that A cannot load or change B's configuration, eligibility or requests through guessed identifiers. No browser list filtering is an authorization control.

## Subtasks and responsibilities

### UX

- [ ] UX-1: Review shortlist count, entries, order, placement and wording with the product lead; distinguish chosen defaults from verified popularity.
- [ ] UX-2: Specify show-all/collapse, selected-hidden-type, empty/search behavior if needed and accessible focus handling; search is not assumed required.

### UI

- [ ] UI-1: Add the approved short/default and full-catalogue presentation without duplicating type metadata.
- [ ] UI-2: Preserve selection, validation, per-type rules and disabled supplement behavior across expansion and account resets.

### Backend

Not applicable: no ranking, analytics, preference or eligibility endpoint is included.

### Database

Not applicable: no persisted favorites, usage history or company shortlist table is included.

### QA and other responsibilities

- [ ] Product-1: Approve the short list and surfaces before Todo; retain unresolved additional-type questions separately.
- [ ] QA-1: Verify every requestable type remains available; test shortlist/full-list toggles, uncommon selections, distinct units, keyboard/mobile and account changes.
- [ ] Privacy-1: Confirm no family/health profile or colleague activity is used to infer which types a person should see.
- Infrastructure: Not applicable beyond existing mock packaging.

## Attachments and sources

- Founder instruction, 2026-10-23: shorter default list of frequently repeated types, with an action to show all; related [idea note](../next-up.md).
- [Approved leave catalogue and unresolved additions](../product/leave-types-review.md), 2026-10-22.
- [Current balance design](../design/leave-balances-proposal.md) and [mock behavior/verification](../design/calendar-mock/README.md), 2026-10-22.
- [Release boundary](../release-2026-10-22-leave-mock.md), 2026-10-22: fictional data, reference rules, preview only.
- No new attachments needed.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: The current balance area already starts with three cards, while the request selector contains the wider catalogue. The exact surfaces for this refinement need review; the request chooser is the proposed primary target.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for mock: provide a short default list and explicit access to the complete type catalogue.
- D-2 · 2026-10-23 · Existing approved catalogue retained: this is a presentation change, not approval of new types, different allowances or eligibility defaults. See [canonical leave reference](../product/leave-types-review.md).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft shortlist outcome and regression scenarios | Unknown | No issue-specific duration captured; founder brief/source links above. VAC-1 historical time excluded. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; shortlist membership, size and affected surfaces need review. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

## Verification and release

Specification only. Acceptance scenarios are unexecuted; no new shortlist behavior has been built or released by this issue. On 2026-10-23, document checks passed for matching metadata/heading/backlog, valid local link targets, unique issue allocation and whitespace.

## Open questions and follow-up

1. Which types, how many and in what order should appear initially? The initial choice is a product assumption, not a usage-based ranking.
2. Should the same shortlist control request selection, balance cards and example actions, or only the request form?
3. Should every demo persona use the same reviewed list? Per-person favorites and automatic ranking are outside scope unless separately requested.
4. Should collapsing retain a visibly pinned uncommon selection or keep the full list open while that type is selected?
