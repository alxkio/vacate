# Product charter

**Status:** Confirmed intent plus proposed pilot scope
**Owner:** Product lead / founder  
**Last updated:** 2026-11-01

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

### Founder request — unified settings and navigation · 2026-10-29

Source: product lead's UI/UX implementation request and clarification, 2026-10-29, corrected by explicit feedback on 2026-10-30. One Settings entry opens role-appropriate sections. Preserve existing admin organization editing and self-profile/membership functions. People owns the colleague directory and administrator employee management; My Leave owns personal request history and personal balances. Provide an admin-only employee annual balance overview with team/name filters, sorting and clear high-balance indicators. An adjustable viewing threshold is a UI aid, not leave policy; unknown API balances remain unresolved. Keep the organization name in the top bar, remove the visible user name there and retain account identity/sign-out in the avatar menu. My Team includes the current member and follows their assigned team; belonging to a team does not grant management permissions.

The product lead explicitly confirmed an unavailable Approval Requests inbox for this change after inspection found no backend requests or approver assignments. Do not infer assignments from managers, job titles or public fictional pending entries. No budget feature or calendar redesign/day-level scheduling is included. [VAC-20](../jira/VAC-20-unified-settings-and-navigation.md) tracks implementation and verification.

Source: product lead feedback, 2026-10-30. Employees such as Maya must see only Profile and System (display preferences) within Settings. Organization and Team Settings are accessible only to company administrators, including direct routes and legacy links. Existing non-admin lead personas retain their availability permissions without gaining administration. System reuses the existing browser/account-scoped display preferences; Profile retains self-profile editing and read-only membership. This corrects the earlier presentation of Organization/Team sections to employees; authorized team calendar/directory access is unchanged.

### Founder clarification — advertised test logins · 2026-10-30

Source: product lead's small follow-up and permission clarification, 2026-10-30. The sign-in screen offers one representative per review scenario: Employee (Maya), Team lead (Leah), Department lead (Ella), Organization admin (Nora). Retain all twelve fictional colleagues, all test data and existing credentials. Only advertised login options are reduced. Team and department lead scenarios keep their existing identical lead access; distinct permissions are deferred to later work. This supersedes the earlier all-person sign-in chooser presentation without changing VAC-6 fixture identities or the development authentication contract. [VAC-20](../jira/VAC-20-unified-settings-and-navigation.md) tracks the follow-up.

### Further founder feedback — personal leave and delegated settings · 2026-10-30

Source: later product lead feedback in this session, confirmed complete before implementation and verification resumed. These requested settings scopes supersede the earlier blanket admin-only Team Settings restriction and the deferral of distinct lead settings access. Team leads may access their Team Settings if the organization allows it; department leads may access their Department Settings and teams within that department if allowed. Organization owners and HR may access all settings. Personal Profile/System settings remain separate from these management scopes. In the fictional test organization, assume delegated lead settings are permitted. The only Team/Department setting requested so far is whether annual/vacation leave requires approval. Where explicit team and department values differ, the team value takes precedence.

My Leave should display balances for types used during the year, treating one-off/event-based types separately, show pending approval and sort dated requests descending. Pending requests do not reduce balances while approval is required. The maternity example does not establish a legal once-per-year policy; event-based treatment must use supported/configured type semantics.

Implementation and verification are tracked in [VAC-20](../jira/VAC-20-unified-settings-and-navigation.md). The product lead confirmed feedback complete, lifting the testing/build/commit hold. No approval assignment, self-approval or decision workflow has been approved by this clarification. Existing employee/admin persistence and reference leave examples do not, by themselves, implement these new scoped permissions or approval-aware balances.

Subsequent explicit clarification in the same feedback session: Organization Settings must contain separate controls for requiring annual/vacation leave approval, granting department leads access to Department Settings, and granting team leads access to Team Settings. Both lead-access controls are enabled in the fictional example. The product lead explicitly confirmed **team overrides department, then organization**: the organization setting is a default. A nullable scope setting inherits; explicit false can override true above it.

