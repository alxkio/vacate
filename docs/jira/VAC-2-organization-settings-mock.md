---
id: VAC-2
type: story
summary: Preview organization settings for a demo administrator
status: specification
created: 2026-10-23
updated: 2026-10-23
parent: null
depends_on: [VAC-6]
---

# VAC-2 — Preview organization settings for a demo administrator

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As a demo company administrator, I want an organization settings page so that I can review how company configuration will be presented before real configuration and persistence are built.

The founder requested an organization settings page on 2026-10-23. Which fields are editable, who administers them and how changes persist are not yet decided. This story specifies the next synthetic mock iteration; it does not approve a production settings schema.

## Scope

- Provide a settings destination within the existing mock shell, using the selected fictional company context.
- Show the confirmed five-day, Monday–Friday mock workweek as the current demo configuration. Changing this basis is outside this story until explicitly agreed.
- **ASSUMPTION — proposed for review:** organization display name and a read-only workweek summary are a useful minimum. Time zone, holidays, department/team configuration and leave-policy settings are candidates, not accepted fields.
- Agree the field list, validation, access and save/reset behavior before moving to Todo. If editing is preview-only, the interface must say so; it must not claim that company settings were saved.
- Real organization APIs, database tables, statutory defaults, identity administration and arbitrary hierarchy editing are outside scope. Changes to company leave policy require their own approved source and scope.
- Depends on [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) for fictional company/account context; coordinate navigation with [VAC-3](VAC-3-admin-overview-first-experience.md).

## Dependencies

Requires [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) for the reviewed fictional company, account context and admin-capability fixtures used by settings.

Coordinate navigation with [VAC-3](VAC-3-admin-overview-first-experience.md); its completion is not an implementation prerequisite. Settings fields, access and persistence still need their own decisions.

## Acceptance scenarios

- [ ] Given an authorized demo administrator, opening organization settings shows the active fictional company and the agreed field set with clear editable/read-only states.
- [ ] Given an ordinary employee account, opening navigation or attempting the settings route/action yields the agreed unavailable/read-only state without exposing admin-only values or applying changes.
- [ ] Given a settings edit, preview/save/reset and invalid input behave according to the agreed persistence contract; the UI explains any session-only or non-persistent behavior.
- [ ] Given the existing mock calendar and leave examples, opening or resetting settings preserves the five-day reference and does not silently recalculate balances, holidays or entitlement.
- [ ] Given sign-out and sign-in as another fictional account/company, unsaved settings and the previous account's selected context do not appear as that account's configuration.
- [ ] **Future server gate:** before using real company data, test that users/admins of company A cannot read or update B's settings by route, API, payload or guessed identifier. Browser fixture filtering alone is not authorization; these server checks are not exercised by this mock.

## Subtasks and responsibilities

### UX

- [ ] UX-1: Review the minimum field list, information grouping, edit permissions and save/reset states with the product lead.
- [ ] UX-2: Specify narrow-screen layout, field labels, validation and focus/error behavior.

### UI

- [ ] UI-1: Add the settings page and appropriate role-aware navigation in the mock shell.
- [ ] UI-2: Bind approved synthetic settings and implement only the agreed preview/persistence behavior.

### Backend

Not applicable to the mock implementation. Document the future configuration authorization boundary; no business endpoint is authorized by this story.

### Database

Not applicable: no schema, migration or real company settings storage is included.

### QA and other responsibilities

- [ ] Product-1: Resolve the open settings decisions and record their accepted destination before Todo.
- [ ] QA-1: Verify admin/employee navigation, direct-entry behavior, account changes, validation, reset and mobile usability against the agreed states.
- [ ] Privacy-1: Confirm fixtures contain no real company/personnel information and note the untested server-isolation gate.
- Infrastructure: Not applicable; existing mock packaging remains the delivery route.

## Attachments and sources

- Founder instruction, 2026-10-23: “settings page for org”; related [idea note](../next-up.md).
- [Accepted company-first direction](../adr/0001-company-first-web-api.md), 2026-10-20; [charter](../product/product-charter.md) and [proposed MVP](../product/mvp-scope.md), 2026-10-20. These leave detailed company configuration open.
- [Released mock boundaries](../release-2026-10-22-leave-mock.md), 2026-10-22; [five-day mock configuration](../design/calendar-mock/README.md).
- No new attachments needed.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: The request establishes a settings page, not a field list or production policy. Kept Specification while those decisions remain open.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for planning: Create a story for organization settings in the next mock iteration. No implementation or production configuration decision is implied.
- D-2 · 2026-10-23 · Existing founder decision, retained: the current mock uses five working days, Monday–Friday; see the canonical [mock documentation](../design/calendar-mock/README.md).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft story from founder request and source documents | Unknown | No issue-specific duration captured; sources above. VAC-1 historical time is excluded. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; field scope, access and persistence need product review. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

## Verification and release

Specification only. Acceptance scenarios are unexecuted; no settings page has been built or released by this issue. On 2026-10-23, document checks passed for matching metadata/heading/backlog, valid local link targets, unique issue allocation and whitespace.

## Open questions and follow-up

1. Which fields belong in the first settings mock, and which can administrators edit?
2. Are HR and owner personas equivalent for settings, or do they need different permissions?
3. Should edits be a visual preview, session-only simulation or another explicitly agreed behavior? What should reset/reload do?
4. Should holidays, time zone, departments/teams and policy configuration be displayed here or left to later work?
