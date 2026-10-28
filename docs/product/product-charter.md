# Product charter

**Status:** Confirmed intent plus proposed pilot scope
**Owner:** Product lead / founder  
**Last updated:** 2026-10-26

## Confirmed intent

Source: founder instruction in the repository review, 2026-10-20.

- Vacate manages employee absence.
- The founder's company is the first intended user.
- The intention is to sell Vacate as a subscription product as well, supporting many customer companies.
- Accounts and personnel are managed manually initially. Optional customer directory/Entra integration may follow; customers do not need a Microsoft tenant.
- Company email is the username and must be unique across Vacate; creating another account with the same username is rejected. Shared accounts, company switching and multi-company owner/employee membership are deferred.
- Delivery direction: Angular web app and a .NET 10 backend API.
- SQL Server / Azure SQL is preferred but tentative; inexpensive Azure hosting is the starting goal.

This replaces the earlier assumption that a Greek market launch must precede company use. It does not establish the company's jurisdiction or approve a commercial launch geography.

## Proposed first outcome

An administrator configures employees, leave types, opening allocations and a working calendar. An employee requests leave, an assigned approver decides, balances remain correct, and authorised colleagues can see availability.

**ASSUMPTION:** A small internal pilot can use a single company, simple teams and one approval step. Confirm against the actual company process before implementation.

## Product boundaries

Keep the first release focused on absence requests, balances, approvals and availability. Defer native apps, resource booking, payroll, statutory country packs, complex organisation hierarchies and integrations until a specific need is confirmed.

Supporting many customer companies requires company data isolation in the design and verification from the start. A customer company is not a Microsoft Entra tenant. It does not require automated payments, public signup or pricing tiers for the company pilot.

Do not ship country-specific legal defaults from the reference documents. Policy configuration and historical calculations must remain explainable and attributable.

## OPEN QUESTION — company workflow before build

1. How many employees, teams and legal employers are in the pilot, and in which jurisdiction(s)?
2. Are full days sufficient, or are half days, hourly leave, part-time schedules or shifts necessary?
3. Who approves whose requests, including managers' own requests and approver absence?
4. Which leave types, allocations, holiday calendars, carryover and cancellation rules does the company currently use?
5. Who creates accounts and personnel, and how are login access, recovery and email changes handled? Manual setup and unique company-email usernames are confirmed; directory integration and multi-company membership are deferred.

## OPEN QUESTION — before selling

- First customer segment, geography, pricing and subscription terms.
- Commercial billing process and any later self-service onboarding. Initial account/personnel setup is manual.
- Privacy ownership, retention, customer agreements and recovery/availability requirements.

Evidence from the company pilot validates that company's workflow; it does not establish wider demand or willingness to pay.

## Founder clarification — user model, 2026-10-26