Additional organization setting requested in the same session: allow or disable annual/vacation-day carryover and configure how many years days may carry over. `0` years means unlimited years; disabling carryover is separate. The limit is measured in years, not days. The product lead explicitly clarified that this item is saved configuration only: no carryover transfers, day expiry, balance recalculation or carryover processing in this change. This is a configurable product requirement, not an assertion of statutory entitlement or an approved legal carryover policy. This configuration is implemented without carryover processing; verification is recorded in VAC-20.

Final menu-label feedback in this session: the avatar/user-icon menu entry must be **Settings**, matching the main navigation, rather than **Profile settings**. It opens the unified settings destination with the actor's permitted sections.

Implementation boundary: scoped settings assignments are server-owned membership roles, separate from employee/admin system roles and display job titles. Leah and Ella have explicit team/department lead assignments; Nora and Daria represent owner/HR. No public role-assignment editor or new approval workflow is introduced. The API enforces delegation and tenant/node scope, and filters the permitted settings lists. Personal reference balances remain labelled fictional; API balances with unknown trusted policy stay unresolved.


### Founder clarification — invitation registration and membership · 2026-11-01

Source: product lead's database-schema discussion, tracked in [VAC-22](../jira/VAC-22-relational-database-schema.md).

An authorized administrator adds an invitee and sends an invitation to their company. The recipient registers as a Vacate user through that invitation; the account and membership in the inviting administrator's company are created together at registration/acceptance, rather than creating the membership when the invitation is issued. The default membership system role is employee. Invitation issuance alone grants no company access.

A future Invite User form belongs under Settings → Organization. Users will usually register with their company email. Subsequent founder confirmation, 2026-11-01: registration must use the email address that received the invitation; a different registration email is rejected. Matching uses the existing username normalization rather than introducing a new email policy. The existing globally unique company-email username and at-most-one-membership boundaries remain in force. Existing-account invitations, recipient verification and any non-default role selection still need decisions. Invitation expiry/revocation/replay rules are resolved by the subsequent clarification below. First-admin provisioning is resolved by the subsequent manual-bootstrap clarification below.

This confirms invitation-based onboarding, not a separate operational employee record without an account. Whether such personnel records are required remains OPEN QUESTION. The form/delivery/registration behavior is future work; this clarification changes specifications only and does not implement it.

