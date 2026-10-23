---
id: VAC-6
type: story
summary: Model a fictional company with per-person demo logins and visibility scenarios
status: done
created: 2026-10-23
updated: 2026-10-23
parent: null
depends_on: [VAC-1]
---

# VAC-6 — Model a fictional company with per-person demo logins and visibility scenarios

![Story](badges/story.svg) **✅ Done** · Implementation: Codex

## Description

As the product lead reviewing company workflows, I want a coherent fictional company with distinct people, work roles, departments/teams and a demo login for each person so that I can explore who sees what rather than viewing the same fixtures under two role labels.

The founder asked for more people and per-person logins, then authorized implementing the PO proposal. Northstar Example is an IT-services scenario for exploration, not a committed customer segment or production organization design. The previous release's shared-viewer accounts are replaced with canonical fictional identities; legacy shortcuts map to Maya and Nora.

## Scope

- Use the reviewed 12-person roster below with stable person/account/company/group identifiers, two departments and four teams.
- Include employee, non-admin team lead, HR administrator and owner personas. Work titles do not automatically grant permissions; HR and owner share explicit admin capability.
- Provide a distinct browser-demo account for every fixture person, linked to that person's own requests and balance examples. Document public demo access in the mock's access instructions, not passwords or real identities in issue attachments.
- Use lowercase firstname/firstname demo logins following the founder's 2026-10-23 instruction. Synthetic email metadata remains separate. This public-mock convention does not change the accepted production company-email username direction. Demo login is browser-only and does not implement real authentication, provisioning, recovery or directory integration.
- Record a reviewable access matrix for own records, generic team/department/organization availability, approval inbox and organization settings; distinguish access to a page from access to sensitive request details.
- Use simple departments/teams for scenario exploration; no hierarchy editor, multi-company membership or company switcher. A person/account initially belongs to one fictional company.
- Retain the five-day Monday–Friday mock basis, distinct leave units and source-labelled rule previews. No real employee, family, health or service-history records are introduced.
- Agree explicit fixtures for pending/approved requests, overlapping availability and empty scopes without claiming legal eligibility. Do not generate sensitive medical narratives.
- No second fictional company or company switcher is included in this iteration. Negative company/person/group identifier cases verify presentation filtering only; actual multi-company server isolation remains a future release gate.
- Coordinates [VAC-2 settings](VAC-2-organization-settings-mock.md), [VAC-3 admin overview](VAC-3-admin-overview-first-experience.md), [VAC-4 approvals](VAC-4-admin-approval-inbox-mock.md) and [VAC-5 shortlist](VAC-5-common-leave-types-chooser.md). Their agreed permissions/behaviors feed this matrix; no circular implementation prerequisite is intended.

## PO proposal — personas and fixture company

**Accepted for this synthetic implementation, 2026-10-23:** the founder instructed proceeding with VAC-6 using the PO proposal. Use **Northstar Example**, a fictional IT-services company with **12 people, two departments and four teams**. This is a compact scenario for reviewing the mock; it does not select an IT commercial market or approve a production hierarchy or permissions. Every person has one canonical demo account in this company. Use lowercase firstname/firstname for public demo access; synthetic `@example.invalid` email metadata remains fictional. Public demo access instructions belong in the mock README.

| Persona / explicit demo capability | Main job to be done | Mock landing | Mock availability scope | Approval / settings |
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