Source: founder schema-review instruction, 2026-10-26; [ADR-0001 clarification](../adr/0001-company-first-web-api.md#founder-clarification--account-and-company-roles-2026-10-26).

- Account-level fields are flat: ID, GUID, username, first/middle/last names, gender, marital status, integer dependent-child count, sole-care fact and account status. Remove the proposed `mockEligibilityProfile` wrapper.
- For this mock/MVP model, married and sole care are mutually exclusive. This requested data constraint does not establish production legal eligibility or change the existing mock evaluator in this documentation task.
- A user may conceptually belong to several companies; each membership has its own employee/admin system role and distinct job role. For mock/MVP, one company per account remains the scope; each company can have many users. Multiple job roles and multi-company operations remain deferred.
- The [revised user draft](../contracts/user.md) records these directions and labels remaining field/type/lifecycle/access choices and suggested business columns as proposals. No production demographic taxonomy, permissions or statutory defaults are approved by this clarification.

## Founder clarification — membership, defaults and allocation, 2026-10-26

Source: subsequent founder schema-review instruction and clarification, 2026-10-26. This supersedes the earlier draft representation and unknown-family-value choices.

- Company and organization are synonymous. Company/employment fields belong under the user's single MVP membership, including GUID company, system-role and job-role references. Retain the suggested employment/organization/schedule/calendar/policy fields.
- Employer registers prior employment before the current employer in years at hiring (`priorService`). Recognition/precision and correction rules still need decisions.
- Unknown married, dependent-child count and sole-care inputs default to false, zero and false. Married and sole care remain mutually exclusive. The draft represents married as a boolean, without inferring divorce/widowhood from false. Existing fictional evaluator behavior is not changed here.
- Membership balance allocation defaults from qualifying experience policies. Employer custom allocation must be at least the applicable policy allocation. Used/pending leave reduces remaining balance, not that allocation floor. Actual policy schedules/amounts and historical recalculation remain unapproved.
- [Draft 0.3](../contracts/user.md) distinguishes confirmed directions from remaining annual-period/day-unit assumptions, access rules and authentication choices. No runtime implementation is authorized by this documentation revision.

## Founder clarification — profile and membership editing, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. Users may update their own first/middle/last names, gender, marital fact, dependent-child count and sole-care fact. Membership attributes may only be added/updated by an administrator authorized for the relevant company. Existing married/sole-care validation and policy-minimum allocation constraints continue to apply. Membership policy calculations and ledger-derived balance values remain server-owned; admin-only configuration does not permit arbitrary edits to derived totals. Username, account status, editing another person's profile, private-field read access and audit details remain separate unresolved permissions. See the [draft permission contract](../contracts/user.md#confirmed-editing-permissions) and its future backend acceptance scenarios.

## Founder clarification — colleague profile visibility, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. When viewing other users' profiles, users may see only username, email, names, gender, job titles and the user system role in the authorized company scope. Marital status, dependent children and sole care are excluded, along with fields outside that allowlist. No special admin exception for family details is granted by this instruction. The current draft derives email from company-email username and resolves the single MVP job title/system-role labels from membership references. This does not broaden cross-company or existing group visibility. The [projection contract](../contracts/user.md#identity-projection-and-migration-boundaries) requires server-side field selection rather than UI hiding; backend enforcement remains unimplemented.

## Founder clarification — invitation-based membership, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. Membership is assigned after an administrator invites the user to the company/organization/team. Company and organization are synonymous; any team assignment belongs to that company. Before assignment, the draft permits membership null, which grants no company access. Initial scope remains at most one assigned company membership per account. Invitation issuance versus acceptance timing, activation, recipient verification, expiry/revocation and first-admin provisioning remain open; no public signup, transfer, second company membership or email-sending implementation is approved here. See the [assignment contract](../contracts/user.md#invitation-based-membership-assignment).

## Founder request — own settings experience, 2026-10-26

Implement profile and membership settings in the fictional Angular mock, reachable from the left menu and a submenu on the profile picture. Users see their membership and edit the confirmed self-profile fields. [VAC-12](../jira/VAC-12-profile-and-membership-settings.md) tracks implementation and verification. The current bounded implementation uses memory-only saves, read-only membership and explicit unknown policy/service fields; real persistence, invitation onboarding and an admin membership editor remain outside this change.

## Founder request — admin organization pages, 2026-10-26

Implement organization structure and pages browsable/editable only by company administrators. Initial editable settings are company name and five- or six-day working week; the founder explicitly confirmed department and team renaming too. Browse existing departments, teams and their membership without exposing private family/leave details. Creation, deletion, member reassignment, arbitrary hierarchy and additional configuration are not included. This authorizes bounded [VAC-2](../jira/VAC-2-organization-settings-mock.md) implementation, superseding the earlier read-only five-day settings proposal. Mock edits remain in memory and reset on reload/sign-out. The workweek setting does not approve new six-day statutory allowances or retrospective balance recalculation; existing reviewed five-day leave examples remain explicitly labelled references. Existing shared calendar visibility is distinct from admin-only organization administration pages.

## Founder clarification — organizations beyond companies, 2026-10-26

Source: founder instruction during organization implementation, 2026-10-26. An organization is a broader workspace concept: it can be a company containing departments, teams and groups, or a standalone team. A standalone team organization could span companies; this is intended differentiation to design later. This supersedes the earlier blanket equation of company and organization **for the future domain**, without authorizing cross-company access now. The current mock remains the existing company-shaped organization. Its membership.companyId and company-admin checks are MVP compatibility boundaries, not a finalized generic organization model. Later design must decide organization types/relationships, organization versus employer membership, cross-company facts/roles/privacy, group semantics and migration to organization-scoped identifiers. No standalone/cross-company organization implementation, new groups feature or future backlog is added by this clarification.

## Founder clarification — optional organization structure, 2026-10-26

Organizations may have no departments, groups or teams. Structure is flexible, not a mandatory company → department → team hierarchy; adapt to each organization's internal organization. This is founder direction, not an approved arbitrary graph/relationship editor. The current bounded administration model therefore permits empty departments/teams, independent department records, teams with optional department association and members directly in the organization. Group types, multi-parent relationships and cross-company organization design remain later work. Existing fixtures are one example layout, not a universal invariant.

### Founder decision · 2026-10-27 · API-backed settings

Support existing fictional accounts, single memberships and optional company structure with API CRUD. Web reads/updates use HTTP; creation/deletion remain API-only. Add server-owned UTC lifecycle timestamps createdAt, updatedAt, deleteRequestedAt and deletedAt; deletion requests and deletion are distinct. Founder confirmed server memory, resetting on API restart, for this iteration. Future product changes cover frontend and API together with applicable access/tenant tests. See [API contract](../contracts/api.md). Production identity, database, audit/retention and erasure design remain open.

### Founder implementation clarifications · 2026-10-27

Use typed domain entities and application services with Infrastructure repository adapters, without parallel demo application folders. Every entity has numeric Id and immutable Guid, without an InternalId alias. Public API routes/references use GUIDs; internal relationships use numeric keys. Name use-case records CreateUser, UpdateUser, etc., without a Command suffix. [ADR-0003](../adr/0003-domain-and-application-services.md) owns this structure and [VAC-13](../jira/VAC-13-api-backed-settings.md) records verification.
