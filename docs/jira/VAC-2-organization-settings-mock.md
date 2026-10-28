---
id: VAC-2
type: story
summary: Preview organization settings for a demo administrator
status: qa
created: 2026-10-23
updated: 2026-10-27
parent: null
depends_on: [VAC-6]
---

# VAC-2 — Preview organization settings for a demo administrator

![Story](badges/story.svg) **🔍 QA** · Owner: Unassigned

## Description

As a demo company administrator, I want an organization settings page so that I can review how company configuration will be presented before real configuration and persistence are built.

The founder requested this page on 2026-10-23 and explicitly authorized implementation on 2026-10-26: admin-only browsing/editing, company name, five/six working days, and department/team renaming. The current accepted direction is in the [charter](../product/product-charter.md#founder-request--admin-organization-pages-2026-10-26).

## Scope

- Admin-only Organization destination and department/team detail views in the existing Angular mock; existing shared calendar scopes are unaffected.
- Edit company name and workWeekDays (5 or 6), plus department/team names. Browse synthetic member names, job titles and system-role labels only.
- Save/reset validation; changes are memory-only and reset on reload/sign-out. Reject stale accounts, non-admins, cross-company identifiers and extra fields atomically.
- Workweek configuration is a mock setting. Existing five-day leave examples/ledgers remain explicitly labelled references; no statutory quota, holiday, request-day or historical balance recalculation is invented.
- Internal structure is optional: departments/teams may be empty; teams may be directly under the organization and members need not belong to a team. Existing fixture hierarchy is an example, not a requirement. No generic graph/group editor is introduced.
- Current page is a company-shaped organization. Standalone-team/cross-company organizations and groups are future direction explicitly deferred by the founder; no company-isolation exception or generic membership design is implemented.
- No create/delete/reparent/member-move, real business API/database, invitation flow, identity/role editor or deployment.
- Prior specification proposals for read-only five-day settings are superseded by the founder's 2026-10-26 direction.

## Dependencies

Requires [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) for the reviewed fictional company, account context and admin-capability fixtures used by settings.

Coordinate navigation with [VAC-3](VAC-3-admin-overview-first-experience.md); its completion is not an implementation prerequisite. The founder has selected the bounded fields/access above; memory-only persistence is consistent with VAC-12. Production persistence and six-day policy calculations remain separate work.

## Acceptance scenarios

- [x] Given an authorized demo administrator, opening organization settings shows the active fictional company and the agreed field set with clear editable/read-only states.
- [x] Given an ordinary employee account, opening navigation or attempting the settings route/action yields the agreed unavailable/read-only state without exposing admin-only values or applying changes.
- [x] Given a settings edit, preview/save/reset and invalid input behave according to the agreed persistence contract; the UI explains any session-only or non-persistent behavior.
- [x] Given the existing mock calendar and leave examples, saving five/six working days preserves explicitly labelled five-day leave references and does not silently recalculate balances, holidays or entitlement.
- [x] Given sign-out and sign-in as another fictional account/company, unsaved settings and the previous account's selected context do not appear as that account's configuration.
- [ ] **Future server gate:** before using real company data, test that users/admins of company A cannot read or update B's settings by route, API, payload or guessed identifier. Browser fixture filtering alone is not authorization; these server checks are not exercised by this mock.

## Subtasks and responsibilities

### UX

- [x] UX-1: Review the minimum field list, information grouping, edit permissions and save/reset states with the product lead.
- [x] UX-2: Specify narrow-screen layout, field labels, validation and focus/error behavior.

### UI

- [x] UI-1: Add the settings page and appropriate role-aware navigation in the mock shell.
- [x] UI-2: Bind approved synthetic settings and implement only the agreed preview/persistence behavior.

### Backend

Not applicable to the mock implementation. Document the future configuration authorization boundary; no business endpoint is authorized by this story.

### Database

Not applicable: no schema, migration or real company settings storage is included.

### QA and other responsibilities

- [x] Product-1: Resolve the open settings decisions and record their accepted destination before Todo.
- [x] QA-1: Verify admin/employee navigation, direct-entry behavior, account changes, validation, reset and mobile usability against the agreed states.
- [x] Privacy-1: Confirm fixtures contain no real company/personnel information and note the untested server-isolation gate.
- [ ] QA-2: Independently verify native organization keyboard navigation manually or on another host. The isolated local CDP diagnostic delivered no DOM key/pointer events in headless or visible mode; it has not passed.
- Infrastructure: Not applicable; existing mock packaging remains the delivery route.

## Attachments and sources

- Founder instruction, 2026-10-23: “settings page for org”; related [idea note](../next-up.md).
- [Accepted company-first direction](../adr/0001-company-first-web-api.md), 2026-10-20; [charter](../product/product-charter.md) and [proposed MVP](../product/mvp-scope.md), 2026-10-20. These leave detailed company configuration open.
- [Released mock boundaries](../release-2026-10-22-leave-mock.md), 2026-10-22; [five-day mock configuration](../design/calendar-mock/README.md).
- [Organization contract](../contracts/organization.md) and [verification/screenshots](media/VAC-2/verification.md), 2026-10-27.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: The request establishes a settings page, not a field list or production policy. Kept Specification while those decisions remain open.

- C-2 · 2026-10-26 · Codex: Founder authorized implementation and confirmed renaming departments/teams. Reuse VAC-2, not a new duplicate issue. Bounded mock scope excludes hierarchy/member mutations and six-day entitlement calculations.

- C-3 · 2026-10-27 · Codex: Implementation and complete default browser regression passed. Separate native organization keyboard diagnostic remains open because this host delivered no DOM key/pointer input despite focus/visibility reports; no independent security or release approval is claimed.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for planning: Create a story for organization settings in the next mock iteration. No implementation or production configuration decision is implied.
- D-2 · 2026-10-23 · Existing founder decision, retained: the current mock uses five working days, Monday–Friday; see the canonical [mock documentation](../design/calendar-mock/README.md).

- D-3 · 2026-10-26 · Founder: Organization administration pages are admin-only; allow company name and 5/6-day week, plus department/team renaming. Supersedes D-2's restriction on editable workweek configuration while retaining existing five-day policy examples. See charter.

- D-4 · 2026-10-26 · Founder clarification: Organizations may be companies with departments/teams/groups or standalone teams, including potential cross-company teams. Design this later. Earlier company=organization is only the current MVP mapping; broader direction is recorded in the charter/ADR and does not expand this implementation.

- D-5 · 2026-10-26 · Founder: Organizations may have no departments, teams or groups; structure is flexible. Read model and empty states must not force a department/team ladder. Current team.departmentId is optional and organization members are independent from team membership; generic group/graph design remains deferred.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft story from founder request and source documents | Unknown | No issue-specific duration captured; sources above. VAC-1 historical time is excluded. |

| W-2 | 2026-10-26–27 | Codex / assistant recorded | Implement and verify bounded organization administration | Unknown | Duration not measured; implementation/evidence linked below. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; field scope, access and persistence need product review. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

- H-2 · 2026-10-26 · Codex: Specification → In progress after explicit founder implementation/rename authorization; VAC-6 prerequisite inspected and available.

- H-3 · 2026-10-27 · Codex: In progress → QA after production build, 18 tests, factory/schema checks, organization functional mode, screenshot review and complete default browser regression passed. Native organization keyboard and independent privacy/release review remain open.

## Verification and release

Historical specification verification (2026-10-23): documentation consistency and links passed before implementation.

Current verification (2026-10-27): production build, 18 unit/component tests, shared-factory organization/profile/fixture/schema checks and the complete default Chrome browser suite passed. Organization-only functional mode also passed separately. Added CI coverage for organization permissions, atomic changes, optional structure and reset. Desktop/mobile settings and team screenshots were visually reviewed. See [durable verification details](media/VAC-2/verification.md).

The separate organization native-keyboard diagnostic did not pass on this macOS host: no DOM key/pointer events were delivered in either headless or visible-window mode. Manual/alternate-host verification remains open; the default suite's existing calendar/request/avatar keyboard checks pass. Do not infer production authorization or full release approval from these public fictional checks. No commit, push or deployment performed.

## Open questions and follow-up

1. Real persistence, effective-dated work schedules and six-day leave-policy calculations remain outside this mock.
2. Company creation/bootstrap, member invitations/moves and structural create/delete remain later scope, not new backlog items here.
3. Native organization keyboard verification on another host/manual browser, and independent privacy/security/release review, remain open.