- [x] Given the approved roster, each fictional person has exactly one documented demo account, one company context and stable links to their own fixtures; all usernames are distinct and no personnel record silently shares another person's login.
- [x] Given each demo login, the account label, own balance and own request details belong to that person; another fixture person's personal data does not appear as theirs.
- [x] Given HR/owner/employee and any approved team-lead persona, landing pages, overview scopes, settings and approval actions match the reviewed matrix. Temporary approval rights belong to admin accounts only; a job title alone grants none.
- [x] Given team, department and organization views, the correct fictional people and generic availability appear; private categories, reasons, balances and decision comments remain outside shared cards/details unless separately authorized.
- [x] Given logout/login, reload and attempted stale/direct navigation, previous account selections, personal dialogs and unsaved form state are cleared or rebound under the agreed demo contract.
- [x] Given a guessed person or group identifier outside an account's agreed scope, the demo displays the reviewed denied/empty state rather than rendering that person's private detail. This exercises presentation behavior only; static fixture assets remain public.
- **Not applicable to this release:** no second company is shipped; company switching is absent. Negative company/group identifiers are tested only as presentation checks.
- [x] Given all fixture files and documentation, names/emails/data are clearly fictional, no real credentials or medical records are included, and browser-demo access is labelled public/non-secure.
- **Deferred future server gate, outside this mock release:** before real employee/account endpoints, seed companies A/B and test read/write/approve/export/configuration isolation via IDs, queries and payloads, including administrators. Test unauthorized same-company detail access and globally unique company-email account creation without disclosure of another company's identity. Static client fixtures and demo role checks cannot satisfy these production gates.

## Subtasks and responsibilities

### UX

- [x] UX-1: Draft persona goals and a small company map; distinguish work title, application role and visibility scope.
- [x] UX-2: Review representative employee, HR/owner, team-view and account-change journeys against the access matrix.

### UI

- [x] UI-1: Replace the shared-viewer assumption with approved stable fictional identities and per-person demo account mappings.
- [x] UI-2: Bind own requests/balances and group availability to the active fixture account, with predictable reset and empty/denied states.
- [x] UI-3: Update public demo access/help text and keep all accounts clearly labelled as a UI simulation.

### Backend

Not applicable to implementation: no real authentication or employee API is included. Document future authorization/isolation gates; client-side fixture scoping is not security.

### Database

Not applicable: use synthetic fixture files; no personnel/account schema or migration. A fixture shape is not an accepted production database or user schema.

### QA and other responsibilities

- [x] Product-1: Review roster size, sector setting, persona goals, group boundaries, accounts and access matrix before Todo.
- [x] QA-1: Exercise every demo account and agreed scope, own/shared detail boundaries, reload/logout/account changes and negative identifier cases.
- [x] Privacy-1: Inspect fixtures and help text for invented sensitive narratives, real identities or claims of secure authentication; record static-asset exposure and future server gates.
- Infrastructure: Not applicable beyond packaging approved fixture assets with the existing mock.

## Attachments and sources

- Founder instruction, 2026-10-23: more company personas/people, IT roles as a thought, login per person, departments/teams and who sees what. Related [idea note](../next-up.md).
- [Accepted account/company scope](../adr/0001-company-first-web-api.md), 2026-10-20: unique company-email usernames, one company per initial account, manual accounts/personnel; company switching deferred.
- [Charter](../product/product-charter.md) and [proposed MVP](../product/mvp-scope.md), 2026-10-20: company-first workflow and tenant isolation, detailed pilot roles still open.
- [Existing persona/JTBD hypotheses](../product/personas-jtbd.md), status Proposed; document has no effective-date claim. Manager approval hypotheses are not approved for this temporary admin-only mock.
- [Current mock boundaries](../design/calendar-mock/README.md) and [release record](../release-2026-10-22-leave-mock.md), 2026-10-22: two accounts, synthetic data, browser session only, no server authorization.
- [Implemented synthetic fixture definitions](../design/calendar-mock/dist/demo-fixtures.js), [public demo access and scope instructions](../design/calendar-mock/README.md) and [VAC-6 release evidence](../release-2026-10-23-vac-6.md). The roster/matrix remains in this issue; no additional personal-data attachment is needed.

## Comments

