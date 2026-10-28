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

The account record can represent an unassigned state with `membership: null`; see the [unassigned-user example](user-unassigned.example.json). No company role, employment facts or balance is fabricated in that state. Login/account existence alone grants no company-data or company-action permissions; the assigned membership must be authorized before company operations. Whether accounts are created before or during invitation onboarding remains open; this representation does not authorize public signup or account creation.

Keep a pending invitation separate from an assigned membership. Do not place invitation tokens in the user/profile response. An authorized admin must target their own company and any team/role references must be valid within the applicable scope. Existing users with a membership cannot gain a second company membership through this flow in MVP; reject that operation rather than overwrite/transfer their existing membership. Multi-company access and transfers remain deferred.

**OPEN QUESTION:** Is membership created on invitation issuance or on invitee acceptance, and when does it grant access? The founder confirmed invitation precedes assignment, not the precise lifecycle. Also define recipient verification, invitation expiry/revocation/replay, duplicate/concurrent invitations, account binding and who provisions the first company administrator. No acceptance requirement, expiration interval, email-sending implementation or bootstrap permission is invented here. Before implementing onboarding, select these behaviors and test them; a pending invitation alone must not be treated as authorization outside the eventual agreed lifecycle.

## Defaults and invariants

The previous maritalStatus enum is replaced by `married`. False does not distinguish single, divorced, widowed and unrecorded. If a later reviewed policy needs those distinctions, introduce explicitly scoped qualifying facts rather than infer divorce from false. Existing mock rules retain legacy marital context for the original scenarios. VAC-12 adds a private own-profile adapter: saving married updates the marriage preview directly, and a changed married fact invalidates legacy marital context instead of inventing divorce/widowhood. The divorced-only single-parent shortcut remains provisional; new boolean facts cannot establish divorce.

Founder-confirmed defaults intentionally collapse unknown married/child/sole-care information to false/zero. They are product input defaults, not verified negative facts. Missing information may therefore change which draft policy conditions match; no backend may present a resulting outcome as a verified statutory entitlement. Gender remains unspecified when unknown; numeric IDs and names have no fabricated defaults.

JSON Schema `default` annotations do not populate records. On creation, backend normalization must map omitted/null unknown married/sole-care values to false and omitted/null unknown child count to zero, then validate the complete record. Reject malformed non-null values such as negative counts, fractions or strings. PATCH omission means unchanged, not reset to defaults; explicitly unknown/null family inputs use the same normalization after authorization. The schema describes normalized full records, requires all declared keys and rejects null family facts. Married=true plus soleCare=true fails after normalization; neither fact silently wins.

`priorService` is a nonnegative number of **years before the current employer**, recorded by an authorized employer. Null means not yet entered; do not silently default service to zero or calculate policy minimum from an invented value. **ASSUMPTION:** fractional years are allowed; precision, rounding, verification, corrections, rehires and non-overlapping recognition remain open. The earlier priorServiceMonths field is removed.

## Balance and policy minimum

Founder-confirmed rule: allocation defaults to what experience-based policies qualify the employee for. An employer may set a custom value, but never below the applicable policy minimum. No actual statutory schedule, thresholds or quota is approved here.

**ASSUMPTION for this draft:** the single balance is annual leave in days for a specified period. Other leave-type balances remain separate ledgers; confirm whether this field should instead be a collection before implementing more types. The example's 20-day minimum and 25-day custom allocation are synthetic arithmetic inputs, not a jurisdiction rule.

| `membership.balance` field | Meaning |
|---|---|
| `leaveTypeId`, `unit` | Currently annual / days under the stated draft assumption. |
| `periodStart`, `periodEnd`, `asOf`, `policyVersion` | Allocation period, snapshot date and evaluated policy version. PolicyVersion can be null while unconfigured. |
| `policyMinimum` | Backend-calculated qualifying period allocation from the applicable policy, prior service, current tenure and relevant configuration; null if unresolved. Never accepted as authoritative from a browser. |
| `customAllocation` | Authorized employer selection; null means use policy allocation. Zero is an explicit custom value, not absence. |
| `allocation` | policyMinimum when no custom value; otherwise customAllocation, validated to be at least policyMinimum. Null while minimum is unresolved. |
| `used`, `pending`, `available` | Ledger-derived consumption, pending reservations and available amount. available = allocation − used − pending; null when allocation is unresolved. |

A custom selection below the minimum must be rejected, not silently clamped. When policy/service changes, recompute the minimum and revalidate the custom selection. **OPEN QUESTION:** if a saved custom allocation later falls below the minimum, automatically raise it or require employer review? Until decided, never finalize a below-minimum allocation or leave request using that stale value. Do not fabricate a minimum when prior service or required policy inputs are unknown; retain unresolved results and route according to a later agreed workflow.

Available balance can fall below the policy minimum after taking leave; the minimum applies to **allocation**, not remaining days. Available can become negative after retrospective corrections; new excess requests must still be rejected/routed under approved rules. Backend checks period ordering, policy applicability, cross-field equations, policy minima, authorization and concurrency. Standard JSON Schema cannot compare these numeric fields; it only checks shape, nonnegative inputs and that unresolved minimum implies null allocation/available. No fake structural validation substitutes for a backend policy test.

The object is a read model/snapshot, not independent writable totals. Employer allocation commands must not allow editing policyMinimum, used, pending or available. Keep an authoritative allocation/transaction ledger and atomically reserve balance on request submission. Date-effective policy versions, rounding, accrual, prorating, carryover and cancellation behavior remain open policy decisions.

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
3. Self-profile updates, colleague-profile visible fields and admin-only membership configuration are confirmed. Define any separate privileged personnel-read access, editing another user's profile, account-management permissions, remaining invitation/transfer details, role catalogues, approver versus manager authority and audits.
4. Invitation-based assignment is confirmed. Decide issuance versus acceptance timing, access activation, verified recipient/account binding, expiry/revocation/replay, duplicate/concurrent invitations and first-admin provisioning. Choose authentication/provider architecture, email normalization/change, recovery, disabling/revocation and username reuse.
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
