# Calendar first, personal balances alongside

Design date: 2026-10-24. Scope: the current static mock, with fictional accounts and data.

## Basis and decisions

- Founder feedback, 2026-10-24: lead with the calendar; put only annual balance at the top right; move the other balances to a separate page.
- Founder clarification, 2026-10-24: apply the requested current-profile gender/marital restrictions in the frontend mock now, through one country configuration for Greece across all mock companies. Company-specific policy comes later. These are product gates, not verified Greek legal rules.
- [Product charter](../product/product-charter.md): requests, balances and authorised availability are core journeys; policy must remain attributable.
- [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md): Angular/API direction and Azure hosting remain unchanged.
- [VAC-5](../jira/VAC-5-common-leave-types-chooser.md): preserve the current shortlist, Show all and uncommon-selection behaviour.

The A/B/C design comparison stays available. All three directions share the same information hierarchy; their calendar presentation and accent tokens remain distinct.

## Calendar page

Keep the shared top bar, left navigation, concise page heading and Request leave action. Calendar scope and period/view controls belong with the calendar.

Desktop content uses a wide calendar column and a narrower personal rail, aligned at the top:

| Main column, first in DOM | Right rail, second in DOM |
| --- | --- |
| Calendar controls, current period and calendar | My annual leave |
| Selected calendar view: year, month, week or day | Selected-date context and upcoming personal requests |

Remove the all-type balance section above the calendar. Annual is the only balance type on this page, including in Team planner direction B. Do not hide the personal rail in direction B.

The annual summary shows:

- Available / allocated **working days**, the period and percentage available.
- Used, pending and available counts with the existing horizontal segmented bar and text labels.
- A **View all balances** link to the balances page.

Use the signed-in person's allocation. Switching to team, department or organisation calendars never switches the personal card to another employee or an organisation total. Unknown allocation is labelled **To confirm**, without an invented zero or percentage.

At the single-column breakpoint, calendar remains first and the annual summary follows it, then the supporting panels. Keep DOM order consistent with visual and keyboard order. Never use CSS ordering to move balances above the calendar.

## My balances page

Add **My balances** to the shared navigation. Render a real page in the existing shell, not a dialog. Its title is **My leave balances**, followed by the own-account/demo context and existing grouped balance cards.

Retain the shortlist, Show all, expanded details, source/rule information, distinct units and periods, and supported example actions. Annual appears here as well. The allocation supplement remains an explanation of annual allocation, not a separate requestable quota.

Scope selectors are absent on this page: these are always the current person's balances. The page must not present private balances for selected colleagues, including for administrator personas.

## Navigation and state

Use shareable same-document routes such as `index.html?page=calendar` and `index.html?page=balances`; no new server rewrite requirement is needed. Preserve the design direction and calendar scope/view/group context when changing pages. Retain the selected period through page navigation where supported by the mock state.

- Direct load and refresh restore the requested page after the mock session check.
- Browser Back/Forward updates the displayed page, active navigation, title and heading coherently.
- Use normal links or correctly implemented history navigation; a selected CSS class alone is insufficient.
- Set the active navigation item's `aria-current="page"`.
- For an in-app page change, close the mobile navigation and focus the main heading/main landmark; do not steal focus during a calendar period change.
- Make the skip-link label and document title match the current destination.
- Logout/account changes continue to clear personal state; history restoration must recheck the current mock session.

## Eligibility presentation and future API boundary

Page and request components render the supplied eligibility decision; they do not contain their own gender/marital policy checks or infer facts from names or role titles. The central `leave-eligibility.js` facade evaluates explicit synthetic current-profile values against the shared Greece mock configuration, following the founder's clarified product direction. It does not require an upcoming qualifying event to make a type available in the mock. A future backend will own this policy evaluation and return the same decision shape. The intended mock contract has three states:

| Decision | Request and balance presentation |
| --- | --- |
| Eligible | Allow preview; show a numeric balance only when a separate valid allocation exists. |
| Not eligible | Omit from default personal choices; Show all identifies the type as unavailable, explains the reason, disables its request action/option and suppresses personal balance numbers. |
| To confirm | Label eligibility as unconfirmed, preserve access to the illustrative preview and show no implication that an entitlement is approved. |

Keep unavailable types discoverable through Show all, with text rather than colour as the only explanation. A disabled native select option needs an accessible nearby explanation; do not rely on a tooltip attached to the disabled option. Unknown and denied are distinct states.

Reason copy should be short and actionable, such as **Eligibility has not been confirmed** or **Not available under this demo policy**. Avoid exposing sensitive personal attributes or raw policy internals. An unknown allowance, an exhausted balance and an eligibility denial are separate concepts.

**PRODUCT DIRECTION CONFIRMED, legal scope still under review:** apply the founder's requested current-profile restrictions, including marriage, maternity/paternity and divorce-only single-parent gates, in the central mock policy rather than in individual components. Keep the exact revisable matrix in the [eligibility review](../product/leave-eligibility-review.md). Do not describe these restrictions as statutory entitlements: researched event, transfer and care-pathway exceptions remain documented there for later review. No real profile collection, birth-registry integration or evidence upload is added.

## Acceptance and verification

1. For A/B/C at desktop widths, calendar and annual card start in the same content row; the calendar has the wider column and annual is the first right-hand card.
2. At mobile widths, visible calendar content precedes the annual card and no horizontal page overflow occurs. Existing detailed-calendar-to-agenda behaviour remains available.
3. The calendar page contains no other balance type cards; My balances exposes the existing shortlist and Show all without losing expanded uncommon selections.
4. My balances works from navigation, annual link, direct query URL, refresh and browser Back/Forward; active navigation and focus are correct.
5. Scope changes preserve own annual figures. Account changes and denied/cross-company fixture queries never expose another person's balances or private request reasons.
6. Keyboard users can open navigation, reach both pages, operate balance details and Show all, and open/close request previews with focus restored.
7. Eligible, unavailable and unconfirmed fixtures render distinctly, including an accessible unavailable reason; denied types cannot start or finish an otherwise active preview.
8. Existing year/month/week/day, own/team/department/organisation permissions and generic shared availability continue to pass regression checks.

This document specifies expected behaviour; executed verification and release evidence belong in the linked issue records. No production entitlement, backend enforcement or accessibility conformance claim follows from the static mock.

## Open questions and risks

- **OPEN QUESTION:** review legal exceptions, policy applicability and evidence requirements before real policy enforcement. The clarified current-profile product gates are approved for this mock; source references remain separate from those product rules.
- **OPEN QUESTION:** keep the VAC-5 shortlist membership/order and page coverage revisable, as previously requested.
- **ASSUMPTION:** use one personal annual card for every persona, while preserving each persona's current default calendar scope.
- **Risk:** the extra rail reduces calendar width in direction B; use a single-column layout before its planner becomes unreadable and retain its bounded internal scroll/agenda fallback.
- **Risk:** eligibility and balance data are personal. The public mock may use synthetic values only; the future API must derive company/person identity from an authenticated context and enforce these decisions server-side.
