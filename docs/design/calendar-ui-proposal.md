# Calendar UI proposal

Status: PROPOSED — visual exploration; product-lead selection pending.  
Date: 2026-10-22  
Role: UI Architect, following the [repository UI-architect prompt](../../.github/prompts/agents/ui-architect.agent.md).

## Brief and evidence

The founder requested a top menu, left navigation, page container, a personal vacation calendar with year/month/week/day views, and team/organization scopes on 2026-10-22. The [absence.io vacation-tracker page](https://www.absence.io/en/features/vacation-tracker/) is the supplied visual reference. Its role here is layout inspiration; Vacate uses original styling and fictional content. A marketing reference does not establish Vacate's requirements or prove how the competitor's live application behaves.

Product boundaries come from [accepted ADR-0001](../adr/0001-company-first-web-api.md), the [product charter](../product/product-charter.md), and the [proposed MVP](../product/mvp-scope.md), all dated 2026-10-20. They take precedence over the historical examples in the agent prompt. The existing Angular shell contains Leave, Approvals, Availability and People routes; these can remain the navigation destinations when implementing a selected design.

## Recommendation

Choose **A — Calendar workspace** as the default. It gives the calendar the most room and makes the three scopes easy to discover. Treat **B — Team planner** as a potential team-view layout and **C — Personal overview** as a potential year-view layout rather than committing to three separate applications. The gallery presents them as alternatives so the founder can compare the main workspaces before accepting a direction.

All directions share the same shell and calendar state: selected scope, date and granularity. In the comparison gallery, each direction opens its representative scope/view; scope and granularity controls then preserve the selected date. A future in-app layout switch should preserve state where supported. No backend behavior, entitlement rule or production navigation change is approved by this proposal.

| Direction | Main layout | Best suited to | Tradeoff |
|---|---|---|---|
| **A. Calendar workspace — recommended** | Wide calendar; compact right panel for own upcoming requests and illustrative balance | Employees checking dates and team availability | A dense organization can exceed the useful detail of month cells; show a count and open the day's permitted entries |
| **B. Team planner** | Names pinned on the left; dates across the top; absence bars in each person's row | Seeing who is away together across a team | Requires horizontal scrolling on smaller screens; an agenda alternative is necessary |
| **C. Personal overview** | Twelve compact month tiles; own requests and balance beside or below | Scanning personal plans across the year | Annual cells cannot hold readable organization detail; team/org needs aggregate counts with a detail view |

## Shared shell and visual language

Use a quiet, light canvas, white content surfaces, dark readable text, subtle borders and one restrained brand accent. Status badges contain text as well as color. A compact logo and company name anchor the shell; the company name is a label, not a company switcher. Initial accounts belong to one company under ADR-0001.

- **Top bar:** Vacate, current company label, contextual help and account control. Any control included in the mock must have a clear demo response or be visibly unavailable. Do not imply notifications are already implemented.
- **Left navigation:** Calendar, My leave, Approvals and People, with the last two permission-aware in production. Map Calendar to the existing availability route and My leave to the existing leave route if this direction is accepted. Settings is not required to judge the calendar.
- **Page header:** “Calendar”, a short scope description and a clearly primary “Request leave” action.
- **First toolbar:** scope selector **My calendar / Team / Organization**. Team scope includes a team selector when more than one permitted team is available. The current company is always the outer data boundary.
- **Second toolbar:** previous period, “Today”, next period, readable date heading, then **Year / Month / Week / Day**. Scope and granularity are different choices; neither should be buried inside the other.
- **Calendar container:** dominant content surface, persistent weekday/date labels, visible legend and a useful empty state. The right panel is secondary and can collapse before the calendar becomes cramped.

**ASSUMPTION:** Monday starts the mock's week for visual consistency. This is presentation data, not an approved company working calendar or jurisdictional default. An agreed display preference should replace it in implementation.

## Scope and granularity

| View | My calendar | Team / Organization |
|---|---|---|
| Year | Twelve month tiles; marked dates open own entries | Aggregate absence counts; a date opens authorized availability |
| Month | Date grid with concise own request labels and status | Permitted names or a count; “+N more” opens the selected date |
| Week | Seven all-day lanes with own absences | People/date rows or all-day availability lanes |
| Day | Selected date and own absence entries, with a clear empty state | List of permitted colleagues away on that date |

**ASSUMPTION:** Week/day use all-day absence lanes in this exploration. An hourly timetable would imply unconfirmed hourly-leave and work-schedule rules. Half days, hours, shifts and calculations remain open in the charter.

**ASSUMPTION:** Personal entries can display their own request type and proposed status text such as “Approved” or “Pending”. Team and organization entries show **“Away”** and permitted identity only. A colleague's illness category, notes, balance, approver commentary or private reason must never appear in a tooltip, accessible label or hidden markup.

The mock may demonstrate all scopes using fixtures. Production must only offer scopes and teams granted by the server. Hiding a control is not an authorization boundary. If access changes while a page is open, remove stale entries and show a neutral access message.

## Interactions and states

1. Changing scope keeps the selected date and granularity. Switching back to My calendar must not leave colleague entries in the details panel.
2. Choosing Year/Month/Week/Day changes the date heading and content together. Previous/next advances by the selected period. “Today” returns to the current date; the gallery uses a fixed demo date for repeatable review.
3. Selecting a date opens its entries with a readable date heading. A day with no entries states “No leave shown for this date”; it must not infer that everyone is working.
4. Selecting an own entry opens its date range and status. Selecting a colleague's permitted entry opens only availability details.
5. “Request leave” opens a clearly labelled illustrative form. The prototype does not calculate entitlement, reserve days, submit to an approver or persist personal information. Any completion message must say it is a demo.
6. Opening details on a small screen uses a full-width panel or dialog. Escape closes overlays and focus returns to the initiating button. Details must be available by click/tap/keyboard, not hover alone.
7. Loading, empty, unavailable and error states belong inside the content container and retain the current scope/date context. Production errors must offer a retry without claiming an absence or balance is zero.

Approval actions, multi-level approval chains, conflict scoring, statutory holidays, company switching, directory sync, recurring requests and automatic calculations are outside this mock. The historical agent prompt's examples do not authorize those features.

## Responsive and accessible behavior

At a wide desktop size, retain the full left navigation and side panel. At intermediate widths, collapse the side panel before reducing date-cell readability. At a narrow viewport, place the left navigation behind a labelled menu control, wrap toolbar controls and offer a readable agenda representation for the selected period. A planner may scroll within its own container with pinned person labels; the entire page must not require sideways scrolling.

Use semantic landmarks, one page heading, real buttons and selects, visible focus rings, text status labels and labels for icon-only date controls. Selected scope/view controls expose their selected state. Keep touch targets at least 48 CSS pixels where the layout permits; do not turn annual day numerals into tiny sole-purpose controls. A month tile can open that month, and an adjacent agenda/detail surface can expose entries accessibly. Announce scope/period changes in a concise polite live region without re-announcing the whole calendar.

If implementing a true interactive calendar grid, use a documented roving-focus pattern and arrow-key navigation. Otherwise prefer a semantic table with named entry buttons and an agenda companion rather than adding an ARIA grid role without its keyboard behavior. Avoid hundreds of tiny annual-date tab stops. Respect reduced-motion preferences. Contrast and screen-reader checks are verification work; the mock must not claim WCAG conformance merely because these requirements are listed.

## Proposed Angular component boundaries

These names describe potential implementation boundaries, not a new approved delivery scope.

| Component | Responsibility and state |
|---|---|
| `AppShell` | Top/side navigation, company label, mobile navigation state; receives allowed destinations |
| `CalendarPage` | Coordinates scope, display period, granularity, selected date and load state |
| `CalendarScopeSelector` | My/team/organization choices and permitted team options; emits a scope change |
| `CalendarToolbar` | Period label, previous/today/next and granularity control; emits navigation intents |
| `MonthCalendar` / `YearCalendar` | Date presentation; receives authorized display entries, never raw private requests |
| `WeekAvailability` / `DayAgenda` | All-day presentation and readable narrow-screen fallback |
| `TeamPlanner` | Optional person/date matrix with pinned labels and contained horizontal scroll |
| `CalendarEntry` | Identity/status labels, overflow and accessible name for the current projection |
| `CalendarDetailsPanel` | Selected date or entry details; receives the authorized projection only |
| `OwnLeaveSummary` | Own upcoming requests and illustrative balance; cannot reuse a colleague's balance |

Scope values should be domain identifiers such as `self`, `team` with a permitted team identifier, and `organization`. Do not accept a client-supplied company identifier as proof of company membership. Server-derived account scope must govern queries and the data returned. Separate private own-request projections from public availability projections so component reuse does not accidentally disclose fields.

## Acceptance scenarios

### Mock review

- **Shell:** At a desktop viewport, a reviewer can identify top navigation, left navigation, page title, scope and calendar period without opening a menu.
- **Alternatives:** Selecting each gallery direction produces its distinct primary layout and leaves the selected direction visibly indicated. The gallery clearly identifies fictional data and demo-only behavior.
- **Calendar controls:** Every available scope and Year/Month/Week/Day control changes the visible content and labels consistently. Previous, next and today work at the selected granularity, including crossing a year boundary.
- **Details:** Selecting a date reveals the correct fixture entries. Personal details show the person's own statuses; team/org details use generic availability and contain no private leave reasons.
- **Empty state:** A date with no fixture events displays an explicit empty state rather than a broken panel or a fabricated schedule claim.
- **Responsive:** At 375 px wide, essential controls remain usable, the calendar has a readable narrow-screen presentation, and document-level horizontal overflow is absent. At 1440 px wide, the calendar remains the dominant content.
- **Keyboard:** All controls work without a pointer, focus is visible, and opened dialogs can be closed with Escape and return focus. Selected view/scope state is exposed to assistive technology.
- **Demo request:** A reviewer can open the illustrative request form and dismiss it. Any simulated completion is labelled demo; no network submission or persistence occurs.

### Required before production calendar release

- With companies A and B seeded, an employee or administrator of A cannot retrieve B's dates, employees, team identifiers, entries, counts or detail records using guessed identifiers, altered query parameters or direct detail URLs.
- A user lacking organization-wide visibility cannot fetch the organization projection by calling its endpoint directly, changing a scope parameter or reusing another user's cached response.
- A colleague's availability payload and rendered/accessible markup contain no private reason, sickness category, note or balance. Employees' own-detail endpoints enforce ownership independently of the UI.
- Changing the signed-in account clears cached calendar data, details and pending requests before another account's content appears. Cache keys include the authorized account/company/scope context.
- A permission change or authorization failure clears stale protected content; it does not leave names or counts visible behind an error banner.

These server/isolation scenarios cannot be proven by a standalone fixture mock. They are release gates for the eventual authenticated implementation. No company isolation claim is made for this visual artifact.

## Decisions and open questions

**Confirmed brief:** navigation shell; personal/team/organization calendar exploration; year/month/week/day controls. **Proposed design decision:** A as the default, with B/C available for comparison. The founder has not yet selected a direction.

**ASSUMPTIONS:** fictional people and balances; all-day display; Monday-first presentation; generic colleague availability; side panel can collapse. These are reversible mock choices, not approved company rules.

**OPEN QUESTION — layout selection:** Choose A, B, C, or A with B as the team layout and C as its year layout.

**OPEN QUESTION — permissions:** Which roles may see a team, all company teams, employee identity or aggregate counts? What should a team mean for the pilot? Implement only a confirmed authorization model.

**OPEN QUESTION — calendar semantics:** Full day/half day/hour support, working calendar, first weekday, display locale and timezone remain to be agreed. An all-day date must not silently shift when viewed in another timezone.

**OPEN QUESTION — summaries:** Confirm the balance model and terms before showing real “available”, “reserved” or “used” totals. Illustrative numbers are not entitlement defaults.

## Verification record

The UI-architect prompt, accepted ADR, charter, MVP and existing Angular shell/routes were read on 2026-10-22. This document specifies acceptance and future authorization checks; it does not record them as passed. Prototype behavior, screenshots and any automated checks are recorded by the gallery author alongside the artifact. No Azure deployment or production Angular replacement is part of this design proposal.
