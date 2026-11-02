# ADR-0001: Company-first absence product and web/API direction

Status: ACCEPTED  
Date: 2026-10-20  
Owner: Product lead / founder

## Context

Earlier drafts describe a market-first European SaaS and a much larger delivery stack. The founder clarified the intended starting point in the repository review on 2026-10-20.

## Decision

Build an absence-management system for use in the founder's company, with the intention of selling subscriptions. Use an Angular web app and a .NET 10 backend API.

SQL Server is a tentative database preference. Azure free or inexpensive hosting is a goal, not an accepted provider configuration or availability commitment.

## Consequences

Prioritise the company workflow and company-isolation requirements. Confirm detailed scope and authentication before implementation. Earlier market sequencing and broad architecture drafts do not define the first release.

## Alternatives considered

The previous market-first, multi-country and multi-client direction remains exploratory reference material; the founder's current direction takes precedence.

## Evidence and links

- Founder instruction, 2026-10-20: company use, later subscription sales, Angular, .NET 10, probable MSSQL and low-cost Azure hosting.
- [Product charter](../product/product-charter.md)
- [Proposed MVP](../product/mvp-scope.md)
- [Technology proposal](../../TechChoices.md)

## Founder clarification — 2026-10-20

Vacate must support many customer companies, not only the founder's company. Accounts and personnel are manually managed initially. Some customers may later integrate their own identity directory; others can continue using application accounts. A Vacate customer company does not require or correspond directly to a Microsoft Entra tenant. Shared versus separate databases/deployments and cross-company account membership remain unapproved architecture details.

## Founder clarification — 2026-10-20

Vacate must support many customer companies. Accounts and personnel are managed manually initially. Some companies may later integrate their own identity directory; others can continue with application accounts. A customer company in Vacate is not a Microsoft Entra tenant and does not require one. Database/deployment isolation remains an architecture question. The initial account scope is clarified below.

## Founder clarification — initial account scope

Source: founder instruction, 2026-10-20. Owners and employees can in reality belong to more than one customer company, but this scenario is deferred. Initially use company email as the username, unique across Vacate, and reject creation of a new account with the same username. Each account accesses one company in the initial scope. Do not implement shared multi-company accounts or company switching yet. Normalisation and email-change/recovery behaviour remain open implementation details.

## Founder clarification — account and company roles, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. A user can conceptually be a member/employee in several companies. Each company membership owns its system role (`employee` or `admin`) and a distinct job role. Multiple job roles per user/company remain undecided. For the mock/MVP, retain one company membership per user account; a company can have many users. Multi-company operations and company switching remain deferred. This clarifies the future model without expanding initial implementation scope or changing the globally unique company-email username decision. The [user draft](../contracts/user.md) flattens the single membership fields for review; field representations and optional business columns remain proposals.

## Founder clarification — membership and policy floor, 2026-10-26

Source: subsequent founder schema review and company/organization clarification, 2026-10-26. Supersedes the earlier flattened membership representation: keep company and employment data under one `membership` object for mock/MVP. Company and organization are the same entity, so retain only `companyId`. Company, system-role and job-role references are GUIDs. Retain the suggested organization/employment/schedule/calendar/policy fields; employer records `priorService` in years before the current employer at hiring. Account unknown married/child-count/sole-care inputs default to false/zero/false; married and sole care remain mutually exclusive. The draft uses a married boolean instead of a marital-state enum and documents the loss of that distinction. Balance allocation defaults to the experience-policy qualifying amount; an employer custom allocation cannot be below that minimum. Allocation is distinct from remaining balance after use. These are product contract directions, not approved statutory values, a specific identity-provider choice or authorization to implement backend policy. See the [draft 0.3](../contracts/user.md) for unresolved balance period/type, policy updates, fractional years and access decisions. Existing mock fixtures/evaluator remain unchanged.

