# User object with company membership — draft for review

**DRAFT 0.5 · 2026-10-27.** [VAC-11](../jira/VAC-11-draft-user-schema.md) tracks the [schema](user.schema.json) and [fictional example](user.example.json). [VAC-12](../jira/VAC-12-profile-and-membership-settings.md) supplies the self-service page; [VAC-13](../jira/VAC-13-api-backed-settings.md) adds the [API](api.md). No production database, invitation delivery or OpenID provider is configured.

## Confirmed account and membership decisions

Source: founder schema-review instructions and clarification, 2026-10-26, recorded in the [charter](../product/product-charter.md) and [ADR-0001](../adr/0001-company-first-web-api.md).

| Location | Fields | Meaning |
|---|---|---|
| Account | `id`, `guid`, `username` | Internal numeric ID, public UUID, globally unique company-email username. Neither ID nor username grants authorization. |
| Account | `firstName`, `middleName`, `lastName`, `gender`, `status` | Names and profile/access facts. Middle name nullable. Gender retains current mock enums; access status uses active/disabled, with fuller lifecycle unresolved. |
| Account | `married`, `dependentChildren`, `soleCare` | Married boolean, integer dependent-child count, sole-care boolean. Unknown values default to false/0/false. Married and sole care cannot both be true. No `mockEligibilityProfile` wrapper. |
| `membership` | `companyId`, `systemRoleId`, `jobRoleId` | GUID references. Current company-shaped MVP uses companyId; a broader organization model is deferred (see later clarification below). Resolve the system role to employee/admin and the separate job role from authorized reference data. |
| `membership` | `departmentId`, `teamId`, `managerUserId` | Organization references retained. Department/team IDs are nullable GUIDs; manager is a nullable user GUID in HTTP projections (numeric foreign key in the domain). Manager does not automatically mean approver. |
| `membership` | `hireDate`, `employmentEndDate`, `priorService` | Employment dates and years employed before this employer. Employer records priorService when hiring. Current-employer tenure is calculated separately. |
| `membership` | `workScheduleId`, `holidayCalendarId`, `leavePolicyId` | Retained schedule/calendar/policy references, represented as nullable GUIDs. Resolve company defaults or report incomplete configuration before calculation. |
| `membership` | `balance` | Policy-based allocation, optional employer custom allocation, and calculated ledger snapshot; details below. |

There is at most one assigned membership object per user for mock/MVP; before assignment the required membership key is null; a company still has many users. Multiple companies per user and multiple job roles per membership remain future scope. Membership owns all company-specific employment, role and balance data. No duplicate organizationId alias is stored in this MVP. This is not the final generic organization-membership design.

## Invitation-based membership assignment

Source: founder clarification, 2026-10-26. Membership is assigned after a company administrator invites the user to the company/organization and, where specified, a team. For the current company-shaped MVP, organization maps to company and the invited team is inside that membership. The later generic organization model is described below; no cross-company team membership is enabled now. The user cannot assign their own company, team or roles through a profile update.

The account record can represent an unassigned state with `membership: null`; see the [unassigned-user example](user-unassigned.example.json). No company role, employment facts or balance is fabricated in that state. Login/account existence alone grants no company-data or company-action permissions; the assigned membership must be authorized before company operations. For the founder-confirmed new-invitee flow (2026-11-01), the account and membership are created together when the recipient registers through the invitation. The unassigned-account representation remains valid for existing supported states; this does not authorize public signup.

Keep a pending invitation separate from an assigned membership. Do not place invitation tokens in the user/profile response. An authorized admin must target their own company and any team/role references must be valid within the applicable scope. Existing users with a membership cannot gain a second company membership through this flow in MVP; reject that operation rather than overwrite/transfer their existing membership. Multi-company access and transfers remain deferred.

**CONFIRMED · 2026-11-01:** An authorized administrator sends an invitation. The new recipient registers through it, creating the Vacate account and membership in the inviting administrator's company together at registration/acceptance. The default membership system role is employee; do not confuse this with a job title or grant delegated settings roles by default. Issuing an invitation creates neither the assigned membership nor company access. A future Invite User form belongs under Settings → Organization. Company email is the usual registration username, retaining global uniqueness. Sources: [charter](../product/product-charter.md#founder-clarification--invitation-registration-and-membership--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).

**CONFIRMED follow-up · 2026-11-01:** Registration must use the email address that received the invitation. Compare using the existing username normalization; do not add provider-specific alias rewriting. Reject a different registration email without creating an account/membership or consuming the invitation. The server checks this binding against server-owned invitation state; a read-only email field alone is insufficient. This is a required future behavior, not implemented enforcement.

