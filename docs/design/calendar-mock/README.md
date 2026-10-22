# Calendar mock gallery

Status: PROPOSED design, 2026-10-22. Published for review at [the Azure gallery](https://lemon-beach-02f7a7103.4.azurestaticapps.net/design-preview/index.html); direction selection remains open. See the [deployment record](../../cloud-deploy-2026-10-22.md).

Open [dist/index.html](dist/index.html) directly in a browser; it needs no Angular build, server, dependencies or network. Compare A/B/C at the top, then try all three scopes and Year/Month/Week/Day, previous/next/Today, date details and the illustrative request form. Each direction starts in its representative view; changing scope or period preserves the selected date.

| Direction | Starting view | Preview |
|---|---|---|
| A — Calendar workspace, recommended | Own month, with personal summary | [Desktop](previews/a-desktop.png) · [Mobile](previews/a-mobile.png) |
| B — Team planner | Product team, people rows across the week | [Desktop](previews/b-desktop.png) · [Mobile](previews/b-mobile.png) |
| C — Personal overview | Own twelve-month year | [Desktop](previews/c-desktop.png) · [Mobile](previews/c-mobile.png) |

Use A as the proposed main shell, B as a candidate team layout, and C as a candidate annual layout. Direction selection remains open. The [UI-architect proposal](../calendar-ui-proposal.md) records sources, assumptions, component boundaries and acceptance scenarios; it follows the [repository agent prompt](../../../.github/prompts/agents/ui-architect.agent.md). Visual inspiration: [absence.io vacation tracker](https://www.absence.io/en/features/vacation-tracker/), inspected 2026-10-22.

## Mock boundaries

All names, teams, balances and requests are fictional. Today uses 22 October 2026. Weeks start Monday as a display assumption; shaded weekends do not establish company working days. Week/day are all-day views. Colleague fixtures contain availability only; the viewer's personal summary remains their own when changing scope. The demo request previews dates without calculating entitlement, saving data or calling an API. Navigation opens illustrative dialogs.

CI packages this gallery beside the Angular build at `/design-preview/`; the Azure root redirects to its `index.html` for design review. Existing Angular routes remain available. No authentication, authorization or company isolation is implemented here. Production permission rules, real balances, company calendars and supported leave units remain open; see the proposal's release scenarios. Browser-side fixture filtering is not an authorization control.

## Verification

Run with Node.js 22+ and a local Chrome installation:

```sh
node docs/design/calendar-mock/verify.mjs
```

The script defaults to the macOS Chrome executable. Set `CHROME_BIN` for another installation. It launches a temporary browser profile, checks behavior through the Chrome DevTools Protocol, captures six PNGs into `previews/`, and closes the owned browser.

Passed on 2026-10-22 with Node 22.22.3 / Chrome 150:

- Twelve scope/view combinations render and expose the selected state.
- Shared calendar content and detail dialogs contain no private request category or approval status.
- Own and empty date details, Escape dismissal and focus return work.
- Next year crosses into 2027; Today returns to 2026; demo request states no submission occurred.
- All four granularities in each direction fit a 375 px viewport without document overflow.
- Six desktop/mobile screenshots rendered without JavaScript exceptions and were visually inspected.
- JavaScript syntax and `git diff --check` pass.

Limits: this is not a complete keyboard, screen-reader or contrast audit. Backend tenant isolation and authorization scenarios are specified in the proposal and remain untested because the mock has no backend. The separate deployment record covers cloud verification.
