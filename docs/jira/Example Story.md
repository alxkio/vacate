---
id: VAC-0
type: story
summary: Save a favourite calendar view
status: specification
created: 2026-10-22
updated: 2026-10-23
parent: null
depends_on: []
fictional: true
---

# VAC-0 — Save a favourite calendar view

![Story](badges/story.svg) **📝 Specification** · Fictional example · No assignee

**This issue, its scenario, comments and decisions are fictional. VAC-0 is reserved and excluded from the backlog and time totals.**

## Description

As an employee comparing calendar layouts, I want to save my favourite view so that I can return to it quickly during a demo.

For illustration, the fictional employee chooses “My calendar · Month” and presses **Save view**. A later visit within the same browser tab restores that choice. This is a sample specification; no feature is implemented or approved by this file.

## Scope

- Illustrative browser-tab preference only; all three calendar directions remain available.
- Account synchronization, a backend preference API and real employee records are outside this example.
- **OPEN QUESTION:** should the chosen month be remembered or reset to the current month?

## Dependencies

None. This fictional example illustrates an empty `depends_on` list and is excluded from the real dependency graph.

## Acceptance scenarios

- [ ] Given the fictional employee chooses their own month view, when they save and reload the tab, that scope and granularity are restored.
- [ ] Given they reset the preference, when the calendar reloads, the normal default appears.
- [ ] Given browser storage is unavailable, the calendar remains usable and explains that the preference was not saved.
- [ ] Given the demo account signs out, when another demo account signs in, the old preference is not inherited.

Tenant-isolation applicability: this fictional browser preference has no server data; a production preference API would additionally need cross-company and unauthorized-account access tests.

## Subtasks and responsibilities

### UX

- [ ] UX-1: Decide between restoring the saved date and opening the current month.
- [ ] UX-2: Define save/reset confirmation and storage-unavailable feedback.

### UI

- [ ] UI-1: Add keyboard-accessible Save view and Reset actions.
- [ ] UI-2: Restore the preference and clear it on sign-out.

### Backend

Not applicable to this fictional tab-only scenario; no API task is implied.

### Database

Not applicable; this example does not persist data on a server.

### QA and other responsibilities

- [ ] QA-1: Check restore/reset, unavailable storage and account changes at desktop/mobile sizes.
- [ ] Product-1: Resolve the date-restoration question before moving to Open / ready for action.

## Attachments and sources

- [Fictional UX note](media/VAC-0/favourite-view-notes.md).
- [Issue workflow](README.md).

## Comments

| Entry | Date | Author / role | Comment |
|---|---|---|---|
| C-001 | 2026-10-22 | Fictional reviewer | Example only: returning to a saved view should not hide today's date. |

## Decisions

| Entry | Date | State / owner | Decision and basis |
|---|---|---|---|
| D-001 | 2026-10-22 | Fictional example | Keep this illustration in browser-tab storage; it creates no product commitment. |

## Work log

No real work time is attributed to VAC-0. An illustrative entry would contain `WL-001 · date/range · actor · activity · duration · human actual / assistant recorded / automation elapsed / estimate · evidence`. Human time: **Unknown**. No fictional duration enters any total.

## History

| Date | Actor | Change / reason |
|---|---|---|
| 2026-10-22 | Codex | Created this fictional Specification example at the founder's request. No implementation or release. |

## Verification and release

No application acceptance checks or deployment: specification example only. Document format, links and exclusion from the real backlog are checked with the Jira-folder setup.