## Founder clarification — invitation-based membership, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. An administrator invitation to a company/organization/team precedes assignment of the user's company membership. Company and organization remain the same entity; team references must belong to the target company. The MVP draft allows an unassigned account (membership null), then at most one assigned company membership; account existence is not company authorization. This extends the manually administered account/personnel direction without approving public signup, company switching or multi-company membership. Exact assignment/activation timing relative to invitation acceptance and first-admin provisioning remain open in the [contract](../contracts/user.md#invitation-based-membership-assignment). No invitation delivery is implemented or authorized by this documentation revision.

## Founder clarification — broader organization concept, 2026-10-26

Source: founder instruction during organization implementation, 2026-10-26. Organizations may be companies with departments/teams/groups or standalone teams, potentially cross-company. The founder explicitly deferred designing that differentiator. This supersedes earlier company=organization wording as a universal domain rule; it remains only the current company-shaped MVP mapping. Existing company isolation, one assigned company membership per account and company-admin checks are not relaxed. Generic organization types, memberships, role boundaries, employer relationships and cross-company sharing require later accepted design before implementation. [Charter direction](../product/product-charter.md#founder-clarification--organizations-beyond-companies-2026-10-26).

## Founder clarification — optional internal structure, 2026-10-26

Source: founder instruction, 2026-10-26. No department/group/team hierarchy is compulsory. An organization may have none of those structures, and internal structure must adapt to it. The current administration read model keeps departments and teams independent with nullable team.departmentId rather than requiring a department for every team; organization membership does not require a team. This does not establish a generic graph, cross-company permissions or new hierarchy mutations. Existing fixtures remain a single illustrative layout.


## Founder clarification — invitation registration timing, 2026-11-01

Source: founder response during [VAC-22](../jira/VAC-22-relational-database-schema.md) schema review. An authorized company administrator sends an invitation; the recipient registers through it, and the user account and membership in that administrator's company are created together on registration/acceptance. This resolves the 2026-10-26 open timing question: invitation issuance does not create the membership or grant company access. The default membership system role is employee. A future invitation form belongs under Settings → Organization.

Registration normally uses company email. Subsequent founder confirmation, 2026-11-01: registration must use the invited email address, compared using the existing username normalization. Different registration emails are rejected. Existing-account handling, recipient-verification mechanism and non-default role selection remain open. Invitation lifecycle rules are confirmed in the subsequent backoffice clarification. Manual first-organization/admin bootstrap is confirmed below. Global username uniqueness and one assigned company membership per account continue to apply. A separate Employees entity is not approved by this clarification. See the [canonical product clarification](../product/product-charter.md#founder-clarification--invitation-registration-and-membership--2026-11-01) and [invitation contract](../contracts/user.md#invitation-based-membership-assignment). No runtime onboarding or database implementation is included.


## Founder clarification — future organization memberships and onboarding, 2026-11-01

Source: [VAC-22](../jira/VAC-22-relational-database-schema.md) discussion. The intended product supports a user belonging to multiple organizations; future independent registration includes organization creation to avoid completing onboarding without an organization. Organization selection and multi-organization leave/balance handling remain outside MVP. Current at-most-one assigned company membership remains the MVP boundary, not the final domain cardinality.

Founder confirmed, 2026-11-01: MVP onboarding is invitation-only, with no public independent signup/organization creation. Manually provision the initial organization and first administrator, including that administrator membership, then invite other users. Exact bootstrap tooling/procedure and authentication setup remain to design; this does not authorize executing provisioning now. Keep Users and Memberships separate so the MVP restriction can later evolve through an explicit reviewed migration. Do not add a global leave balance to Users. See the [canonical clarification](../product/product-charter.md#founder-clarification--organization-onboarding-and-mvp-boundary--2026-11-01). No implementation changes are made here.


## Founder clarification — platform backoffice and invitation lifecycle, 2026-11-01

Founder confirmed invitations are single-use, expire after seven days, support revocation/resend, and resending invalidates the old link. A replacement has a new seven-day validity period. Lifecycle rules must be enforced server-side, including concurrent acceptance/resend/revocation; exact implementation remains to design.

Founder requires a platform backoffice role able to add organizations and their administrators. This refines controlled manual onboarding into backoffice-authorized provisioning. Platform privileges are distinct from organization membership roles and do not follow from company-admin status. The provisioning permission alone grants no employee/private/leave-data visibility or impersonation. First-backoffice-operator bootstrap and role authority are resolved by the subsequent clarification; authentication remains open. First administrator creation is resolved by the following clarification. See the [canonical product clarification](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01). Schema mapping and API/UI implementation are not approved by this documentation revision.


### First organization administrator — confirmed 2026-11-01

Backoffice creates an organization and invites its first administrator with an explicit server-owned admin assignment. Registration/acceptance creates the recipient account and admin membership together; organization creation and invitation issuance do not pre-create either. Apply the same invited-email binding, seven-day expiry, single-use, revocation and resend rules. This refines earlier direct manual administrator provisioning into controlled backoffice invitation onboarding. Ordinary invitations still default to employee, and organization admin does not imply platform backoffice authority. First platform-operator bootstrap and platform-role grant/revocation authority are resolved below. Sources: [charter](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md). No runtime changes.


### Platform backoffice role administration — confirmed 2026-11-01

Manually provision the first backoffice operator through a controlled setup procedure. After initial bootstrap, only existing backoffice operators can grant or revoke the platform backoffice role. Company membership, company-admin status, job title and delegated settings roles grant no such permission. Platform-role grants/revocations must be checked server-side. Bootstrap tooling, authentication, audit and recovery details remain to design; this clarification does not authorize provisioning now. Sources: [charter](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).


### Whole-day MVP requests and future hourly quantities — confirmed 2026-11-01

Employees submit whole-day leave requests in MVP; one day is the minimum granularity. The database must accommodate future hourly leave, including founder-identified school-attendance and maternity-related use cases, without enabling hourly requests now. Unit/quantity representation is a persistence-design concern; hourly policy/eligibility and conversions are not approved here. Keep units explicit and avoid an assumed eight-hour day or mixed-unit arithmetic. Balance periods and allocation precision remain separate open decisions. See the [charter](../product/product-charter.md#founder-clarification--request-granularity-and-future-hourly-leave--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md). No runtime implementation.


### Membership balance, calendar-year entitlement and country policy — 2026-11-01

Founder requests a persisted Membership balance column plus existing hire date/prior-service years, a country-policy annual allocation floor (GR for MVP), organization default vacation days and employer admin/HR individual increases bounded by that floor. Founder subsequently clarified: this nullable column stores annual allowance before leave, with null inheriting the policy allowance and a non-null value supplying an absolute allowance override bounded by the policy minimum. It is not remaining days and is not decremented by leave. Organization-default precedence remains open. Future country support includes NO, SE, FI and DK without assuming Greek year/carryover rules apply there.

Annual allocations renew on 1 January; previous-year leave may carry through end-March of the following year, with precise cutoff configurable. This updates future processing requirements beyond VAC-20's configuration-only scope. Preserve per-entitlement-year history; a single membership scalar cannot identify prior-year versus current-year amounts/deadlines. PROPOSED physical mapping: membership balance summary plus per-period entitlement/balance records; summary maintenance/source-of-truth rules require review. Resolve legacy CarryoverYears migration and jurisdiction-policy constraints before implementing cutoff overrides. No automatic write-off of unused leave or legal defaults approved. Canonical source: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01).


### Nullable membership annual allowance — confirmed 2026-11-01

The founder clarified that the membership balance column is annual allowance before leave is taken. Null means use the applicable policy allowance; a non-null value is the employee-specific annual allowance, not a delta or remaining balance. Validate overrides against the policy minimum; keep unknown policy results unresolved. PROPOSED descriptive physical name AnnualAllowanceDays/AnnualAllowanceOverrideDays, not yet a migration/API naming decision. Track consumption/carryover and entitlement-year history separately. Existing nested API balance projections remain unchanged. Founder subsequently confirmed organization default prefills the employee allowance on joining; explicit null still uses policy. Prefilled values obey the policy floor and are stored employee values, not a live organization fallback. Later organization-default changes do not implicitly rewrite them; bulk-update behavior remains to decide. See the [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).


### Organization allowance prefill — confirmed 2026-11-01

At joining/membership setup, prefill the employee annual allowance from the organization default. Preserve explicit null → applicable policy semantics; absence of an organization default leaves policy inheritance. Apply the same policy-floor/unknown-input checks as any individual override. Organization defaults do not replace explicitly null employee values at read time. Existing-value changes require an explicit update flow; later default changes do not implicitly rewrite individual allowances. Founder subsequently confirmed explicit individual overrides below the organization default must warn and be rejected, even if they meet the policy minimum. See the [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md). No runtime/migration changes.


### Explicit employee allowance floor — confirmed 2026-11-01

A non-null employee annual allowance must meet both the policy minimum and organization default; show a warning and reject lower values server-side and in the future UI without partial mutation/clamping. The effective explicit-value floor is max(policy minimum, configured organization default); without an organization default use policy minimum. Founder subsequently confirmed clearing to null is allowed even when policy allowance is below the organization default: null explicitly selects policy. Apply organization-default floor only to non-null allowances, preserving company-admin/HR edit authorization and unknown-policy handling. Policy unknowns and later organization-default increases remain separate design questions. See the [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md).


### Policy inheritance below organization default — confirmed 2026-11-01

Founder rejected blocking null when policy is lower than organization default. An authorized allowance editor may clear the field to null and use policy, even if that results in fewer days than the organization default. Non-null values still require max(policy minimum, org default). This is an explicit policy-inheritance selection, not a change to zero/default/authorization semantics. See the [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md). No runtime implementation.


### Allowance override and yearly entitlement history — agreed 2026-11-01

Founder agreed to Memberships.AnnualAllowanceOverrideDays (nullable), preserving HireDate, PriorServiceYears and LeavePolicyId. Null is dynamic policy inheritance, never materialized into the override. A number is the employer's absolute annual allowance subject to explicit policy/org floors. Keep yearly AnnualLeaveEntitlements records with MembershipId, EntitlementYear, PolicyVersionId, CalculatedPolicyDays, AppliedAllowanceDays, CarryoverDeadline and CalculatedAt, plus normal identity/company/lifecycle conventions. Exact DDL, historical revision uniqueness and evaluated-input persistence remain to design.

The future authorized editor offers Use policy versus Custom allowance; org default prefills/suggests the custom option, rather than silently replacing policy inheritance. This refines earlier joining-prefill instructions. Historic years retain their policy version/results; usage remains separate from configured allowance. Subsequent founder decision: preserve an existing custom value if a later policy minimum overtakes it, with no automatic effective increase or required review workflow. Future administrator notification and membership-edit warning flag the shortfall; see the following clarification. Sources: [charter](../product/product-charter.md#founder-agreement--allowance-override-and-yearly-history--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md). Existing HTTP/API/JSON field names remain unchanged pending paired implementation.


### Existing custom allowance after policy progression — confirmed 2026-11-01

Preserve previously stored/applied custom allowance when a later policy/tenure change raises the minimum above it. Do not silently use max(override, new minimum), mutate the override or add a review gate. Future administrator notification and a warning on the employee membership edit page identify the shortfall without representing it as policy-compliant. New/explicitly edited numeric allowances still obey policy/org floor validation; null policy inheritance stays dynamic. Historic records remain intact. Notification mechanism/timing remain design work; this is not production legal-policy approval. Sources: [charter](../product/product-charter.md#founder-decision--existing-override-below-a-later-policy-minimum--2026-11-01) and [VAC-22](../jira/VAC-22-relational-database-schema.md). No implementation or external messaging.
