---
id: VAC-6
type: story
summary: Model a fictional company with per-person demo logins and visibility scenarios
status: specification
created: 2026-10-23
updated: 2026-10-23
parent: null
depends_on: [VAC-1]
---

# VAC-6 — Model a fictional company with per-person demo logins and visibility scenarios

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As the product lead reviewing company workflows, I want a coherent fictional company with distinct people, work roles, departments/teams and a demo login for each person so that I can explore who sees what rather than viewing the same fixtures under two role labels.

The founder asks for more people and per-person logins. An IT-sector company is an idea to explore, not a committed customer segment or production organization design. The current mock's user/admin accounts show the same company with a role label; this story proposes a richer synthetic scenario set.

## Scope

- Define a small, coherent fixture roster with stable person/account/company/group identifiers; agree headcount and group structure before implementation.
- Include ordinary employee, HR administrator and owner candidate personas, with the concrete proposal below. A team lead helps compare people-management responsibility with the temporary admin-only approval rule. Work titles do not automatically grant permissions.
- Provide a distinct browser-demo account for every fixture person, linked to that person's own requests and balance examples. Document public demo access in the mock's access instructions, not passwords or real identities in issue attachments.
- Use company-email-style synthetic usernames consistent with the accepted one-company-per-account direction. Demo login remains browser-only and does not implement authentication, manual provisioning, recovery or directory integration.
- Record a reviewable access matrix for own records, generic team/department/organization availability, approval inbox and organization settings; distinguish access to a page from access to sensitive request details.
- Use simple departments/teams for scenario exploration; no hierarchy editor, multi-company membership or company switcher. A person/account initially belongs to one fictional company.
- Retain the five-day Monday–Friday mock basis, distinct leave units and source-labelled rule previews. No real employee, family, health or service-history records are introduced.
- Agree explicit fixtures for pending/approved requests, overlapping availability and empty scopes without claiming legal eligibility. Do not generate sensitive medical narratives.
- **ASSUMPTION — proposed for isolation demonstrations:** a second minimal fictional company with separate accounts can exercise negative UI scope cases. This is not a request for an account to switch companies and does not establish server isolation.
- Coordinates [VAC-2 settings](VAC-2-organization-settings-mock.md), [VAC-3 admin overview](VAC-3-admin-overview-first-experience.md), [VAC-4 approvals](VAC-4-admin-approval-inbox-mock.md) and [VAC-5 shortlist](VAC-5-common-leave-types-chooser.md). Their agreed permissions/behaviors feed this matrix; no circular implementation prerequisite is intended.

## PO proposal — personas and fixture company

**PROPOSAL / ASSUMPTION, 2026-10-23 — not accepted permissions.** Use **Northstar Example**, a fictional IT-services company with **12 people, two departments and four teams**. This is a compact scenario for reviewing the mock; it does not select an IT commercial market or approve a production hierarchy. Every person has one explicit demo account in this company. Use synthetic `@example.invalid` usernames; login access instructions belong in the mock README, not this issue.

| Persona / explicit demo capability | Main job to be done | Proposed landing | Proposed availability scope | Approval / settings |
|---|---|---|---|---|
| Employee / employee | Plan personal time away and check nearby colleagues | Own leave and balances | Own records; generic availability for own team | No approval; no organization settings |
| Team lead / non-admin lead | Check department availability and coordinate coverage | Own department overview, with My leave reachable | Own records; generic availability across own department and its teams | No approval under the confirmed temporary rule; no organization settings |
| HR/operations / admin | Review company absence, process requests and inspect setup | Organization overview with Approvals entry | Own records; generic availability for all company groups | Admin-only inbox; agreed settings page |
| Owner / admin | Understand company availability and outstanding decisions | Organization overview with department/team drill-down | Same proposed scope as HR admin; own leave remains separate | Same explicit admin capability as HR; no extra owner-only permission tier |

All four personas can inspect their **own** detailed requests and balances. Shared overview cards stay generic **Away**. Proposed admin inbox detail is limited to person, type, dates, quantity/unit and status for review; it grants no access to medical narratives, supporting evidence or everyone's balances. This sensitive-detail proposal needs approval with VAC-4. **Proposed safety behavior pending decision:** block self-approval in the simulation with an explanation; do not invent fallback routing. Production self-approval policy remains open.

