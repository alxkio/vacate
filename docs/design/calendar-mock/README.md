# Calendar mock gallery

The A/B/C design study uses public, fictional people and data. UI direction remains open. VAC-6 revision `e87ada9` is deployed at [Azure dev](https://lemon-beach-02f7a7103.4.azurestaticapps.net), with hosted checks, cloud smoke and complete live browser acceptance passing. See the [VAC-6 release record](../../release-2026-10-23-vac-6.md) and [earlier leave mock release](../../release-2026-10-22-leave-mock.md).

## Demo accounts and company

VAC-6 models **Northstar Example**, a fictional 12-person IT-services company with two departments and four teams. Each person has one canonical public demo account. Choose a person on the login page, or enter their lowercase first name as both username and password (for example, **`maya / maya`**). These are public UI fixtures, not real accounts or secure credentials.

| Department / team | Person | Job | Demo username / password | Capability |
|---|---|---|---|---|
| Technology / Platform | Leah | Platform lead | `leah / leah` | Non-admin lead |
| Technology / Platform | Ravi | DevOps engineer | `ravi / ravi` | Employee |
| Technology / Platform | Noah | Software engineer | `noah / noah` | Employee |
| Technology / Applications | Maya | Software engineer | `maya / maya` | Employee |
| Technology / Applications | Theo | Software engineer | `theo / theo` | Employee |
| Technology / Applications | Iris | QA engineer | `iris / iris` | Employee |
| Business / Product | Ella | Product lead | `ella / ella` | Non-admin lead |
| Business / Product | Owen | Product designer | `owen / owen` | Employee |
| Business / Product | Zoe | Product specialist | `zoe / zoe` | Employee |
| Business / Operations | Daria | Owner | `daria / daria` | Admin |
| Business / Operations | Nora | HR/operations | `nora / nora` | Admin |
| Business / Operations | Sam | Operations coordinator | `sam / sam` | Employee |

Legacy shortcuts remain: **`user / user` → Maya**, **`admin / admin` → Nora**. These are aliases, not extra people/accounts. Firstname-based sign-in is specific to this public mock; real account/company-email username decisions in ADR-0001 remain unchanged. The site opens the mock login then `/index.html`; sign out from the top bar or account dialog. Session storage keeps only the canonical fictional person ID (`vacate.demo.account.v2`), never the password. Old/invalid identities are not trusted; reload and browser history restoration recheck the demo session.

| Capability | Initial calendar | Available scopes | Groups |
|---|---|---|---|
| Employee | Own month | Own, team | Own team |
| Non-admin lead | Department month | Own, team, department | Teams in own department |
| Admin (HR or owner) | Organization month | Own, team, department, organization | All groups in the fictional company |

Each person sees their own requests, configured balances and upcoming entries. The personal area remains theirs while changing calendar scope. Maya has pending annual and per-child/month examples, Ravi has overlapping approved annual availability, Iris has study leave, Sam has no upcoming requests, and Nora has an own pending request. Shared calendars and dialogs show generic **Away**, not private type, status, title or balances. The People dialog follows the current calendar filter. Unsupported scope/group identifiers return an unavailable state. Admin-only Approvals and Settings are explicitly **Planned** placeholders; VAC-2 and VAC-4 implement those destinations later. There are no approval/self-approval actions or settings writes.

No second company ships in this mock. Company/person/group mismatch tests exercise synthetic presentation boundaries; static fixture files remain publicly downloadable. These checks do not provide backend authentication, permissions or customer isolation. The older [persona hypotheses](../../product/personas-jtbd.md) remain research; a non-admin team lead cannot approve in this iteration.

## Local review

No Angular build is needed:

```sh
python3 -m http.server 8000 --directory docs/design/calendar-mock/dist
```

Open `http://localhost:8000/` with tab storage enabled. Compare A/B/C and the scope/granularity controls. The fixed demo date remains **22 October 2026** for repeatable scenarios, even when reviewing on another day.

| Direction | Calendar layout | Preview |
|---|---|---|
| A — Calendar workspace | Month by default; persona controls initial scope | [Desktop](previews/a-desktop.png) · [Mobile](previews/a-mobile.png) |
| B — Team planner | People rows across a week; same scope permissions | [Desktop](previews/b-desktop.png) · [Mobile](previews/b-mobile.png) |
| C — Personal overview | Twelve-month year; same scope permissions | [Desktop](previews/c-desktop.png) · [Mobile](previews/c-mobile.png) |

The [UI architect proposal](../calendar-ui-proposal.md) records the original layout alternatives and inspiration. Role-aware initial scope in VAC-6 does not choose a final A/B/C direction or deliver VAC-3's full admin dashboard refinement.

## Leave and packaging boundaries

The mock uses a five-day, Monday–Friday workweek; holidays are not configured. The [approved catalogue](../../product/leave-types-review.md) contains 29 entries and 28 requestable choices, with allowance/rule/source previews. Disability supplements adjust annual allocation rather than becoming a separate request. The [balance design](../leave-balances-proposal.md) keeps Used/Pending/Available quantities, units and periods distinct. For Maya, annual is **25 allocated, 8 used, 3 pending, 14 available (56%)**. Each person's ledger reconciles to their fictional request quantities; it is not a statutory calculation.

Requests preview manually entered quantities and dates without calculating working days, saving data or calling an API. Unknown eligibility/units show no invented quota; excess projections remain explicit. No real employee, medical, family or service-history evidence is used. All fixtures are public synthetic examples.

CI builds Angular and packages the gallery at root using `scripts/package-design-preview.py`, retaining Angular's entry as `app.html` for existing deep links. Older `/design-preview/` links redirect to the index. Packaging, routing, syntax and cloud-smoke checks include `demo-fixtures.js`, session/login scripts, the catalogue, CSS and the teal v favicon. Matching SVG favicons serve the mock and Angular pages.

## Verification

With Node.js 22+:

```sh
node docs/design/calendar-mock/verify-fixtures.mjs
node docs/design/calendar-mock/verify.mjs
```

The first command independently checks the expected 12-person roster, capabilities, exact memberships, denied IDs, shared projections, own request/allocation consistency, session/alias restoration and missing identity behavior using Node's VM. It runs in hosted CI without a browser.

The second uses local Chrome through the Chrome DevTools Protocol, starts a temporary server/browser profile and captures eight PNGs. Set `CHROME_BIN` for another executable, `MOCK_URL` to test the live index and `MOCK_SCREENSHOT_DIR` for output elsewhere. Interactive coverage includes all accounts/allowed scopes/groups, negative direct identifiers, own/shared views, account changes, stale state, the catalogue and unit/date regressions, keyboard dialog focus and mobile overflow. See the [release record](../../release-2026-10-23-vac-6.md) for actual results; planned checks are not release evidence.

This is targeted acceptance, not a full screen-reader/contrast audit. Server company isolation, real authentication, approvals/settings persistence, policy eligibility, accrual, carryover, rounding and holiday configuration remain future work.
