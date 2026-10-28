---
id: VAC-8
type: story
summary: Put the calendar first with an annual side card and a separate balances page
status: released
created: 2026-10-24
updated: 2026-10-28
parent: null
depends_on: [VAC-5]
---

# VAC-8 — Put the calendar first with an annual side card and a separate balances page

![Story](badges/story.svg) **🚀 Released** · Owner: Codex and Frontend Engineer

## Description

As an employee or administrator opening Calendar, I want the calendar to be the primary content, with only my annual balance in the upper right, so I can plan availability without scrolling past the full catalogue. Other personal balances belong on a dedicated page in the same shell.

Founder direction, 2026-10-24, supersedes the provisional VAC-5 choice to place the full shortlist above the calendar. Keep A/B/C alternatives and the five-day mock; do not choose a final design direction.

## Scope and dependencies

Requires [VAC-5](VAC-5-common-leave-types-chooser.md)'s available balance/type components and request previews; those outputs are verified in the working source even though its release evidence is still recorded as QA. Coordinate with [VAC-9](VAC-9-eligibility-contract-and-mock-decisions.md) for decision presentation; it is not a blocker for the layout.

- Calendar precedes the supporting rail in DOM and mobile layout; own annual card is first in the desktop right rail.
- Dedicated My balances destination with the existing shortlist, Show all, rule sources, separate units and example actions.
- Shareable query routes, active navigation, titles, focus, refresh and Back/Forward; retain calendar period/scope/context when moving between pages.
- Keep private annual/balances bound to the current account when viewing team/department/organisation availability.
- UI consumes supplied eligibility states; no gender/marital-status policy in layout code. No real API, persistence or approval actions. The founder subsequently authorized frontend-only dev deployment (C-3).

## Acceptance scenarios

- [x] A/B/C desktop puts the calendar in the main column and only annual at the top right, with no balance grid before the calendar.
- [x] At mobile widths the calendar precedes annual, and both calendar and balances pages fit without horizontal page overflow.
- [x] My balances works from navigation and annual link, direct load, refresh and browser Back/Forward; active item, title, heading/skip-link and focus agree.
- [x] Returning to Calendar preserves period, scope/view/group and design direction; regular calendar period changes do not steal focus.
- [x] All 12 accounts retain their own annual quantities; shared scopes and forged foreign IDs reveal no colleague balance or private eligibility.
- [x] Existing unit/projection/shortlist/selection, source rules, request keyboard controls and session-history checks remain covered.
- Real tenant isolation remains a future server gate; the static public mock adds no customer-data endpoints or security boundary.

## Subtasks and responsibilities

- UI Architect: [layout/navigation specification](../design/calendar-first-balances-proposal.md).
- Frontend Engineer: calendar/rail layout, balances page and responsive/navigation controls.
- QA: existing and new browser regression, screenshots, identity/privacy and keyboard checks.
- Backend/database: Not applicable to this presentation change; future decision boundary is VAC-9.

## Sources and attachments

- Founder feedback, 2026-10-24: calendar first, annual top right only, other balances on an extra page; explicitly request UI Architect and Frontend Engineer.
- [UI proposal](../design/calendar-first-balances-proposal.md), [mock README](../design/calendar-mock/README.md), [leave reference](../product/leave-types-review.md).

## Comments and decisions

- C-1 · 2026-10-24 · Codex: UI Architect and Frontend Engineer were delegated the requested design and implementation. The earlier 12-card calendar placement is replaced; shortlist membership remains revisable on the dedicated balances page.
- C-2 · 2026-10-24 · UI Architect independent source review: Calendar-first/rail/responsive routes and eligibility presentation are consistent. Found zero-allocation annual rendering and submit-session hardening gaps; the Frontend Engineer fixed both and added regressions. Final local browser QA and visual inspection passed.
- D-1 · 2026-10-24 · Founder direction: calendar first and annual-only side card; separate My balances page. Use query routes in the current shared mock shell rather than a new deployment resource.

- C-3 · 2026-10-25 · Founder authorized commit and Azure dev deployment; preserve frontend-only publishing and verify the hosted revision before marking Released.
- C-4 · 2026-10-28 · Founder direction, implemented under [VAC-19](VAC-19-calendar-display-preferences-and-balances.md): A is the only workspace; B's planner and C's palette are separate browser-local preferences. Every demo role can select generic organization availability. This later mock change does not alter the historical release evidence or production authorization.
- D-2 · 2026-10-28 · Founder: remove the A/B/C comparison and C year layout; keep A as the only workspace, B as a user-selectable planner layout and C's warm palette as an optional color scheme.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-24 | Codex, UI Architect and Frontend Engineer / assistant recorded | Design and implement calendar-first layout, personal balances navigation and regression coverage | Unknown | Founder feedback, delegated design doc and code changes. Parallel agent time unmeasured and not summed. |
| W-2 | 2026-10-25 | Codex / assistant recorded | Commit, push, monitor CI/frontend-only Azure dev release and run full live browser acceptance | Unknown | [Release evidence](../release-2026-10-25-calendar-eligibility.md). Shared release verification recorded here once; no measured duration. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded.

## History

- H-1 · 2026-10-24 · Codex: Created In progress for the authorized layout revision; existing prerequisite outputs inspected.
- H-2 · 2026-10-24 · Codex: In progress → QA after independent source review, complete local browser acceptance and visual inspection. Ready for user review; no commit/deployment performed.

- H-3 · 2026-10-25 · Codex: QA → Released for Azure dev application revision `0ca66c9`, after hosted CI, frontend-only deployment, exact revision check, complete live browser acceptance and visual review passed. [Release evidence](../release-2026-10-25-calendar-eligibility.md).

## Verification and release

[Local acceptance and screenshots](media/VAC-8/verification.md) record passing A/B/C desktop/mobile layout, routes/refresh/history/focus, all 12 identities, annual zero allocation, shared privacy and existing request/unit/date regressions. Syntax, schema/fixture, package and nine smoke-helper checks pass. That local record precedes deployment. [Hosted release evidence](../release-2026-10-25-calendar-eligibility.md) now records the exact Azure dev revision, successful CI/deployment and complete live browser acceptance; API publishing was skipped.

## Open questions

- The prior A/B/C direction question is resolved by the 2026-10-28 founder decision and implemented in [VAC-19](VAC-19-calendar-display-preferences-and-balances.md). VAC-5 shortlist membership remains revisable.
- Eligibility policy proposals are recorded separately in VAC-9 and do not block the independent layout change.