| Department | Team | Fictional people and jobs | Explicit demo capabilities |
|---|---|---|---|
| Technology | Platform | Leah — platform lead; Ravi — DevOps engineer; Noah — software engineer | Leah: non-admin lead; Ravi/Noah: employee |
| Technology | Applications | Maya — software engineer; Theo — software engineer; Iris — QA engineer | All employee; no automatic approval rights from work title |
| Business | Product | Ella — product lead; Owen — product designer; Zoe — product specialist | Ella: non-admin lead; Owen/Zoe: employee |
| Business | Operations | Daria — owner; Nora — HR/operations; Sam — operations coordinator | Daria/Nora: admin; Sam: employee |

This yields **2 admin accounts, 2 non-admin lead accounts and 8 employee accounts**. Leads are review personas, not a hierarchy-management feature. Suggested fixture coverage: Maya has a pending annual request; Ravi has approved annual availability overlapping part of it; Iris has a study example; Sam has no upcoming leave for an empty state; Nora has a pending own request to expose the self-approval question. Keep amounts fictional and units separate; no invented clinical or family narratives. Other people can have minimal allocations/availability so each login still has a coherent own view.

The older [persona/JTBD research hypotheses](../product/personas-jtbd.md) include manager approvals and separate organization administration. For **this mock**, non-admin leads cannot approve; HR and owner are different jobs sharing an explicit admin capability. These proposals do not rewrite those unvalidated research hypotheses or settle the company's real approval roles. A second tiny company is optional for negative scope checks, not part of the proposed 12-person company and not a company-switching feature.

## Dependencies

Requires the released [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) mock login, calendar and synthetic request/balance baseline. This prerequisite is already available.

Coordinate settings, overview, approval and shortlist decisions with [VAC-2](VAC-2-organization-settings-mock.md), [VAC-3](VAC-3-admin-overview-first-experience.md), [VAC-4](VAC-4-admin-approval-inbox-mock.md) and [VAC-5](VAC-5-common-leave-types-chooser.md). Their completed UI implementations are not prerequisites for defining and supplying shared fixtures; these are not reverse dependency edges.

## Acceptance scenarios

- [ ] Given the approved roster, each fictional person has exactly one documented demo account, one company context and stable links to their own fixtures; all usernames are distinct and no personnel record silently shares another person's login.
- [ ] Given each demo login, the account label, own balance and own request details belong to that person; another fixture person's personal data does not appear as theirs.
- [ ] Given HR/owner/employee and any approved team-lead persona, landing pages, overview scopes, settings and approval actions match the reviewed matrix. Temporary approval rights belong to admin accounts only; a job title alone grants none.
- [ ] Given team, department and organization views, the correct fictional people and generic availability appear; private categories, reasons, balances and decision comments remain outside shared cards/details unless separately authorized.
- [ ] Given logout/login, reload and attempted stale/direct navigation, previous account selections, personal dialogs and unsaved form state are cleared or rebound under the agreed demo contract.
- [ ] Given a guessed person or group identifier outside an account's agreed scope, the demo displays the reviewed denied/empty state rather than rendering that person's private detail. This exercises presentation behavior only; static fixture assets remain public.
- [ ] If a second fictional company is approved, its separate accounts do not render the first company's people, requests, balances or settings in application views; no account gains company-switching capability.
- [ ] Given all fixture files and documentation, names/emails/data are clearly fictional, no real credentials or medical records are included, and browser-demo access is labelled public/non-secure.
- [ ] **Future server gate:** before real employee/account endpoints, seed companies A/B and test read/write/approve/export/configuration isolation via IDs, queries and payloads, including administrators. Test unauthorized same-company detail access and globally unique company-email account creation without disclosure of another company's identity. Static client fixtures and demo role checks cannot satisfy these production gates.

## Subtasks and responsibilities

### UX

- [ ] UX-1: Draft persona goals and a small company map; distinguish work title, application role and visibility scope.
- [ ] UX-2: Review representative employee, HR/owner, team-view and account-change journeys against the access matrix.

