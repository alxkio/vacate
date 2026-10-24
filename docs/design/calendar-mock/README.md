# Calendar mock gallery

The A/B/C design study uses public, fictional people and data. UI direction remains open. [Azure dev](https://lemon-beach-02f7a7103.4.azurestaticapps.net) is the existing deployment target. The [VAC-6 release record](../../release-2026-10-23-vac-6.md) and [earlier leave mock release](../../release-2026-10-22-leave-mock.md) are historical evidence; the founder subsequently reported the VAC-5/VAC-7 deployment. This working copy adds VAC-8/VAC-9 and is not yet a new cloud release.

Current work: [VAC-8 calendar-first layout](../../jira/VAC-8-calendar-first-and-balances-page.md) and [VAC-9 eligibility boundary](../../jira/VAC-9-eligibility-contract-and-mock-decisions.md). Prior [VAC-5 verification](../../jira/media/VAC-5/verification.md) remains the historical shortlist baseline.

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

**Calendar-first revision:** Calendar is the main content, with only own annual balance at the top of the desktop right rail. At mobile widths the calendar precedes annual. **My balances** is a separate page in the same shell, reachable from navigation or the annual card, and directly at `index.html?page=balances`. Page navigation, refresh and Back/Forward retain calendar context and recheck the demo session. A/B/C alternatives remain.

**Eligibility revision:** [Authorized mock profile rules and the 30-type review list](../../product/leave-eligibility-review.md) use explicit fictional gender, marital, child and sole-care values in one shared GR configuration. No upcoming event is required to show/apply for a type. Known-unavailable types are hidden from default personal choices; Show all retains reference rules with disabled request actions. Unknown stays To confirm, without personal balance/projection numbers. `leave-eligibility.js` centralizes checks and returns the [backend-shaped decision contract](../../contracts/leave-eligibility.md); page components consume results. Other country packs, company overrides, birth registration, documents and real backend enforcement are later work. The mock shortcuts are not verified statutory defaults.

The mock uses a five-day, Monday–Friday workweek; holidays are not configured. The [catalogue and provisional defaults](../../product/leave-types-review.md) contain 30 entries and 29 requestable choices, with allowance/rule/source previews. This includes the new sick-leave preview with unknown allowance/pay; its statutory policy questions remain open. Disability supplements adjust annual allocation rather than becoming a separate request. The [balance design](../leave-balances-proposal.md) keeps Used/Pending/Available quantities, units and periods distinct. For Maya, annual is **25 allocated, 8 used, 3 pending, 14 available (56%)**. Each person's ledger reconciles to their fictional request quantities; it is not a statutory calculation.

Requests and the dedicated balances page use the same **12-type base shortlist**, filtered by the person's current mock eligibility: annual and sick first, then category groups. Known-unavailable types are excluded from defaults; unknown types remain. Study/examinations is provisionally included; postgraduate/doctoral exams remain under Show all. Dependent illness uses a child-only request label/scope with the original type ID and allowance. Show all exposes the full reference catalogue; returning to the shortlist preserves an allowed uncommon selection, dates, amount, unit and open rules. Expanded uncommon balance details remain inspectable. No account-specific favorites or inference from names is used. The earlier shortlist product questions remain revisable.

Requests preview manually entered quantities and dates without calculating working days, saving data or calling an API. Unknown eligibility/units show no invented quota; excess projections remain explicit. No real employee, medical, family or service-history evidence is used. All fixtures are public synthetic examples.

CI builds Angular and packages the gallery at root using `scripts/package-design-preview.py`, retaining Angular's entry as `app.html` for existing deep links. Older `/design-preview/` links redirect to the index. Packaging, routing, syntax and cloud-smoke checks include `demo-fixtures.js`, `leave-eligibility.js`, session/login scripts, the catalogue, CSS and the teal v favicon. Matching SVG favicons serve the mock and Angular pages.

## Verification

With Node.js 22+:

```sh
node docs/design/calendar-mock/verify-fixtures.mjs
node docs/design/calendar-mock/verify-eligibility-contract.mjs
node docs/design/calendar-mock/verify.mjs
```

The fixture command independently checks the expected 12-person roster, capabilities, exact memberships, denied IDs, shared projections, own request/allocation consistency, profile gates/missing facts/unsupported country and session behavior using Node's VM. The contract command uses AJV from the existing locked Angular tooling (`npm ci` in `web` first) to validate all 12 responses/360 decisions and reject unsupported status/medical fields. Both run in hosted frontend CI without a browser.

The browser command uses local Chrome through the Chrome DevTools Protocol and a temporary server/profile. Set `CHROME_BIN` for another executable, `MOCK_URL` to test a matching deployed revision and `MOCK_SCREENSHOT_DIR` for output elsewhere. It covers existing account/scope/privacy/catalogue/unit/date/keyboard history journeys plus calendar/annual alignment, mobile ordering, separate balances navigation/refresh/history, profile-dependent choices and denied/unknown/forged requests. Historical VAC-5/VAC-6 evidence applies to those revisions; new checks do not imply a cloud release.

This is targeted acceptance, not a full screen-reader/contrast audit. Server company isolation, real authentication, approvals/settings persistence, policy eligibility, accrual, carryover, rounding and holiday configuration remain future work.