Follow-up founder confirmation, 2026-11-01: invited-email binding is accepted. This resolves that question only; identity-provider/recipient-verification mechanisms and existing-account handling remain open. See the [invitation contract](../contracts/user.md#invitation-based-membership-assignment).


### Founder clarification — organization onboarding and MVP boundary · 2026-11-01

Source: subsequent founder discussion in [VAC-22](../jira/VAC-22-relational-database-schema.md). A user can typically belong to many organizations in the intended product. Future independent registration should ask the user to create an organization, rather than complete onboarding as an orphan account. Organization selection and the leave/vacation calculations and balances for multiple organization memberships are outside MVP scope. This reaffirms the future model; it does not lift the current one-assigned-membership MVP boundary or authorize company switching.

**CONFIRMED MVP boundary · 2026-11-01:** onboard ordinary users only through an authorized administrator invitation. No public independent-registration/organization-creation flow in this iteration. Registration through an invitation still creates account and membership together, uses the invited email and defaults the system role to employee. Do not create a user registration route that intentionally leaves the new user without an organization.

Founder confirmation, 2026-11-01: manually provision the initial organization and its first administrator, then onboard other users through administrator invitations. The manual bootstrap must create the first administrator membership; it is a controlled setup operation, not public signup. The exact operational procedure and authentication setup remain to design. Existing unassigned/removed-account states remain valid representations, not a promise of public orphan-account signup. Existing-account invitation handling and whether separate non-login personnel are needed remain open. No runtime/API/UI changes or new implementation stories are authorized by this clarification.


### Founder clarification — invitation lifecycle and backoffice provisioning · 2026-11-01

Source: founder confirmation in [VAC-22](../jira/VAC-22-relational-database-schema.md).

Invitations expire after seven days, are single-use, can be revoked and can be resent. Resending invalidates the previous invitation link; the replacement receives a new seven-day validity period. Expired, revoked, already-used and replaced links cannot create account/membership access. These are future implementation requirements.

Vacate needs a platform backoffice role able to add organizations and their administrators. This refines the earlier manual provisioning decision: authorized backoffice operations support organization/admin setup, distinct from public registration and ordinary company administration. Backoffice permission is separate from membership employee/admin roles, job titles and delegated settings roles. A company administrator does not gain platform provisioning rights.

**OPEN QUESTIONS:** What exact operational procedure implements the confirmed manual first-operator setup, and which authentication mechanism is used? Does backoffice need any access beyond organization/admin provisioning? No access to employee profiles, family facts, leave requests or balances, impersonation, deletion or arbitrary tenant operations is granted by this requirement. Backoffice authentication, exact provisioning flow and auditing/operational procedure need design. MVP one-company membership and deferred multi-organization operations remain unchanged. No role, account, infrastructure or external message is created by this specification update.


Follow-up founder confirmation, 2026-11-01: backoffice creates the organization and sends its first administrator an invitation with an explicit, server-authorized admin assignment. The recipient registers using the invited email through the same seven-day, single-use invitation flow; account and admin membership are created together on acceptance. Organization creation alone does not create that administrator account or membership. This resolves the direct-versus-invited admin question and refines the earlier manual-bootstrap wording. Ordinary member invitations still default to employee; accepting an admin invitation does not grant platform backoffice privileges. First backoffice operator provisioning and role-grant/revocation authority are resolved by the subsequent clarification below. An organization can therefore await first-admin acceptance; expiry, revocation or resend must not fabricate an active administrator.


Follow-up founder confirmation, 2026-11-01: provision the first backoffice operator through a controlled manual setup. After that initial bootstrap, only existing backoffice operators may grant or revoke the platform backoffice role. Organization administrators and employees cannot assign that role to themselves or others. This is platform authorization, separate from organization memberships; it does not grant additional employee/leave-data access. Exact bootstrap tooling, authentication, audit and recovery procedures remain to design. This confirms product/authorization rules only; no account or role assignment is executed now.


### Founder clarification — request granularity and future hourly leave · 2026-11-01

Source: founder response during [VAC-22](../jira/VAC-22-relational-database-schema.md) schema review. MVP employees request leave in whole days, with one day as the minimum granularity. Half-day/hourly submissions are outside current scope. The database must anticipate future hourly leave; the founder identified school-attendance leave and parts of maternity-related leave as use cases. These are future product requirements, not verified statutory rules or approved legal quotas.

Preserve explicit quantity units and sufficient precision in the schema rather than hard-coding every entitlement/transaction as an integer annual-day balance. Exact hourly eligibility, quota, conversion, scheduling and time-of-day rules remain open. Whole-day request granularity does not determine whether allocation/accrual/adjustments may be fractional or which balance periods apply. No assumption that one day is eight hours is approved. This changes specifications only; request submission/hourly calculation is not implemented.


### Founder clarification — membership annual balance and policy defaults · 2026-11-01

Source: founder database-schema discussion in [VAC-22](../jira/VAC-22-relational-database-schema.md).

The founder requests a persisted balance column on Membership, retaining hire date and prior working years. Country-specific policies determine the default annual leave entitlement; Greece (GR) is the MVP jurisdiction, with Norway, Sweden, Finland and Denmark anticipated later. Country alone is not enough to infer an applicable rule: employer/workweek, hire/experience facts and the reviewed policy version must be explicit. Unknown policy inputs remain unresolved.

An organization has a default vacation-day setting. Authorized employer administrators/HR may increase individual allocation, never below the applicable policy minimum. This extends annual-allocation editing authority to explicitly authorized company HR, not every employee or job title labelled HR. Exact role mapping remains to design. Founder subsequently confirmed an explicit individual allowance below the organization default must warn the administrator and be rejected, even when it meets the policy minimum. Organization-default precedence and whether individual values are absolute overrides or additional days also need confirmation.

Annual leave uses calendar years, with a new allocation on each 1 January. Unused previous-year annual leave may be carried through the end of March of the following year; the precise cutoff belongs in configuration. Example: 2026 entitlement may still be usable through 2027-03-31. This is a new processing requirement for future design; it does not implement or retroactively approve carryover processing in VAC-20. The previous CarryoverYears/unlimited-years configuration is insufficient to represent this deadline; migration/compatibility and country-policy versus organization override boundaries remain OPEN QUESTION.

Subsequent founder clarification, 2026-11-01: the requested Membership balance column means annual allowance before leave is taken, not remaining available days. The column is nullable: null uses the applicable policy allowance; a non-null value is the employee annual allowance override, not extra days. Its value must meet the policy minimum. Taking leave does not decrement this allowance column. Distinguish effective allocation, remaining days and carried days; per-year history mapping remains proposed. A January renewal must not overwrite prior-year history. Consumption order, policy changes, first-year prorating, effective timezone and post-cutoff treatment need decisions.

Whether the cutoff should be part of the country-specific policy is OPEN QUESTION raised by the founder. PROPOSED: versioned jurisdiction policy supplies reviewed defaults/constraints and organization configuration stores permitted overrides; do not treat a legal deadline as an unrestricted organization preference. See the [policy-source register](../compliance/policy-sources.md#annual-leave-research--2026-11-01). No production statutory policy, expiry/write-off, payroll rule, schema migration or runtime behavior is approved by this clarification.


Follow-up founder clarification, 2026-11-01: the nullable membership allowance is an override, not a cached remaining balance. PROPOSED physical name AnnualAllowanceDays (or AnnualAllowanceOverrideDays), subject to naming review. Effective annual allowance uses the stored override when non-null, otherwise the reviewed applicable policy result; if required policy inputs are unknown, the effective allowance remains unresolved. Zero is an explicit value subject to the policy floor, not inheritance. The existing nested membership.balance API object is not silently changed to a scalar by this schema discussion. Subsequent founder confirmation, 2026-11-01: organization default prefills the membership annual allowance when the employee joins; an explicitly null value continues to use policy. Do not silently substitute the organization default for null or assume max(policy, organization) is accepted. Current-year grants/history and policy recalculation remain separate design decisions.


Follow-up founder confirmation, 2026-11-01: prefill AnnualAllowanceDays from the organization's default vacation days at joining/membership setup, storing it as an explicit employee allowance. An authorized explicit null selection is preserved and resolves from policy; it is not replaced by the organization default. If no organization default is configured, null retains policy inheritance. Every prefilled/non-null allowance must meet the applicable policy minimum; reject a below-minimum candidate rather than silently treating the organization default as sufficient or bypassing validation. Unknown policy inputs remain unresolved. This is a setup default, not a live fallback for null memberships. Changes to organization defaults do not implicitly rewrite stored employee values; any bulk update/recalculation behavior needs a separate decision. Founder subsequently confirmed admins cannot save an explicit individual allowance below the organization default; show a warning and reject the lower value.


Follow-up founder decision, 2026-11-01: warn the administrator and block saving an explicit annual allowance below the organization default. Combined with the existing policy floor, a non-null allowance must be at least max(applicable policy minimum, configured organization default). If no organization default exists, the policy floor applies. Enforce server-side as well as in the future form; reject atomically rather than silently clamping. Example: policy minimum 22 and organization default 25 means an explicit 23 is rejected. HR exercising the same allowance-edit permission follows the same rule. These floors apply to annual allowance, not remaining days after taking leave.

CONFIRMED follow-up — null/floor interaction, 2026-11-01: clearing the allowance to null is allowed even when the applicable policy allowance is below organization default. Null intentionally selects policy; the organization floor applies only to explicit non-null values. Example: policy 22/org 25/null resolves to 22; explicit 23 is warned/rejected. Preserve existing authorization: only authorized company admin/HR may change allowance. Unknown policy stays unresolved, and null is not zero. Later increases in organization defaults and already stored lower explicit values still need an effective-dating/revalidation decision.


Follow-up founder rationale, 2026-11-01: null is intended to keep allowance linked dynamically to the applicable policy as employment tenure/experience changes, rather than freezing a calculated starting value in Membership. The founder described an illustrative GR five-day progression of 20 → 21 → 22 and the total-experience threshold. These figures are discussion inputs, not approval of a complete statutory algorithm: calendar-year/prorating rules, completed tenure, five/six-day weeks and experience thresholds require reviewed policy interpretation. Preserve null on policy evaluation; record evaluated results/version/inputs in period history rather than writing them back as overrides. A non-null allowance remains an explicit employer override, subject to applicable floors and future revalidation. Handling an existing override that becomes below a later policy floor remains open. Organization prefill intentionally creates an override; it does not retain dynamic policy inheritance.


### Founder agreement — allowance override and yearly history · 2026-11-01

Source: founder agreement to the enterprise-architect refinements in [VAC-22](../jira/VAC-22-relational-database-schema.md).

Use nullable Memberships.AnnualAllowanceOverrideDays, alongside HireDate, PriorServiceYears and LeavePolicyId. Null means dynamic policy inheritance; non-null means an absolute employer annual allowance subject to the previously agreed explicit-value floors. Never write a computed policy result back into the override or decrement it when leave is taken.

Keep AnnualLeaveEntitlements history per membership/year with the policy version, calculated policy allowance, applied allowance, carryover deadline and calculation timestamp. Preserve evaluated inputs/provenance and historic results; current policy changes do not silently rewrite past years. The precise revision/uniqueness strategy and treatment of mid-year milestones remain to design. Consumption, pending and remaining quantities are separate accounting/request projections.

The future authorized allowance editor distinguishes Use policy from Custom allowance. The organization default is suggested/prefilled for the custom option; choosing Use policy stores null, even if policy is below org default. This refines earlier blanket joining-prefill wording: do not silently turn the Use policy choice into a stored number. Which mode is initially selected on the future form is not decided here. The allowance-edit role remains authorized company admin/HR, not ordinary employees.

OPEN QUESTION: an explicit custom allowance can later fall below a changed policy minimum; automatic adjustment versus required employer review remains undecided. Complete GR statutory calculations, effective dating, country applicability and carryover processing remain subject to policy review. This agreement confirms design direction, not schema migration, UI, API or engine implementation.


### Founder decision — existing override below a later policy minimum · 2026-11-01

Source: founder response to allowance-change options in [VAC-22](../jira/VAC-22-relational-database-schema.md).

If a previously saved custom allowance becomes lower than the policy minimum after tenure/policy changes, leave that allowance as it is. Do not change the stored override or automatically raise the effective allowance, and do not introduce a required review/approval workflow. This supersedes the earlier open adjustment-versus-review question and the architect's automatic-effective-increase recommendation.

Later, the authorized administrator should receive a notification and see a warning on the employee membership edit page identifying the allowance shortfall. Warning/notification must not claim the stale allowance meets the current policy minimum. The condition does not itself create a review task or approval gate. New or explicitly changed numeric allowances still follow agreed policy/org floor validation; null still dynamically inherits policy and is unaffected by this decision. Historic entitlement records are not rewritten.

Notification delivery channel, timing, deduplication and exact warning presentation remain to design. This is a product behavior decision for an existing-value transition, not legal approval of a below-minimum entitlement or implementation of notifications. Country-policy applicability and production policy review remain required separately. No notification is sent or runtime changed now.