- C-1 · 2026-10-23 · Product Owner agent: IT-sector framing is a scenario option, not an approved market focus. Distinct demo identities help evaluate behavior but do not establish real security or a production persona model.
- C-2 · 2026-10-23 · Product Owner agent, responding to founder request for suggested personas: Recommended four jobs across three explicit demo capabilities, with the 12-person fixture and visibility matrix above. Department-wide lead visibility, admin detail fields and blocking self-approval are proposals for review, not confirmed rules.
- C-3 · 2026-10-23 · Codex: Founder authorized committing the existing work, implementing VAC-6, reviewing, pushing and deploying to Azure dev. Use the proposed 12-person roster and presentation scopes for this prototype. VAC-2–VAC-5 remain separate; admin settings/approvals show planned destinations without implementing decisions or mutations.

## Decisions

- D-1 · 2026-10-23 · Founder direction, confirmed for mock planning: expand fictional people, support a demo login for each, and cover department/team visibility scenarios.
- D-2 · 2026-10-23 · Existing accepted direction retained: each account initially accesses one company; no company switching or real identity integration. See [ADR-0001](../adr/0001-company-first-web-api.md).
- D-3 · 2026-10-23 · Founder direction, confirmed for mock: approval remains temporarily admin-only; team-lead title alone must not grant it. Detailed production authority remains open.
- D-4 · 2026-10-23 · Implementation scope following founder instruction: use own/team employee views, own/team/department non-admin lead views and all company scopes for HR/owner admins. Initial scopes are own/department/organization respectively, using the existing calendar shell. Preserve the legacy demo shortcuts as aliases to canonical people; do not add a second company or production identity system.
- D-5 · 2026-10-23 · Delivery boundary: approval details/self-approval simulation and settings persistence remain unresolved in VAC-2/VAC-4. VAC-6 provides identities, fixtures, generic scoped availability and planned admin-only destinations; it grants no access to colleagues' private balances or request narratives.
- D-6 · 2026-10-23 · Founder instruction during implementation: each public demo login uses lowercase firstname as username and password. Canonical person IDs and the two legacy shortcuts remain; this is a mock-only convention, not a change to production identity policy.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-23 | Product Owner agent / assistant recorded | Draft persona/fixture outcome and visibility scenarios | Unknown | No issue-specific duration captured; founder brief/source links above. VAC-1 historical time excluded. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-23 · Product Owner agent: Created in Specification; roster, matrix and IT-sector framing need review. No implementation started.

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.
- 2026-10-23 · Codex: Specification → Todo → In progress after the founder instructed proceeding with the bounded mock proposal. VAC-1 prerequisite is released; no production policy approval is inferred.
- 2026-10-23 · Codex: In progress → QA. Persona/account implementation, package integration and independent source review are complete. Fixture/session checks pass; full browser/history/keyboard verification is running before release.

- 2026-10-23 · Codex: QA → Done after fixture tests, complete local browser acceptance, package checks and independent source review passed. Keyboard and history journeys are verified independently for reliable headless input; hosted CI/deployment follow.

## Verification and release

Specification only. Acceptance scenarios are unexecuted; no added accounts/personas or permissions are released by this issue. On 2026-10-23, document checks passed for matching metadata/heading/backlog, valid local link targets, unique issue allocation and whitespace.

## Open questions and follow-up

The roster, IT-services scenario, shared HR/owner demo capability, scope defaults and retained aliases were selected for this prototype when the founder instructed proceeding. They remain distinct from production decisions.

1. Real customer personas, production access scopes, account lifecycle and data model need company validation.
2. VAC-4 owns approval detail, self-approval/fallback and decision simulation; VAC-6 exposes no decision actions or colleagues' private balance data.
3. VAC-2 owns editable organization settings and persistence. VAC-3 owns the fuller admin-first dashboard layout; VAC-5 owns the common type shortlist.
4. A second synthetic company and all real multi-company authorization tests remain future work. This one-company public mock is not evidence that server isolation is implemented.
5. UI direction, real policy/eligibility and production organization structure remain open in the canonical product documents.