### UI

- [ ] UI-1: Replace the shared-viewer assumption with approved stable fictional identities and per-person demo account mappings.
- [ ] UI-2: Bind own requests/balances and group availability to the active fixture account, with predictable reset and empty/denied states.
- [ ] UI-3: Update public demo access/help text and keep all accounts clearly labelled as a UI simulation.

### Backend

Not applicable to implementation: no real authentication or employee API is included. Document future authorization/isolation gates; client-side fixture scoping is not security.

### Database

Not applicable: use synthetic fixture files; no personnel/account schema or migration. A fixture shape is not an accepted production database or user schema.

### QA and other responsibilities

- [ ] Product-1: Review roster size, sector setting, persona goals, group boundaries, accounts and access matrix before Todo.
- [ ] QA-1: Exercise every demo account and agreed scope, own/shared detail boundaries, reload/logout/account changes and negative identifier cases.
- [ ] Privacy-1: Inspect fixtures and help text for invented sensitive narratives, real identities or claims of secure authentication; record static-asset exposure and future server gates.
- Infrastructure: Not applicable beyond packaging approved fixture assets with the existing mock.

## Attachments and sources

- Founder instruction, 2026-10-23: more company personas/people, IT roles as a thought, login per person, departments/teams and who sees what. Related [idea note](../next-up.md).
- [Accepted account/company scope](../adr/0001-company-first-web-api.md), 2026-10-20: unique company-email usernames, one company per initial account, manual accounts/personnel; company switching deferred.
- [Charter](../product/product-charter.md) and [proposed MVP](../product/mvp-scope.md), 2026-10-20: company-first workflow and tenant isolation, detailed pilot roles still open.
- [Existing persona/JTBD hypotheses](../product/personas-jtbd.md), status Proposed; document has no effective-date claim. Manager approval hypotheses are not approved for this temporary admin-only mock.
- [Current mock boundaries](../design/calendar-mock/README.md) and [release record](../release-2026-10-22-leave-mock.md), 2026-10-22: two accounts, synthetic data, browser session only, no server authorization.
- No new attachments needed; add an approved roster/matrix as a linked product/design document during specification, without passwords or personal data.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: IT-sector framing is a scenario option, not an approved market focus. Distinct demo identities help evaluate behavior but do not establish real security or a production persona model.
- C-2 · 2026-10-23 · Product Owner agent, responding to founder request for suggested personas: Recommended four jobs across three explicit demo capabilities, with the 12-person fixture and visibility matrix above. Department-wide lead visibility, admin detail fields and blocking self-approval are proposals for review, not confirmed rules.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for mock planning: expand fictional people, support a demo login for each, and cover department/team visibility scenarios.
- D-2 · 2026-10-23 · Existing accepted direction retained: each account initially accesses one company; no company switching or real identity integration. See [ADR-0001](../adr/0001-company-first-web-api.md).
- D-3 · 2026-10-23 · Founder direction, confirmed for mock: approval remains temporarily admin-only; team-lead title alone must not grant it. Detailed production authority remains open.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft persona/fixture outcome and visibility scenarios | Unknown | No issue-specific duration captured; founder brief/source links above. VAC-1 historical time excluded. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; roster, matrix and IT-sector framing need review. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

## Verification and release

Specification only. Acceptance scenarios are unexecuted; no added accounts/personas or permissions are released by this issue. On 2026-10-23, document checks passed for matching metadata/heading/backlog, valid local link targets, unique issue allocation and whitespace.

## Open questions and follow-up

1. Accept the proposed 12 people, two departments and four teams, or simplify the scenario further?
2. Accept IT services as the fictional setting and the suggested work titles? This does not decide the commercial target segment.
3. Accept HR and owner as two personas sharing explicit admin capability? Confirm the proposed inbox details and whether any balance detail is needed.
4. Accept team-only employee availability and department-wide lead availability, with non-admin leads unable to approve?
5. Should a second minimal fictional company be included for negative UI scope scenarios, using separate accounts and no company switcher?
6. Should existing user/admin aliases remain as compatibility shortcuts or be replaced by per-person synthetic email logins? How are public demo credentials presented outside issues?