**CONFIRMED MVP boundary · 2026-11-01:** Onboard users only through administrator invitations after manually provisioning the initial organization and its first administrator membership. Public independent registration/organization creation is deferred. For the future product, independent registration asks the user to create an organization; users can belong to multiple organizations, with organization selection and multi-organization leave/balance behavior outside MVP. Current at-most-one-membership and exact invited-email rules remain in force. An unassigned-account representation is not a public orphan-signup flow. Manual first-organization/admin bootstrap is confirmed; its operational procedure and authentication setup remain to design. See the [charter](../product/product-charter.md#founder-clarification--organization-onboarding-and-mvp-boundary--2026-11-01).

**OPEN QUESTIONS:** Define recipient verification, duplicate/concurrent invitation handling, existing-account handling, backoffice bootstrap/provisioning and whether/how a company admin may select a non-default role. Invitation expiry/revocation/replay rules are confirmed below. Registration via invitation does not by itself establish a separate employee-without-account feature. No authentication provider, email-delivery implementation or bootstrap execution is selected/authorized here.

**PROPOSED implementation gate:** Make account creation, membership creation and invitation consumption one transaction, with uniqueness/replay checks and full rollback on failure. Resolve the company and permitted role from server-owned invitation state; do not accept a registration payload that substitutes another company or elevates permissions. This is future acceptance work, not implemented behavior.

## Defaults and invariants

The previous maritalStatus enum is replaced by `married`. False does not distinguish single, divorced, widowed and unrecorded. If a later reviewed policy needs those distinctions, introduce explicitly scoped qualifying facts rather than infer divorce from false. Existing mock rules retain legacy marital context for the original scenarios. VAC-12 adds a private own-profile adapter: saving married updates the marriage preview directly, and a changed married fact invalidates legacy marital context instead of inventing divorce/widowhood. The divorced-only single-parent shortcut remains provisional; new boolean facts cannot establish divorce.

Founder-confirmed defaults intentionally collapse unknown married/child/sole-care information to false/zero. They are product input defaults, not verified negative facts. Missing information may therefore change which draft policy conditions match; no backend may present a resulting outcome as a verified statutory entitlement. Gender remains unspecified when unknown; numeric IDs and names have no fabricated defaults.

JSON Schema `default` annotations do not populate records. On creation, backend normalization must map omitted/null unknown married/sole-care values to false and omitted/null unknown child count to zero, then validate the complete record. Reject malformed non-null values such as negative counts, fractions or strings. PATCH omission means unchanged, not reset to defaults; explicitly unknown/null family inputs use the same normalization after authorization. The schema describes normalized full records, requires all declared keys and rejects null family facts. Married=true plus soleCare=true fails after normalization; neither fact silently wins.

`priorService` is a nonnegative number of **years before the current employer**, recorded by an authorized employer. Null means not yet entered; do not silently default service to zero or calculate policy minimum from an invented value. **ASSUMPTION:** fractional years are allowed; precision, rounding, verification, corrections, rehires and non-overlapping recognition remain open. The earlier priorServiceMonths field is removed.

## Balance and policy minimum

Founder-confirmed rule: allocation defaults to what experience-based policies qualify the employee for. An employer may set a custom value, but never below the applicable policy minimum. No actual statutory schedule, thresholds or quota is approved here.

**CONFIRMED annual-leave direction · 2026-11-01:** annual entitlement uses calendar years; MVP employee requests use whole days. The founder requests a persisted membership balance column, organization default vacation days and country-policy allocation floors. The nullable column is an annual allowance override, not remaining days; null uses the applicable policy allowance. Organization default prefills allowance on joining (confirmed); explicit null uses policy. Physical mapping remains open; see the latest annual-balance section below. Other leave-type balances remain separate ledgers; confirm whether this field should instead be a collection before implementing more types. The example's 20-day minimum and 25-day custom allocation are synthetic arithmetic inputs, not a jurisdiction rule.

| `membership.balance` field | Meaning |
|---|---|
| `leaveTypeId`, `unit` | Currently annual / days under the stated draft assumption. |
| `periodStart`, `periodEnd`, `asOf`, `policyVersion` | Allocation period, snapshot date and evaluated policy version. PolicyVersion can be null while unconfigured. |
| `policyMinimum` | Backend-calculated qualifying period allocation from the applicable policy, prior service, current tenure and relevant configuration; null if unresolved. Never accepted as authoritative from a browser. |
| `customAllocation` | Authorized employer selection; null means use policy allocation. Zero is an explicit custom value, not absence. |
| `allocation` | policyMinimum when no custom value; otherwise customAllocation, validated to be at least policyMinimum. Null while minimum is unresolved. |
| `used`, `pending`, `available` | Server-derived consumption, pending amount and available balance. Under the latest charter, approval-required pending requests do not reduce available balance. Preserve unknown allocation/available when policy inputs are unresolved; carried-year treatment is specified separately below. |

A custom selection below the minimum must be rejected, not silently clamped. When policy/service changes, recompute the minimum and revalidate the custom selection. **RESOLVED · 2026-11-01:** If a previously saved custom allocation becomes below a later minimum, keep it unchanged with no automatic effective increase and no required review workflow. Future administrator notification and membership-edit warning flag the shortfall. This supersedes the earlier proposal to block use of the stale value pending review. New/explicitly edited numeric allocations still must meet current agreed floors; see the latest existing-override section below. Do not fabricate a minimum when prior service or required policy inputs are unknown; retain unresolved results and route according to a later agreed workflow.

Available balance can fall below the policy minimum after taking leave; the minimum applies to **allocation**, not remaining days. Available can become negative after retrospective corrections; new excess requests must still be rejected/routed under approved rules. Backend checks period ordering, policy applicability, cross-field equations, policy minima, authorization and concurrency. Standard JSON Schema cannot compare these numeric fields; it only checks shape, nonnegative inputs and that unresolved minimum implies null allocation/available. No fake structural validation substitutes for a backend policy test.

The object is a read model/snapshot, not independent writable totals. Employer allocation commands must not allow editing policyMinimum, used, pending or available. The earlier submission-reservation proposal is superseded by the latest charter: pending requests do not reduce balance while approval is required. Accounting persistence/source-of-truth and membership balance-column mapping are under review in VAC-22. Date-effective policy versions, rounding, accrual, prorating, carryover and cancellation behavior remain open policy decisions.

## Confirmed editing permissions

Source: founder clarification, 2026-10-26. Users may update their own `firstName`, `middleName`, `lastName`, `gender`, `married`, `dependentChildren` and `soleCare`. This permission does not extend to another user. Existing defaults and validation still apply: merge a partial update with the current record before checking married/sole-care exclusivity. A profile edit is not verified policy evidence; reassess affected eligibility rather than reuse a stale assessment.

Only a company administrator may add or update that company's membership attributes, including role references, organizational assignments, employment dates, prior service, configuration references and custom allocation. Resolve administrator authority from the authenticated caller's existing membership in the target company, never from the submitted systemRoleId. Admins of company A cannot administer company B. A user who is also an authorized company admin acts under that admin permission when editing membership.

The membership is a read model: administrator input is limited to configurable attributes and the employer's custom allocation. Policy minimum, calculated allocation, used/pending and available values remain backend/ledger-derived; admin-only configuration does not make derived balances directly editable. Existing policy-floor checks apply to every custom allocation command.

Use separate allowlisted self-profile and admin-membership update contracts. Reject self-profile payloads containing membership data or fields outside the approved set, including `id`, `guid`, `username` and `status`; those fields require a separately defined account-management workflow. Reject mixed permitted/forbidden payloads atomically rather than partially applying them. These are server authorization requirements, not permissions enforced by the full-record JSON Schema or a disabled UI control. Who may edit another person's profile and the remaining invitation lifecycle and transfer administration remain open; this instruction does not silently grant those powers.

## Backend acceptance scenarios to implement later

- Before membership assignment, an account has membership null and no company roles/balance or company-data access. An authorized admin invitation precedes assignment to the target company/team. Reject self-assignment, cross-company admin/team/role manipulation and attempts to add a second company membership in MVP. Test duplicate/concurrent invitations and assignment atomically once lifecycle semantics are agreed.
- An authorized colleague profile read returns only the eight approved display/contact fields. Adding married/maritalStatus, dependentChildren, soleCare, membership, status, service or balance fails the projection schema. Direct/guessed cross-company profile reads are denied; search/list/cache paths do not leak private self/admin records.
- A signed-in user updates each approved profile field on their own account successfully; the same update against another user fails. Self-profile payloads that include membership, account status, username or identifiers fail atomically, including mixed name-plus-role payloads.
- A same-company administrator adds/updates authorized membership configuration; an ordinary employee cannot, including their own membership. An administrator from another company is denied. Client-supplied role IDs cannot grant admin authority; attempts to write derived balances are rejected even for admins.
- Normalize omitted/null family inputs to false/0/false on create; persist existing values on PATCH omission; reject malformed count/type inputs and married+soleCare after merging a patch.
- Authorized employer records prior years at hire; unauthorized employee cannot change their own service/role/custom allocation. Test zero, fractional, missing and negative prior service, and date ordering.
- With an explicitly synthetic policy minimum of 20: custom null yields allocation 20; custom 20 and 25 succeed; custom 19 fails. Allocation 25, used 3, pending 2 yields available 20; taking more leave may reduce available below 20 without invalidating allocation.
- Unknown prior service/required policy configuration yields no fabricated minimum, allocation or available value. Test stale policy and experience thresholds across request dates; custom value falling below a recomputed minimum cannot authorize an under-minimum result.
- Authorized same-company operations succeed. Company A cannot read/update B's membership/balance, assign B's company-scoped job role/team/calendar/policy, or supply a system role outside the approved catalogue. Role IDs resolve to employee/admin but carry no authority on their own. Company is not an Entra tenant.
- Concurrent requests cannot overspend available balance; duplicate global usernames fail atomically. Disabling an account denies new submissions under the eventual authentication contract.

These scenarios include future policy/concurrency requirements. VAC-13 implements profile, membership, authorization, synthetic balance arithmetic and lifecycle checks; leave-policy evaluation and reservation transactions remain deferred. See its verification evidence for executed coverage.

## Identity, projection and migration boundaries

The record remains private application data, not an OIDC token, authentication-store entity or general writable form. Authentication architecture and external login linking remain open; earlier assistant recommendations were not silently adopted. Keep passwords, security stamps, tokens, health data and evidence outside this response. Account facts must not automatically be exposed to every future company administrator. Self-profile and company-admin membership write permissions are defined above; colleague reads follow the explicit projection below; separately privileged personnel reads, retention, account-management permissions and correction audit remain open.

`$defs.directoryPerson` now defines the founder-confirmed colleague profile projection: `username`, `email`, `firstName`, `middleName`, `lastName`, `gender`, `jobTitle` and `systemRole` only. See the [fictional colleague profile example](user-colleague.example.json). This replaces the earlier proposed directory fields; IDs, department/team, membership, account status, marital status/married, dependent children, sole care, employment/service details, policies, balances and eligibility reasons are not returned in this profile response. Any later list/navigation identifier needs an explicit contract decision rather than extending this allowlist silently.

Under the current company-email username rule, email is derived from username and remains identical; do not create a second editable contact field. Backend enforces this equality; standard JSON Schema checks only each email's shape. Job title and employee/admin system-role display values are resolved from the target membership's GUID references in the authorized company. A single job title is returned for MVP; multiple job roles remain deferred. Displaying admin does not grant the viewer admin authority.

The server must authorize the viewer and target in the permitted company scope, then select this explicit projection before serialization. Never send a full user record and hide private fields in the UI; omit prohibited fields entirely, including false/zero/null placeholders and aliases. Apply the same allowlist to profile search/list responses and prevent cached full self-profile data being reused when viewing someone else. This colleague profile access does not establish access to every user in Vacate or expand existing group visibility. No administrator exception for another person's family facts is granted here; any separately authorized personnel view requires an explicit future decision.


Migrating existing public fiction would require authored IDs/role reference catalogues, explicit first/middle/last names and child counts. True child flags cannot reveal exact counts. The old lead capability has no direct system-role equivalent: do not promote leads to admin silently. VAC-12 provides an explicit adapter for fictional names, GUIDs, roles and authored child counts. Until a profile is saved, existing legacy eligibility fixtures retain their reviewed null/unspecified scenarios. Saving uses the confirmed boolean/count defaults and re-evaluates own gender/child/marriage checks; it does not change shared people payloads, roles or ledgers. Production policy questions remain in the review source below.

## Sources

- Founder instructions, 2026-10-26: account fields, family defaults, single membership, GUID company/system/job-role references, company=organization, retained suggested columns, employer-recorded prior years, policy-minimum allocation/customization rule, self-editable profile fields, admin-only membership configuration and assignment following an admin invitation. Canonical records: [charter](../product/product-charter.md), [ADR-0001](../adr/0001-company-first-web-api.md), [VAC-11](../jira/VAC-11-draft-user-schema.md).
- [ADR-0001](../adr/0001-company-first-web-api.md), accepted direction 2026-10-20 and later clarifications: one company per initial account, global company-email uniqueness, manual administration.
- [Mock interface](../../frontend/src/app/core/models/workspace.models.ts) and [fixtures](../../frontend/src/app/core/reference-data/fixtures.js), inspected 2026-10-26: migration context, not implementation of this contract.
- [Eligibility review](../product/leave-eligibility-review.md), 2026-10-24 provisional mock rules, and [policy register](../compliance/policy-sources.md), inspected 2026-10-26: no approved statutory defaults. This revision adopts product defaults, not legal-policy interpretations.

## OPEN QUESTIONS for product review

1. Confirm single annual balance versus per-type balances, day precision, allocation period, accrual/prorating/carryover and policy-minimum recalculation handling for saved custom values.
2. Define fractional prior-service precision, recognized experience, rehire/correction history and missing-service workflow.
3. Self-profile updates, colleague-profile visible fields and admin-only membership configuration are confirmed. Define any separate privileged personnel-read access, editing another user's profile, account-management permissions, remaining invitation security/existing-account/transfer details, role catalogues, approver versus manager authority and audits.
4. Invitation-based assignment is confirmed. Account/membership creation at invitation registration/acceptance and employee default are confirmed (2026-11-01). Invited-email matching is also confirmed. Decide the recipient-verification mechanism, existing-account handling, expiry/revocation/replay, duplicate/concurrent invitations and the manual first-admin bootstrap procedure (manual provisioning itself is confirmed). Choose authentication/provider architecture, email normalization/change, recovery, disabling/revocation and username reuse.
5. Define policy-specific event/dependent facts, evidence, retention and historical evaluation; married=false no longer provides a specific marital state.
6. Multi-company/multiple job-role behavior remains deferred. No new implementation issues are created here.

## Current mock settings implementation

[VAC-12](../jira/VAC-12-profile-and-membership-settings.md), 2026-10-26: Settings is available from the sidebar and profile-initials dropdown at `index.html?page=settings`. The form edits only the seven confirmed self-profile fields; email/username and account status are read-only. Membership is read-only even for admin personas on this self-service page. Unknown hire/service/calendar/policy data remains explicit, and existing fictional configured allocation is shown separately from an unconfigured policy minimum. VAC-13 adds a separate admin membership editor under Organization; invitation delivery/acceptance remains open.

Edits use HTTP and server memory, surviving page reload/sign-out and resetting on API restart. Application services enforce authorization, tenant scope, projections and field validation. The old profile factory remains a reference/component-test double. This is fictional server-session authorization, not production OpenID authentication. The existing People view retains its smaller names/job-title listing; a full colleague profile page is not part of VAC-12.

## Future organization model — direction only

Founder clarification, 2026-10-26: organizations can be companies with departments, teams and groups, or standalone teams, potentially spanning companies. This supersedes earlier company=organization wording for the future domain. The current membership.companyId belongs to the existing company-shaped MVP only. Generic organization IDs, organization versus employer membership, roles and cross-company sharing/privacy will be designed later; no field migration or tenant-isolation exception is inferred. See [charter](../product/product-charter.md#founder-clarification--organizations-beyond-companies-2026-10-26) and [ADR-0001](../adr/0001-company-first-web-api.md#founder-clarification--broader-organization-concept-2026-10-26).


Founder clarification, 2026-10-26: internal departments, groups and teams are optional. Organizations may be flat; department/team references are nullable and not prerequisites for organization membership. [Current administration contract](organization.md) separates independent departments/teams/members rather than enforcing a department/team ladder. Generic groups, multiple-parent relationships and cross-company membership remain later design.

## API implementation boundary · 2026-10-27

The founder requested real HTTP CRUD and server-owned createdAt, updatedAt, deleteRequestedAt and deletedAt on accounts and memberships. The [API contract](api.md) defines projections, allowlisted payloads, lifecycle semantics and access checks. Founder confirmed single-process server memory, resetting on API restart; browser reload/sign-out now retain edits. The earlier browser-only reset behavior remains historical evidence for VAC-12. Production OpenID and database decisions remain open.

## Entity identity · 2026-10-27

Founder clarification applies to all entities: numeric `Id` plus immutable `Guid`, without an `InternalId` alias. Membership also has its own id/guid. The domain stores numeric foreign keys; public API routes and related-object references use GUIDs, including managerUserId. Services resolve these references and authorize company scope. Username is never an update target. See [ADR-0003](../adr/0003-domain-and-application-services.md) and [API contract](api.md).


## Invitation registration acceptance scenarios — specified 2026-11-01

- The initial organization and first administrator membership are provisioned manually through a controlled setup procedure; ordinary MVP onboarding exposes no public independent signup. The procedure remains to design and verify.
- An authorized administrator in company A sends an invitation; it remains separate from assigned membership and grants no company access before registration.
- A new recipient completes registration through a valid invitation using its recipient email; account and membership in A are created together, with employee as the default system role.
- A registration request substitutes a different email, including through a direct HTTP call; reject it without creating account/membership or consuming the invitation. Matching respects existing username normalization. Recipient-verification mechanism remains a separate open decision.
- A registration payload cannot redirect the membership to company B, choose B's team/job role, or self-elevate to admin/settings delegation. Company/team/role references are authorized on the server.
- PROPOSED transactional verification: duplicate/concurrent submissions, replay and username conflicts cannot leave an orphan new account, duplicate membership or partially consumed invitation. Exact conflict/retry behavior depends on the outstanding lifecycle decisions.
- Existing assigned users cannot acquire a second company membership through this flow. Exact handling of existing unassigned accounts remains open.

These are future onboarding checks. Current development account/membership APIs and Angular views remain unchanged; invitation delivery/registration is not implemented by this specification revision.


## Invitation lifecycle and platform backoffice — confirmed 2026-11-01

Source: [charter](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).

Invitations are single-use, expire after seven days, may be revoked and may be resent. Resend invalidates the old link and issues a replacement with a new seven-day validity period. PROPOSED technical representation: server-owned IssuedAt/ExpiresAt/AcceptedAt/RevokedAt/SupersededAt and a hashed token, with expiry at seven elapsed days in UTC. Token storage and exact state-machine implementation remain to design.

A platform backoffice role can add organizations and their administrators. It is distinct from company membership system roles: employee remains the ordinary invitation default. Backoffice-created admin assignment is an explicit provisioning operation, not a client-selected registration role or implicit organization membership for the operator. Founder confirmed, 2026-11-01: backoffice creates the organization, then invites its first administrator through the same invitation flow with an explicit server-authorized admin assignment. Account and admin membership are created together at registration/acceptance, not when the organization/invitation is created. Ordinary member invitations retain employee as the default. Admin invitation acceptance grants no platform backoffice role. This supersedes earlier direct manual first-admin creation wording; first platform-operator bootstrap remains a separate controlled manual setup. Founder further confirmed, 2026-11-01: the first backoffice operator is provisioned through controlled manual setup; thereafter only existing backoffice operators may grant or revoke the platform role. Exact bootstrap procedure, authentication and recovery remain open; this contract does not require a customer-company membership just to identify a platform operator.

Future acceptance gates:

- Unused valid invitations can be accepted once; expiry, revocation, prior acceptance and resend supersession reject the old link without creating account/membership access.
- Concurrent accepts cannot duplicate accounts/memberships; acceptance versus resend/revoke has a single consistent transactional outcome. Retry and email-delivery failure behavior need design.
- An authorized backoffice operator creates an organization and issues its first-admin invitation. Before acceptance there is no new admin account/membership; acceptance with the invited email creates both with the server-owned admin role. Expired, revoked or replaced links cannot create an administrator.
- After controlled manual creation of the first operator, an existing authorized backoffice operator may grant/revoke the platform role. Ordinary employees, company admins and unauthenticated callers cannot self-assign or modify it through direct requests or registration payloads. Check current platform authority server-side for each operation.
- An ordinary employee invitation cannot be upgraded by registration payload changes to admin or platform backoffice.
- An authorized backoffice operator can provision an organization/admin using the agreed flow; ordinary employees/company admins cannot call platform provisioning operations, including by guessed organization GUIDs or role payloads.
- Platform provisioning does not expose employee profiles, private family facts, leave or balance data, or confer impersonation. Additional platform permissions require a separate explicit product decision.

These are specifications only. Existing API endpoints, development credentials, role catalogues and frontend calls/views are unaffected by this documentation change.


## Request granularity and quantity units — confirmed 2026-11-01

Source: [charter](../product/product-charter.md#founder-clarification--request-granularity-and-future-hourly-leave--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).

MVP employee requests use whole days, with one day minimum granularity. Reject half-day, fractional-day and hourly employee submissions server-side; do not silently round or convert them. This does not require requests to occur on consecutive working days or establish chargeable-day/calendar rules. Allocation precision and period/type representation remain separate questions.

The schema must anticipate future hourly leave, including founder-identified school-attendance and maternity-related cases. PROPOSED mapping: explicit Quantity/Unit on entitlement and accounting rows, request charge breakdowns and a defined balance unit. Use decimal quantities (proposed decimal(12,4), subject to review), retaining whole-day validation in the MVP application. Future start/end times, schedule-effective minutes and calculation snapshots can be added when hourly workflow rules are agreed. Do not populate fictitious times, convert a day to eight hours, sum unlike units or enable hourly requests merely because storage can represent them. Day/hour conversion and supported units per leave type require explicit configuration and review.

Future acceptance gates: whole-day employee requests remain representable; fractional/hourly employee submissions fail atomically; unsupported unit/tampered HTTP payloads cannot bypass validation; tenant references remain scoped. A schema review demonstrates storage for future hour quantities without approving any hourly legal rule, quota or UI. Existing API/frontend reference leave data remains unchanged by this specification revision.


## Annual allocation, membership balance and carryover — 2026-11-01

Source: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).

Founder requirements: a persisted membership balance column; retained HireDate/PriorService years; country-policy default/minimum (GR in MVP); organization default vacation days; individual increases by authorized company admin/HR, never below policy minimum. An HR job title is not authorization. Annual allocation and remaining balance must retain distinct meanings; the policy floor applies to allocation, not remaining days after use. Unknown trusted policy stays unknown. CONFIRMED follow-up: the column is annual allowance before leave; null uses the applicable policy allowance and a non-null value is the absolute employee allowance override bounded by the policy minimum. It does not store remaining days or additional days. Organization default prefills joining allowance; explicit null uses policy. Explicit allowances below organization default are rejected with a warning (confirmed). Null may resolve below organization default (confirmed); HR role mapping and policy changes remain open.

Annual entitlement periods begin on 1 January. Previous-year leave may carry through end-March of the following year; exact cutoff is configured. PROPOSED: store each entitlement year's allocation/usage/carry eligibility and resolved cutoff date with policy/configuration version. The requested membership column stores the nullable annual allowance override, not a usage summary. Resolve it against policy when calculating the effective allocation; preserve applied allocation/policy version in entitlement-year history. Current remaining/carryover amounts are separate calculated projections. Do not decrement the allowance column on approval/cancellation. Do not overwrite the previous-year record at renewal or count carryover twice.

PROPOSED organization configuration: nullable DefaultAnnualVacationDays and policy-constrained carryover cutoff settings (e.g. month/day plus year offset), resolved to a concrete per-entitlement date. Schema/naming and organization-versus-policy override rights await decisions. Existing CarryoverYears cannot represent this month/day rule and needs explicit migration design. Future non-GR jurisdictions may have different period/carryover rules. Do not implement automatic forfeiture/payroll consequences at the cutoff.

Future acceptance gates: admin/authorized HR increases obey policy floor and company isolation; employee/unrelated HR writes fail; missing policy inputs do not fabricate a floor; organization defaults cannot produce sub-minimum allocations; January renewal preserves prior-year balances; current and previous-year amounts/deadlines remain distinguishable; retries cannot duplicate grants/carryover; cutoff changes and legacy CarryoverYears migration require explicit review. First-year prorating, consumption order, cancellation after cutoff, effective timezone and post-cutoff treatment remain open. No current API/UI/JSON-schema/runtime behavior changes are made by this documentation revision.


### Nullable allowance storage semantics — confirmed 2026-11-01

Illustrative storage (physical naming remains proposed): Memberships.AnnualAllowanceDays decimal(12,4) NULL. NULL → applicable policy allowance; non-null → absolute annual allowance override, validated against policy minimum. Unknown policy/minimum stays unresolved and cannot be bypassed through a supplied override. Zero is not an inheritance marker. HireDate/PriorService remain membership inputs; used/pending/available and carryover stay separate. The existing membership.balance JSON object and its customAllocation null semantics remain compatible conceptually; no JSON-schema, API or application migration is executed here.

Future checks: a null override resolves from known policy; an explicit override below the minimum fails; taking leave changes consumption/remaining but never the configured annual allowance; an organization default cannot silently replace null → policy behavior. CONFIRMED follow-up, 2026-11-01: prefill the organization default as an explicit employee allowance at joining/setup; preserve an authorized explicit null selection as policy inheritance. Without a configured organization default, leave null. Prefill obeys policy-floor validation and cannot fabricate a minimum when policy is unresolved. Store the chosen employee value; a later organization-default change does not implicitly rewrite it. Explicit values must also meet organization default (confirmed); clearing to null is allowed and uses policy even if lower than org default (confirmed). Existing-year snapshots, configuration updates and effective dating remain to design.


### Organization allowance prefill acceptance gates — 2026-11-01

Refined by the later agreed policy/custom editor section: these prefill gates apply to the Custom allowance option, not an implicit override while Use policy is selected.

- Given a configured organization default and a joining employee, prefill/store that default as the explicit annual allowance, subject to reviewed policy-floor validation.
- Given an authorized explicit null selection, preserve null and resolve the applicable policy allowance; do not refill from organization settings on save/read. Creation omission versus explicit null must be distinguished by the future input contract.
- Given no configured organization default, retain null/policy inheritance. Unknown policy inputs stay unresolved; a prefill is not policy verification.
- Given an organization default below the employee's policy minimum, reject finalizing that candidate; the authorized administrator must choose a valid value or policy inheritance. No silent clamping.
- A later organization-default edit does not implicitly alter stored employee overrides or explicitly null policy inheritance. Bulk-update/effective-dating behavior is not approved here.

These are future checks only; no API/schema/frontend implementation changes.


### Explicit allowance validation — confirmed 2026-11-01

Show a warning and block an explicit allowance below the organization default, even if it meets policy minimum. Validate non-null AnnualAllowanceDays >= max(policyMinimum, organizationDefault) when both are known; without an organization default, policyMinimum remains the floor. The server must reject direct/tampered calls atomically, including mixed valid/invalid updates. Do not silently clamp; retain unchanged server state after rejection. Authorized HR follows the same rule. Keep tenant-scoped access and unknown-policy handling.

Synthetic checks: policy 22/org 25/override 23 fails; override 25 succeeds; policy 26/org 25/override 25 fails. CONFIRMED follow-up: an authorized admin/HR may clear to null; use policy even if below organization default. For policy 22/org 25/null, effective allowance is 22 and saving null is allowed. The organization-default floor applies to explicit numbers only; no policy warning/rejection is required solely because null inherits a lower allowance. Unknown policy still remains unresolved. Later default increases, grandfathering/revalidation and policy-floor changes remain open. No current API/UI/schema behavior changed.


### Null policy-inheritance acceptance gates — 2026-11-01

- Policy 22/org 25/explicit 23: show warning and reject without mutation.
- Policy 22/org 25/explicit 25: accept, subject to authorization and other validation.
- Policy 22/org 25/null: allow an authorized admin/HR to save/clear null; resolve effective allowance to 22 from policy, without substituting the org default.
- Policy 26/org 25/explicit 25: reject below policy minimum. Null resolves to policy 26.
- Unresolved policy plus null stays unresolved, never zero or a fabricated org fallback. Ordinary employees cannot edit allowances, including clearing to null; direct cross-company edits fail.

These scenarios are specified, not executed runtime evidence. Existing input allowlists/API/JSON schema/frontend behavior remain unchanged by this documentation revision.


### Dynamic policy inheritance — founder rationale, 2026-11-01

Null allowance remains null after evaluation, allowing policy results to change with applicable tenure/experience and effective dates. Persist the calculated annual entitlement and provenance in period history rather than turning a calculated policy result into a fixed membership override. Non-null remains the explicitly configured allowance; the handling of an override below a newly increased policy minimum is open. Founder-described 20/21/22 progression is illustrative pending reviewed GR calendar-year/prorating/service rules. Organization-default prefill produces an explicit override, so it does not share null's dynamic inheritance. No calculation algorithm, API, schema or runtime changes are implemented here.


## Agreed allowance configuration and yearly history — 2026-11-01

Source: [charter](../product/product-charter.md#founder-agreement--allowance-override-and-yearly-history--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#allowance-override-and-yearly-entitlement-history--agreed-2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).

Agreed physical direction: Memberships.AnnualAllowanceOverrideDays nullable decimal; retain HireDate, PriorServiceYears and LeavePolicyId. Name explicitly distinguishes a configured annual allowance from current remaining days. Null is preserved as dynamic policy inheritance; non-null is an absolute custom allowance bounded by policy/org minimums under earlier decisions. Exact decimal precision and existing API customAllocation mapping need implementation review; no current API/JSON-schema change is made here.

AnnualLeaveEntitlements retains per-member/year policy version, CalculatedPolicyDays, AppliedAllowanceDays, CarryoverDeadline and CalculatedAt, with company ownership and normal entity identities/lifecycle. Persist evaluation provenance; do not silently recalculate historical years with today's policy. Exact snapshots/revisions/unique keys and mid-year re-evaluation behavior remain design work. Used/pending/remaining and request/accounting history stay separate.

Future admin/authorized-HR form: Use policy persists null, while Custom allowance shows the organization's suggested default and stores a validated numeric choice. This refines automatic joining-prefill into explicit custom-mode prefill; do not persist the suggested number while Use policy is selected. Initial form-mode selection is still open. Existing below-org numeric warning/rejection and allowed lower-policy null cases remain unchanged.

Future checks: policy evaluation never replaces a null override; switching to Use policy clears the override without granting employee edit rights; custom suggestion obeys policy/org floors; taking leave leaves override unchanged; past-year entitlements retain policy/provenance; tenant references and unauthorized role updates fail. A custom override becoming below a later policy minimum remains OPEN QUESTION; no automatic clamping/raise or employer-review workflow is approved yet. Specification only; no runtime verification claimed.


## Existing allowance below a later policy minimum — confirmed 2026-11-01

Source: [charter](../product/product-charter.md#founder-decision--existing-override-below-a-later-policy-minimum--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#existing-custom-allowance-after-policy-progression--confirmed-2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).

Given a valid earlier custom allowance 25 and a later policy minimum 26, preserve configured and applied custom allowance 25. Do not change it to 26, automatically clear to null, recalculate historic grants or create a required administrator review workflow. A future notification to the authorized administrator and a warning on employee membership editing explain that configured allowance is below the current policy minimum. Presentation must distinguish configured allowance from calculated current policy minimum, not label the lower value compliant. Notification channel/scheduling/deduplication remain open.

This is an existing-value transition exception to floor validation, not permission to submit a new invalid numeric allowance. New/explicitly edited allowances below the current policy/org floors still warn/reject. Null remains dynamic policy inheritance. Unknown policy cannot be treated as a known shortfall or fabricated minimum. Existing company authorization/private-field boundaries apply to warning/notification data.

Future acceptance gates: a policy/tenure increase leaves existing override/effective value unchanged; no automatic review state, increase or null conversion occurs; current minimum and warning are visible to authorized membership editors; later notification flags the same condition; unknown policy produces no false minimum/compliance claim; cross-company warnings/notifications are denied; new invalid numeric allowance edits still fail. These are unexecuted requirements. No API, UI, schema, request workflow or notification implementation is changed here.

## Derived balance persistence direction — 2026-11-02

Product lead explicitly requested immediate replacement of stored balance snapshots with leave records and on-demand deductions, including a scoped fictional fixture migration. MembershipEntitlements holds current allowance inputs; Leaves supplies used/pending accounting quantities. The balance response stays a derived read model and existing API/UI fields/equations are unchanged. Known fictional aggregate amounts are labeled ImportedOpening with no invented dates. This does not implement submission, approval/cancellation endpoints, working-calendar computation or policy rules. See [VAC-36](../jira/VAC-36-derived-balances-from-leaves.md) and [mapping](../database/derived-leave-balances.md).
