# Calendar mock gallery

Status: PROPOSED design, 2026-10-22. Published for review at [the Azure site](https://lemon-beach-02f7a7103.4.azurestaticapps.net); direction selection remains open. See the [deployment record](../../cloud-deploy-2026-10-22.md).

The login/index/favicon update below is verified locally and recorded for review. It has not been pushed or deployed. The Azure site still serves the preceding gallery version.

The site opens a mock login, then lands on `/index.html`. Use `user / user` or `admin / admin`; sign out from the top bar or account dialog. Both accounts preview the same fictional company with a role label, not a new permission model. Compare A/B/C at the top and try all scopes and calendar granularities. No Angular build is needed for local review:

```sh
python3 -m http.server 8000 --directory docs/design/calendar-mock/dist
```

Open `http://localhost:8000/`. The browser needs tab storage for the mock session.

| Direction | Starting view | Preview |
|---|---|---|
| A — Calendar workspace, recommended | Own month, with personal summary | [Desktop](previews/a-desktop.png) · [Mobile](previews/a-mobile.png) |
| B — Team planner | Product team, people rows across the week | [Desktop](previews/b-desktop.png) · [Mobile](previews/b-mobile.png) |
| C — Personal overview | Own twelve-month year | [Desktop](previews/c-desktop.png) · [Mobile](previews/c-mobile.png) |

Use A as the proposed main shell, B as a candidate team layout, and C as a candidate annual layout. Direction selection remains open. The [UI-architect proposal](../calendar-ui-proposal.md) records sources, assumptions, component boundaries and acceptance scenarios; it follows the [repository agent prompt](../../../.github/prompts/agents/ui-architect.agent.md). Visual inspiration: [absence.io vacation tracker](https://www.absence.io/en/features/vacation-tracker/), inspected 2026-10-22.

## Mock boundaries

Brand choice, 2026-10-22: use the founder-selected teal **v** as an SVG favicon on login, calendar/index and Angular pages. The matching assets in `dist/favicon.svg` and `web/public/favicon.svg` are included in their respective packages. Acceptance: every page references the SVG and the frontend package contains it. This asset change has no customer-data or tenant-isolation behavior.

All names, teams, balances and requests are fictional. Today uses 22 October 2026. Weeks start Monday as a display assumption; shaded weekends do not establish company working days. Week/day are all-day views. Colleague fixtures contain availability only; the viewer's personal summary remains their own when changing scope. The demo request previews dates without calculating entitlement, saving data or calling an API. Navigation opens illustrative dialogs.

CI uses `scripts/package-design-preview.py` to make this gallery the actual root `index.html`, preserving Angular's entry as `app.html` for its existing deep links. Older `/design-preview/` links redirect to the index. The browser's mock login stores only a demo username in `sessionStorage`; passwords are not saved or sent. This is a UI demonstration, not server authentication, authorization or company isolation. Production permission rules, real balances, company calendars and supported leave units remain open. Browser-side fixture filtering and the demo role are not authorization controls.

The [INE/GSEE leave-type summary](../../product/leave-types-review.md) awaits the founder's review. No changes to vacation types, examples or request-form choices are part of the login update.

## Verification

Run with Node.js 22+ and a local Chrome installation:

```sh
node docs/design/calendar-mock/verify.mjs
```

The script defaults to the macOS Chrome executable. Set `CHROME_BIN` for another installation. It launches a temporary HTTP server/browser profile, checks behavior through the Chrome DevTools Protocol, captures eight PNGs into `previews/`, and closes its server/browser. Set `MOCK_URL` to a live index URL and `MOCK_SCREENSHOT_DIR` to another output directory to verify the deployed site.

Passed on 2026-10-22 with Node 22.22.3 / Chrome 150:

- Twelve scope/view combinations render and expose the selected state.
- Anonymous index access redirects to login; invalid credentials fail; both exact credential pairs land on the index with the correct demo role. Reload preserves the tab session; sign-out clears it and restores the login prompt.
- Shared calendar content and detail dialogs contain no private request category or approval status.
- Own and empty date details, Escape dismissal and focus return work.
- Next year crosses into 2027; Today returns to 2026; demo request states no submission occurred.
- All four granularities in each direction fit a 375 px viewport without document overflow.
- Eight desktop/mobile screenshots rendered without JavaScript exceptions; the new login previews were visually inspected.
- JavaScript syntax and `git diff --check` pass.

Limits: this is not a complete keyboard, screen-reader or contrast audit. Backend tenant isolation and authorization scenarios are specified in the proposal and remain untested because the mock has no backend. The separate deployment record covers cloud verification.

Acceptance boundary: this update passes only demo navigation/session and fictional-data scenarios. The two accounts have no customer/company identities; real cross-company authorization tests remain required before business endpoints or employee data are added.
