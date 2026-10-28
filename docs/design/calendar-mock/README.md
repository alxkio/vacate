# Calendar mock gallery

The A/B/C screenshots below are a historical design study using public, fictional people and data. Founder direction recorded in [VAC-19](../../jira/VAC-19-calendar-display-preferences-and-balances.md) now uses A as the only workspace, offers B's planner and C's warm palette as separate personal preferences, and allows all demo accounts to select the generic organization calendar. [Azure dev](https://lemon-beach-02f7a7103.4.azurestaticapps.net) is the existing deployment target. The [VAC-6 release record](../../release-2026-10-23-vac-6.md) and [earlier leave mock release](../../release-2026-10-22-leave-mock.md) are historical evidence; the founder subsequently reported the VAC-5/VAC-7 deployment. [VAC-8/VAC-9 release evidence](../../release-2026-10-25-calendar-eligibility.md) records application revision `0ca66c9`, successful frontend-only dev deployment and full live browser acceptance on 2026-10-25. The existing API version is retained.

The [VAC-10 Angular conversion release](../../release-2026-10-25-vac-10-angular.md) now serves this prototype from the single frontend workspace.

Prior implementation: [VAC-8 calendar-first layout](../../jira/VAC-8-calendar-first-and-balances-page.md) and [VAC-9 eligibility boundary](../../jira/VAC-9-eligibility-contract-and-mock-decisions.md). Prior [VAC-5 verification](../../jira/media/VAC-5/verification.md) remains the historical shortlist baseline.

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
| Employee | Own month | Own, team, organization | Own team |
| Non-admin lead | Department month | Own, team, department, organization | Teams in own department |
| Admin (HR or owner) | Organization month | Own, team, department, organization | All groups in the fictional company |

Each person sees their own requests, configured balances and upcoming entries. The personal area remains theirs while changing calendar scope. Maya has pending annual and per-child/month examples, Ravi has overlapping approved annual availability, Iris has study leave, Sam has no upcoming requests, and Nora has an own pending request. Shared calendars and dialogs show generic **Away**, not private type, status, title or balances. Every demo role can select organization scope; this fixture UI does not create production authorization. The People dialog follows the current calendar filter. Unsupported scope/group identifiers return an unavailable state. Admin-only Approvals and Organization settings are explicitly **Planned** placeholders; VAC-2 and VAC-4 implement those destinations later. There are no approval/self-approval actions or company-visibility settings writes; personal display choices persist only in browser storage.

No second company ships in this mock. Company/person/group mismatch tests exercise synthetic presentation boundaries; static fixture files remain publicly downloadable. These checks do not provide backend authentication, permissions or customer isolation. The older [persona hypotheses](../../product/personas-jtbd.md) remain research; a non-admin team lead cannot approve in this iteration.

## Local review

The interactive mock has been converted to Angular in [`frontend/src/app/features/`](../../../frontend/src/app/features). Use [`frontend/README.md`](../../../frontend/README.md) for build, preview and acceptance commands. `docs/design/calendar-mock` retains design documentation and historical preview images, not a parallel frontend implementation.

The fixed demo date remains **22 October 2026** for repeatable scenarios. The live UI uses the calendar workspace by default; display preferences are local to the browser and each demo account. The comparisons below remain historical screenshots.

| Direction | Calendar layout | Preview |
|---|---|---|
| A — Calendar workspace | Current single workspace; month by default | [Historical desktop](previews/a-desktop.png) · [Historical mobile](previews/a-mobile.png) |
| B — Team planner | Optional people-row layout preference | [Historical desktop](previews/b-desktop.png) · [Historical mobile](previews/b-mobile.png) |
| C — Personal overview | Layout retired; its warm brown palette is an optional color preference | [Historical desktop](previews/c-desktop.png) · [Historical mobile](previews/c-mobile.png) |

The [UI architect proposal](../calendar-ui-proposal.md) records the current selection and historical layout exploration. Role-aware initial scope remains independent of the now-user-selectable organization scope and does not deliver VAC-3's full admin dashboard refinement.

## Leave and packaging boundaries

**Calendar-first revision:** Calendar is the main content, with only own annual balance at the top of the desktop right rail. At mobile widths the calendar precedes annual. **My balances** is a separate page in the same shell, reachable from navigation or the annual card, and directly at `index.html?page=balances`. Page navigation, refresh and Back/Forward retain calendar context and recheck the demo session. B layout and C palette are independent local preferences; the C year-view is retired.

**Eligibility revision:** [Authorized mock profile rules and the 30-type review list](../../product/leave-eligibility-review.md) use explicit fictional gender, marital, child and sole-care values in one shared GR configuration. No upcoming event is required to show/apply for a type. Known-unavailable types are hidden from default personal choices; Show all retains reference rules with disabled request actions. Unknown stays To confirm, without personal balance/projection numbers. `leave-eligibility.js` centralizes checks and returns the [backend-shaped decision contract](../../contracts/leave-eligibility.md); page components consume results. Other country packs, company overrides, birth registration, documents and real backend enforcement are later work. The mock shortcuts are not verified statutory defaults.

The mock uses a five-day, Monday–Friday workweek; holidays are not configured. The [catalogue and provisional defaults](../../product/leave-types-review.md) contain 30 entries and 29 requestable choices, with allowance/rule/source previews. This includes the new sick-leave preview with unknown allowance/pay; its statutory policy questions remain open. Disability supplements adjust annual allocation rather than becoming a separate request. The [balance design](../leave-balances-proposal.md) keeps Used/Pending/Available quantities, units and periods distinct. For Maya, annual is **25 allocated, 8 used, 3 pending, 14 available (56%)**. Each person's ledger reconciles to their fictional request quantities; it is not a statutory calculation.

Requests and the dedicated balances page use the same **12-type base shortlist**, filtered by the person's current mock eligibility. The request chooser keeps annual and sick first, then category groups; My balances uses the separate parent-aware display order in the [balance design](../leave-balances-proposal.md). Known-unavailable types are excluded from defaults; unknown types remain. Study/examinations is provisionally included; postgraduate/doctoral exams remain under Show all. Dependent illness uses a child-only request label/scope with the original type ID and allowance. Show all exposes the full reference catalogue; returning to the request shortlist preserves an allowed uncommon selection, dates, amount, unit and open rules. Expanded uncommon balance details remain inspectable. No account-specific favorites or inference from names is used. Shortlist membership remains revisable; its request order does not govern balance presentation.

Requests preview manually entered quantities and dates without calculating working days, saving data or calling an API. Unknown eligibility/units show no invented quota; excess projections remain explicit. No real employee, medical, family or service-history evidence is used. All fixtures are public synthetic examples.

CI builds the Angular frontend and publishes its index unchanged. `scripts/prepare-frontend.py` validates the output and writes a revision marker; it does not copy a static gallery or preserve a separate Angular app.html. Azure rewrites supported entry/deep links to the same Angular index, with no-store entry/configuration rules and the teal v favicon.

## Verification

See [frontend acceptance instructions](../../../frontend/README.md#acceptance). Fixture/schema checks run against the same imported domain factories used by Angular; full browser acceptance runs against the built Angular application and can target the deployed revision. Historical VAC-5/VAC-6/VAC-8/VAC-9 evidence applies to those revisions; VAC-10 records conversion verification separately.

This is targeted acceptance, not a full screen-reader/contrast audit. Server company isolation, real authentication, approvals/settings persistence, policy eligibility, accrual, carryover, rounding and holiday configuration remain future work.

### Own profile and membership settings (VAC-12)

The Angular mock now opens Settings from the sidebar or the profile-initials dropdown. Profile edits use the confirmed self-field allowlist, family defaults and married/sole-care exclusion; company membership remains read-only. Edits survive in-app navigation but reset on reload/sign-out, and refresh own provisional eligibility without changing ledgers or assuming divorce. Unknown employment/service/policy fields stay explicit. See the [user contract](../../contracts/user.md#current-mock-settings-implementation), [implementation issue](../../jira/VAC-12-profile-and-membership-settings.md) and [frontend acceptance instructions](../../../frontend/README.md#acceptance). No profile API or invitation flow is implemented.

### Admin organization pages (VAC-2)

Company admins can browse Organization, department and team views and rename each; the organization also has a five-/six-working-day setting. Edits are in-memory and reset on reload/sign-out. Internal structure is optional: departments/teams may be absent, teams may have no department, and members may belong directly to the organization. Organization calendar visibility is now available to all demo roles with generic availability only; organization administration remains admin-only. The existing five-day leave catalogue/ledgers remain reference examples rather than being silently recalculated. Standalone-team/cross-company organizations are future direction, not implemented permission exceptions. See [organization contract](../../contracts/organization.md), [VAC-2](../../jira/VAC-2-organization-settings-mock.md) and [frontend verification](../../../frontend/README.md#acceptance).
