---
id: VAC-22
type: story
summary: Define the relational database schema and persistence boundaries for Vacate
status: todo
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: []
---

# VAC-22 — Define the relational database schema and persistence boundaries for Vacate

![Story](badges/story.svg) **🟢 Open / ready for action** · Owner: Unassigned

## Description

As the product lead, I want a reviewable relational schema grounded in Vacate's accepted domain, so that durable persistence can be introduced without inventing employment, authorization or leave-policy rules.

Founder request, 2026-11-01: capture the enterprise-architect schema proposal in a story and discuss its open questions. The founder prefers Azure SQL's free offer for basic testing, revisiting it when insufficient. This is a starting preference, not provisioning authorization or a capacity guarantee.

## Scope

Ready for database design work: deliver an ERD, table/column catalogue, proposed keys/constraints/indexes, EF/repository mapping plan, persistence ADR proposal and migration/verification plan. These are reviewable design artifacts, not application implementation. Initial mapping, future transaction extension and unresolved decisions must be distinguished. No provisioning, migrations, API/frontend changes, production authentication, invitation delivery or leave workflow implementation is included. Accepted product/architecture decisions remain in the charter, contracts and ADRs; this story does not override them.

### Current design subtasks

| Subtask | Deliverable | Status | Direct prerequisite |
|---|---|---|---|
| [VAC-23](VAC-23-database-erd-and-catalogue.md) | Model the database ERD and table catalogue | Open / ready for action | None |
| [VAC-24](VAC-24-database-integrity-and-verification-design.md) | Design database integrity constraints and verification scenarios | Open / ready for action | [VAC-23](VAC-23-database-erd-and-catalogue.md) |
| [VAC-25](VAC-25-persistence-adr-and-migration-plan.md) | Prepare the persistence ADR and migration plan | Open / ready for action | [VAC-24](VAC-24-database-integrity-and-verification-design.md) |

VAC-23 can start now. VAC-24 follows its model; VAC-25 follows the integrity/verification design. All three have parent VAC-22 and ready design scopes. VAC-22 is complete when their outputs and its design review pass; parent membership is not an implementation dependency or a duplicate work log.

### Deliverables and readiness boundary

1. Current-state-to-proposed ERD and table/column catalogue, including numeric/public identity, company ownership, lifecycle, precision/nullability and the accepted allowance/yearly-history semantics.
2. Proposed relational keys/constraints/indexes and concurrency/transaction strategy, mapped to current domain/repository ports. Non-executed draft DDL may support review; no EF migration or database apply is included.
3. Proposed persistence ADR, API compatibility/mapping notes and migration approach, including existing in-memory fixtures and legacy CarryoverYears compatibility options.
4. Acceptance/tenant-isolation verification plan and a decision register separating engineering proposals from unresolved product/policy choices.

Remaining questions below do not block drawing/reviewing this schema because dependent runtime behavior is explicitly excluded. Authentication/provider selection, existing-account invitation acceptance, non-login personnel, full statutory GR calculations/prorating, request/approval decisions, carryover consumption/expiry/legacy migration execution, notification delivery and retention/erasure are not implemented or silently decided here. Represent stable storage boundaries or clearly labelled options; do not invent a legal rule, identity provider, permission, period revision strategy or transfer algorithm to fill a gap. Physical types/indexes/keys and mapping options are outputs of the design work, not prerequisites the product lead must choose first.

Completion of this story means a reviewed schema proposal and implementation plan are available. It does not mean persistence/onboarding/backoffice/leave features are built, or that every wider MVP decision is resolved. Runtime work needs separately scoped authorization and prerequisites before it starts; the later founder-requested split below now tracks those future outcomes separately, without expanding current design scope.

### Initial persistence mapping — PROPOSED

Every entity retains numeric Id, immutable public Guid, server-owned UTC CreatedAt/UpdatedAt and nullable DeleteRequestedAt/DeletedAt. Use numeric foreign keys internally and GUIDs in public references. PROPOSED: SQL rowversion concurrency tokens, date for business dates, explicit UTC datetimeoffset values and decimal quantities with precision agreed before DDL.

| Table | Proposed contents / boundary |
|---|---|
| Users | Globally unique normalized company-email username, names, gender and account status. Email remains derived from username. |
| UserPrivateProfiles | One-to-one UserId, married, dependent-child count and sole care. Physical separation helps avoid accidental projection leakage; authorization remains mandatory. |
| Memberships | UserId, CompanyId, SystemRoleId, JobRoleId, SettingsRole; nullable DepartmentId, TeamId, ManagerUserId, employment dates, PriorService, WorkScheduleId, HolidayCalendarId and LeavePolicyId. Founder confirms nullable annual allowance override before leave; null uses applicable policy allowance. Agreed name AnnualAllowanceOverrideDays; no decrement on leave. Null stays dynamic policy inheritance. Exact DDL/precision/versioning remains open. |
| SystemRoles | Fixed company-membership employee/admin catalogue with numeric and GUID identity; platform backoffice is separate. |
| PlatformRoles, PlatformRoleAssignments | PROPOSED physical mapping for the confirmed backoffice provisioning role. Principal/account mapping remains open; initial operator is manually provisioned and only existing backoffice operators may grant/revoke the role (confirmed); company membership is not platform authority. |
| JobRoles | Company-owned job-title catalogue, separate from permissions. |
| Organizations | Name, five/six-day workweek, RequireVacationApproval, DepartmentLeadSettingsEnabled, TeamLeadSettingsEnabled, CarryoverEnabled and legacy CarryoverYears. New organization DefaultAnnualVacationDays and precise cutoff configuration are required for future design; legacy compatibility remains open. CompanyId references this table for the current company-shaped MVP. |
| Departments | CompanyId, name and nullable RequireVacationApproval override. |
| Teams | CompanyId, optional DepartmentId, name and nullable RequireVacationApproval override. |
| AnnualLeaveEntitlements | Agreed yearly history alongside nullable membership override: MembershipId, EntitlementYear, PolicyVersionId, CalculatedPolicyDays, AppliedAllowanceDays, CarryoverDeadline, CalculatedAt and evaluation provenance. Keep normal company/identity/lifecycle conventions. Exact revision/unique-key/DDL design remains open; consumption is separate. |

An unassigned account has no membership row. Enforce at most one non-deleted membership per UserId with a filtered unique index. Departments, teams and member assignments remain optional. Keep the current single SettingsRole; do not introduce a generic permissions engine. The one-membership restriction is an MVP constraint, not the intended final cardinality: future users can have multiple organization memberships. Keep balances attached to membership, not User; organization selection and multi-organization leave handling remain deferred.

Approval settings resolve team → department → organization; null inherits and explicit false overrides. Legacy VAC-20 CarryoverYears = 0 means unlimited when enabled; it is configuration only. New 2026-11-01 annual renewal/end-March carryover requirements need separate future processing and cannot be implemented by reinterpreting that field. Migration/compatibility is OPEN QUESTION. Unknown policy minimum keeps allocation/available unknown. Snapshot period uniqueness, precision and replacement/history rules remain open.

### Supporting configuration and later transactions — PROPOSED

| Tables | Purpose / gate |
|---|---|
| WorkSchedules, WorkScheduleDays | Actual working weekdays; employee requests remain whole-day for MVP. Future hourly calculations need effective working-minute configuration; no assumed eight-hour day. Review current shared catalogue before changing ownership. |
| HolidayCalendars, HolidayDates | Explicit calendar/date configuration; proposed company ownership. |
| LeaveTypes | Stable identity and configured annual/event-based semantics; catalogue ownership remains open. |
| LeavePolicies, LeavePolicyVersions | Effective dates, reviewed configuration and source provenance; no statutory values approved here. |
| LeaveEntitlements | Member/type/period allocation and policy-version reference; explicit Quantity/Unit proposed for future hourly compatibility. Period, precision and floor rules remain open. |
| LeaveRequests, LeaveRequestDays | Request lifecycle and chargeable-date breakdown; whole-day employee requests only in MVP. Explicit charge Quantity/Unit proposed for later hourly extension; times/conversion need later design. |
| LeaveRequestEvents | Submission, decision and cancellation history; managers/job titles do not confer approval authority. |
| LeaveBalanceEntries | Posted usage, adjustments and reversals with transactional/idempotency guarantees. Derive totals from accounting records instead of independently editing them. |
| MembershipInvitations | Separate invitation state, company, recipient and proposed assignment; hashed token if token-based onboarding is selected. New-account registration creates membership at acceptance, default employee (confirmed 2026-11-01); recipient-email matching, seven-day expiry, single use, revocation and old-link invalidation on resend confirmed; recipient-verification mechanism remains open. Organization/admin setup uses the required backoffice role; exact flow remains open. |
| AuditEvents | Bounded administrative audit: actor, company, action, target and time. Avoid private-data payloads; retention remains open. |

These extensions are design notes, not additional implementation stories or authorization to build them. Authentication/session tables depend on the production identity decision. Development credentials are not a production design. The confirmed new-invitee flow creates Users and Memberships together at registration/acceptance; invitation issuance alone creates neither. A separate Employees entity is not required by that flow. Whether operational personnel records without accounts are also needed remains OPEN QUESTION; the founder has not approved that additional feature.

### Request units and granularity

CONFIRMED: employees apply in whole days for MVP, minimum one day; hourly/fractional submissions are deferred. Storage must anticipate hourly school-attendance and maternity-related use cases, without claiming legal eligibility or quotas. PROPOSED: decimal(12,4) Quantity plus explicit Unit (`day`/`hour`) on entitlement/charge/accounting records and explicit balance units. Physical precision and permitted units per type need review. Keep whole-day validation at the application boundary; do not derive global balances on Users or add unlike units. Future request times/schedule-minute snapshots require later design; no eight-hour conversion or fictional times. Allocation precision/periods remain undecided.

### Annual balance and allocation defaults — 2026-11-01

CONFIRMED product requirements: persist a membership balance column; keep HireDate and PriorService years; derive default/minimum from applicable country policy (GR MVP, NO/SE/FI/DK later); organization default vacation days; company admin/authorized HR individual increases not below policy minimum. Annual allocation renews each 1 January; previous-year annual leave may carry through end-March of the next year with precise cutoff configurable. This expands future design beyond VAC-20's saved configuration; no processing is implemented here.

CONFIRMED follow-up: Membership allowance is annual allocation before leave; null → applicable policy allowance; non-null → absolute annual allowance override, not additional/remaining days. OPEN QUESTIONS: Org default suggests/prefills Custom allowance; Use policy preserves null (agreed refinement). Explicit allowances must meet organization default and policy minimum (confirmed). Clearing to null is allowed and uses policy even below org default (confirmed); org floor applies to explicit values only. Policy re-evaluation, first-year prorating, HR authority mapping, period timezone, consumption order, cutoff changes/cancellations and legacy CarryoverYears migration need decisions.

The earlier proposed usage-summary interpretation is superseded: member scalar is the nullable annual allowance override and is never decremented by leave. AGREED: AnnualLeaveEntitlements retains per-year policy/calculated/applied allowance and cutoff; usage/carry accounting is separate and exact revision mapping remains open. Do not overwrite history on 1 January or add carryover twice. Keep policy minimum, organization default and individual choice distinct. Null fallback is policy allowance (confirmed); max(policy, organization) was an earlier architect proposal and is not accepted. Organization default suggests/prefills the Custom allowance option; explicit Use policy stays null and is not silently converted to an override (agreed refinement). Validate prefilled values against the applicable policy floor; missing org default retains null. No implicit rewriting of existing values on later org-default changes; bulk changes remain to decide. Versioned jurisdiction policy should provide reviewed defaults/constraints and configuration only permitted overrides. No country pack or post-deadline write-off approved. [Official Greek guidance](../compliance/policy-sources.md#annual-leave-research--2026-11-01) supports the next-year March deadline and payment consequences, not silent forfeiture.

### Agreed configuration/history refinement — 2026-11-01

Membership stores AnnualAllowanceOverrideDays (nullable) plus employment/policy inputs. Null remains dynamic and is never overwritten by evaluation. AnnualLeaveEntitlements preserves policy/calculated/applied allowance and deadline per membership/year; today's policy must not silently rewrite historical results. Future authorized editor explicitly separates Use policy from Custom allowance. Organization default suggests/prefills the custom mode only; this refines earlier blanket joining-prefill. Initial mode selection, exact snapshots/revisions and existing custom allowance below a later policy minimum is preserved, with later admin notification/edit-page warning and no automatic raise or review (confirmed).

### Integrity and concurrency

- Every company-owned row carries CompanyId. Use company-consistent foreign keys and corresponding unique keys, e.g. Memberships(CompanyId, TeamId) → Teams(CompanyId, Id). Global account/reference rows are explicit exceptions.
- Index tenant-scoped access paths and authorize every operation through application services. GUIDs/query filters/private tables alone do not grant access.
- Validate active references and department/team consistency. Manager references must resolve to the same company; physical enforcement strategy needs review.
- Preserve normalization/global username uniqueness; decide username reuse after deletion explicitly.
- Enforce non-negative child/service values, married/sole-care exclusion and employment-date ordering. Do not silently round service.
- Use transactions for assignments and cross-aggregate changes. Protect the last-active-admin invariant under concurrent writes; rowversion alone does not protect every cross-row rule.
- Restrict destructive relationship removal. Soft deletion is not erasure or a retention policy.

## Dependencies

None for this specification story: accepted decisions and source artifacts are available. The agreed outputs support this design scope; runtime implementation is not authorized by this readiness assessment.

Coordination/source links, not direct prerequisites: [VAC-11](VAC-11-draft-user-schema.md) supplies the user contract/open questions; [VAC-13](VAC-13-api-backed-settings.md) supplies current aggregate/repository behavior; [VAC-20](VAC-20-unified-settings-and-navigation.md) supplies scoped settings, approval-aware balances and carryover configuration.

## Acceptance scenarios

- [ ] [VAC-23](VAC-23-database-erd-and-catalogue.md) delivers an ERD and table/column catalogue mapping current entities and accepted changes, with company ownership, identity, nullability, units, lifecycle and relationship cardinalities explicit.
- [ ] Allowance design preserves AnnualAllowanceOverrideDays null inheritance, explicit-value floors, allowed policy-below-org null, custom-mode suggestion, separate yearly entitlements and unchanged existing overrides overtaken by policy, with deferred notification/warning boundaries.
- [ ] [VAC-24](VAC-24-database-integrity-and-verification-design.md) delivers proposed constraints/transactions and a verification plan covering cross-company references/reads/writes, global username/active-membership uniqueness, last-admin concurrency, invitation single use and platform-versus-company privileges. Runtime tests are not claimed as executed.
- [ ] [VAC-25](VAC-25-persistence-adr-and-migration-plan.md) delivers reviewable EF/repository mapping, draft persistence ADR and migration/compatibility plan; unsupported policy/identity/request/carryover/notification behavior is not implemented. Decisions needed before later runtime work are explicit.
- [ ] Local artifact links/metadata and any draft DDL consistency are checked; design review findings are recorded. No provisioning, migrations, deployment or statutory-policy approval is claimed.

## Future work — separate follow-ups, not design completion gates

| Follow-up | Outcome | Status | Direct prerequisite |
|---|---|---|---|
| [VAC-26](VAC-26-azure-sql-resource-persistence.md) | Persist existing Vacate resources in Azure SQL | Specification | [VAC-25](VAC-25-persistence-adr-and-migration-plan.md) |
| [VAC-27](VAC-27-production-identity-and-account-lifecycle.md) | Establish production identity and account lifecycle | Specification | [VAC-26](VAC-26-azure-sql-resource-persistence.md) |
| [VAC-28](VAC-28-platform-backoffice-provisioning.md) | Provision organizations and administrators through backoffice | Specification | [VAC-27](VAC-27-production-identity-and-account-lifecycle.md) |
| [VAC-29](VAC-29-invitation-registration-and-membership.md) | Register invited users and create company memberships | Specification | [VAC-28](VAC-28-platform-backoffice-provisioning.md) |
| [VAC-30](VAC-30-annual-allowance-and-policy-entitlements.md) | Calculate annual allowances and preserve yearly policy entitlements | Specification | [VAC-27](VAC-27-production-identity-and-account-lifecycle.md) |
| [VAC-31](VAC-31-leave-request-accounting-transactions.md) | Record leave requests and balance accounting transactions | Specification | [VAC-30](VAC-30-annual-allowance-and-policy-entitlements.md) |
| [VAC-32](VAC-32-annual-renewal-and-carryover-processing.md) | Renew annual entitlements and process configured carryover | Specification | [VAC-31](VAC-31-leave-request-accounting-transactions.md) |
| [VAC-33](VAC-33-allowance-shortfall-warning-and-notification.md) | Warn administrators about allowances below updated policy minimums | Specification | [VAC-30](VAC-30-annual-allowance-and-policy-entitlements.md) |

These records are in Specification, not ready implementation. They have no parent VAC-22 and are coordination follow-ups; finishing them is not required to finish this design story. Direct dependencies express required outputs, not permission to deploy or implement unresolved behavior.

The previous accumulated runtime checklist is redistributed into these records. No acceptance evidence is lost or falsely marked passed. Retain accepted decisions in canonical sources and the discussion history below.

Future hourly submission, additional country packs, public independent signup/organization creation and multi-organization switching remain deferred context rather than newly scheduled stories. Non-login personnel and broader privacy/retention questions remain explicitly open; no new product choice is inferred from this split.

## Subtasks and responsibilities

- UX: Capture the confirmed future Invite User form under Settings → Organization and invitation → registration → membership flow; no screen implementation.
- UI: Not applicable to this documentation change. Future persistence preserves contracts/views unless an accepted change requires paired updates.
- Backend: Review repository/unit-of-work mapping, reference validation, concurrency and identity boundary; no runtime edits.
- Database: Review ownership, types, keys, constraints, indexes, snapshots and migration plan.
- Infrastructure: Capture free-offer preference; verify eligibility, selected region and operating behavior before provisioning.
- Product: Discuss questions incrementally and update canonical decisions when accepted.
- QA/privacy/security: Review planned tenant/projection/concurrency and backup/restore/retention checks; no production approval inferred.

## Attachments and sources

- [ADR-0001](../adr/0001-company-first-web-api.md), [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md), [ADR-0003](../adr/0003-domain-and-application-services.md).
- [Product charter](../product/product-charter.md), including latest settings/balance clarifications.
- [User contract](../contracts/user.md), [organization contract](../contracts/organization.md), [API contract](../contracts/api.md).
- [Proposed policy model](../domain/policy-model.md); no approved statutory defaults.
- [Current domain](../../api/src/Vacate.Domain/) and [empty EF context](../../api/src/Vacate.Infrastructure/Persistence/VacateDbContext.cs), inspected during the 2026-11-01 discussion.
- Founder/Codex discussion, 2026-11-01: free-offer preference, schema proposal and request to capture/discuss it. Paraphrase, not a verbatim transcript.

## Comments

- C-1 · 2026-11-01 · Codex / enterprise-architect role: Captured the recommendation as specification only. Existing account/organization aggregates lead the initial mapping; additional configuration/request/ledger tables remain proposals.
- C-2 · 2026-11-01 · Codex: The earlier proposed MVP reservation scenario differs from the newer charter direction that pending requests do not reduce balances while approval is required. Source precedence selects the charter direction; approval-time concurrency remains open.

- C-3 · 2026-11-01 · Codex: Founder confirmed the new-invitee registration flow and membership timing; updated charter, ADR-0001 and user contract. This does not establish a standalone employee record without login or an authentication provider.

- C-4 · 2026-11-01 · Codex: Founder confirmed registration must use the invited email. Updated charter, ADR-0001 and user contract; recipient-verification mechanism and existing-account handling remain open.

- C-5 · 2026-11-01 · Codex: Founder clarified future multi-organization membership and independent signup with organization creation. Invitation-only MVP onboarding was suggested, not finally confirmed; no public signup or multi-company functionality is implemented.

- C-6 · 2026-11-01 · Codex: Founder confirmed invitation-only MVP and manual provisioning of the first organization/admin. Canonical documents updated; no provisioning executed.

- C-7 · 2026-11-01 · Codex: Founder confirmed invitation lifecycle and requested a backoffice role for organization/admin creation. Updated canonical sources and proposed separate platform-role storage; employee/private/leave-data access is not inferred.

- C-8 · 2026-11-01 · Codex: Founder confirmed first-admin invitation onboarding after backoffice organization creation. Canonical specifications and future acceptance gates updated; operator bootstrap remains open.

- C-9 · 2026-11-01 · Codex: Founder confirmed controlled manual first-backoffice-operator setup and subsequent role grants/revocations restricted to existing backoffice operators. Canonical sources updated; no provisioning executed.

- C-10 · 2026-11-01 · Codex: Founder confirmed whole-day employee requests for MVP and future hourly storage capability. Captured explicit unit/decimal proposal; hourly rules/conversion and balance periods remain open.

- C-11 · 2026-11-01 · Codex: Founder requested membership balance storage, organization defaults, country-policy floors, admin/HR individual increases and calendar-year renewal with configurable next-year March cutoff. Recorded scalar semantics, precedence and legacy carryover conflicts as open. Official Greek Ministry guidance researched; no legal-policy implementation approval inferred.

- C-12 · 2026-11-01 · Codex: Founder clarified allowance-before-leave and null → policy semantics. Replaced earlier proposed remaining-balance summary interpretation; organization-default interaction remains open.

- C-13 · 2026-11-01 · Codex: Founder confirmed organization default prefills allowance when an employee joins; explicit null remains policy. Updated canonical sources and creation/default/validation scenarios.

- C-14 · 2026-11-01 · Codex: Founder confirmed warn/block for an explicit allowance below organization default. Recorded max(policy minimum, org default) validation and unresolved null → policy versus org-floor interaction; no silent change to null semantics.

- C-15 · 2026-11-01 · Codex: Founder confirmed null is allowed even when policy is below organization default. Reconciled explicit numeric floor versus intentional policy inheritance, with synthetic future acceptance cases.

- C-16 · 2026-11-01 · Codex: Founder explained null as dynamic policy inheritance through initial tenure-based allowance changes, using 20/21/22 as an example. Captured the rationale without treating it as a complete approved legal algorithm; fixed overrides versus later policy-floor increases remain open.

- C-17 · 2026-11-01 · Codex: Founder agreed to override naming, yearly entitlement history and explicit policy/custom modes. Updated current mapping; blanket joining-prefill is refined to custom-option prefill, not silent policy materialization.

- C-18 · 2026-11-01 · Codex: Founder chose unchanged existing override/effective allowance after a policy-minimum increase, with future admin notification and membership-edit warning. No automatic change or review gate. Canonical documents distinguish this from rejection of new invalid numeric edits.

- C-19 · 2026-11-01 · Codex / readiness assessment: Enough product direction exists to start schema design. Separated design acceptance/deliverables from accumulated future runtime checks and explicitly excluded unresolved dependent behavior; marked Open for design only.

- C-20 · 2026-11-01 · Codex: Split current design into VAC-23–VAC-25 and future work into VAC-26–VAC-33. Future follow-ups are separate, Specification-only records; parent completion remains bounded to the three design subtasks and review.

- C-21 · 2026-11-01 · Codex: Founder requested moving all VAC-22-related documents/issues from VAC-21 to dedicated branch VAC-22-database-schema-design and committing the current specification package. Preserve unrelated VAC-21/context/infrastructure edits separately. Engineer handoff: VAC-23–VAC-25 own current design outputs; VAC-26 tracks database infrastructure/persistence implementation with its existing readiness gates. No Azure resources are provisioned by this branch/commit task.

## Decisions

- D-1 · 2026-11-01 · Founder instruction: Create this story and discuss open questions; no schema implementation/provisioning requested.
- D-2 · 2026-11-01 · Founder preference, paraphrased: Start with Azure SQL's free offer for basic testing and reconsider when insufficient. Persistence ADR/provisioning remain pending; no price or eligibility claim is established here.
- D-3 · 2026-11-01 · Codex proposal: Shared relational database with explicit company ownership/constraints and separate accounts, membership, private facts and optional structure. Not accepted architecture until reviewed.

- D-4 · 2026-11-01 · Founder instruction: Administrator invites a new user; invitation registration creates account and company membership together, default employee. Future Invite User form belongs under Settings → Organization. Company email is usual; exact email binding and remaining invitation security/bootstrap choices stay open. Canonical sources: [charter](../product/product-charter.md#founder-clarification--invitation-registration-and-membership--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#founder-clarification--invitation-registration-timing-2026-11-01) and [user contract](../contracts/user.md#invitation-based-membership-assignment).

- D-5 · 2026-11-01 · Founder confirmation, supersedes D-4's open email-binding note: registration must use the email that received the invitation. Compare using existing username normalization; reject a different email without account/membership creation or invitation consumption. Canonical sources: [charter](../product/product-charter.md#founder-clarification--invitation-registration-and-membership--2026-11-01) and [user contract](../contracts/user.md#invitation-based-membership-assignment).

- D-6 · 2026-11-01 · Founder direction: Future users may belong to multiple organizations; independent registration asks them to create an organization. Organization selection and multi-organization leave/balance behavior are outside MVP. See the [charter](../product/product-charter.md#founder-clarification--organization-onboarding-and-mvp-boundary--2026-11-01) and [ADR-0001](../adr/0001-company-first-web-api.md#founder-clarification--future-organization-memberships-and-onboarding-2026-11-01).
- D-7 · 2026-11-01 · Founder suggestion / PROPOSED: Only administrator-invited onboarding for MVP. Await confirmation; first organization/admin bootstrap remains open. This does not authorize public signup or remove existing MVP membership restrictions.

- D-8 · 2026-11-01 · Founder confirmation, supersedes D-7's proposal status: invitation-only onboarding for MVP; manually provision the initial organization and its first administrator membership, then invite other users. Public independent signup/organization creation is deferred. Exact operational bootstrap procedure/authentication setup remain to design. Canonical sources: [charter](../product/product-charter.md#founder-clarification--organization-onboarding-and-mvp-boundary--2026-11-01) and [ADR-0001](../adr/0001-company-first-web-api.md#founder-clarification--future-organization-memberships-and-onboarding-2026-11-01).

- D-9 · 2026-11-01 · Founder confirmation: Invitations expire after seven days, are single-use and support revoke/resend; resend invalidates the previous link. Replacement validity restarts.
- D-10 · 2026-11-01 · Founder requirement, refines D-8: Backoffice role can add organizations and administrators. Platform provisioning is separate from company-admin authority; role/bootstrap/identity mapping and direct-versus-invited administrator flow remain open. Canonical source: [charter](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01).

- D-11 · 2026-11-01 · Founder confirmation, resolves D-10's direct-versus-invited admin question and refines D-8: Backoffice creates the organization and invites its first administrator with explicit server-authorized admin assignment. Same invited-email/lifecycle rules apply; registration creates account/admin membership together. Ordinary invitations default to employee; company admin grants no backoffice rights. Sources: [charter](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#first-organization-administrator--confirmed-2026-11-01) and [user contract](../contracts/user.md#invitation-lifecycle-and-platform-backoffice--confirmed-2026-11-01).

- D-12 · 2026-11-01 · Founder confirmation, resolves D-10/D-11's bootstrap/role-authority questions: manually provision the first backoffice operator; thereafter only existing backoffice operators can grant/revoke the platform role. Organization admins/employees cannot self-assign it. Procedure, authentication and recovery remain to design. Sources: [charter](../product/product-charter.md#founder-clarification--invitation-lifecycle-and-backoffice-provisioning--2026-11-01) and [ADR-0001](../adr/0001-company-first-web-api.md#platform-backoffice-role-administration--confirmed-2026-11-01).

- D-13 · 2026-11-01 · Founder direction: MVP employees request whole days with one-day minimum granularity. Schema anticipates hourly leave, including school-attendance and maternity-related use cases, but hourly employee requests stay deferred. No statutory rule or eight-hour conversion approved. Canonical sources: [charter](../product/product-charter.md#founder-clarification--request-granularity-and-future-hourly-leave--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#whole-day-mvp-requests-and-future-hourly-quantities--confirmed-2026-11-01), [user contract](../contracts/user.md#request-granularity-and-quantity-units--confirmed-2026-11-01).

- D-14 · 2026-11-01 · Founder direction: Membership stores balance plus hire date/prior years. GR policy default/minimum for MVP; future NO/SE/FI/DK. Organization default vacation days and authorized employer admin/HR individual increases, never below policy minimum. Exact balance meaning/override precedence unresolved.
- D-15 · 2026-11-01 · Founder direction, expands future design beyond VAC-20 configuration-only scope: annual allocation renews on 1 January; prior-year leave carries through end-March of the following calendar year with precise cutoff configured. Country-policy placement was raised as a question, not accepted legal interpretation. Legacy CarryoverYears migration and cutoff consequences need review. Canonical sources: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#membership-balance-calendar-year-entitlement-and-country-policy--2026-11-01), [contract](../contracts/user.md#annual-allocation-membership-balance-and-carryover--2026-11-01) and [policy-source research](../compliance/policy-sources.md#annual-leave-research--2026-11-01).

- D-16 · 2026-11-01 · Founder clarification, resolves D-14 scalar ambiguity: membership balance is annual allowance before leave. Null uses policy allowance; a non-null value is the absolute employee annual allowance override, subject to policy floor. Leave consumption is separate; organization default participation still needs decision. Sources: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#nullable-membership-annual-allowance--confirmed-2026-11-01) and [contract](../contracts/user.md#nullable-allowance-storage-semantics--confirmed-2026-11-01).

- D-17 · 2026-11-01 · Founder confirmation, resolves D-16's default-participation question: organization default prefills the employee annual allowance at joining; explicitly null still uses policy. A prefilled value is subject to the same policy floor. Source: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#organization-allowance-prefill--confirmed-2026-11-01), [contract](../contracts/user.md#organization-allowance-prefill-acceptance-gates--2026-11-01). Individual-below-org-default and later bulk-update behavior remain open.

- D-18 · 2026-11-01 · Founder decision, resolves D-17 explicit-below-org-default question: warn the administrator and reject a lower explicit value. Combined floor is max(policy minimum, configured org default). Null/floor interaction and later changes remain open. Sources: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#explicit-employee-allowance-floor--confirmed-2026-11-01), [contract](../contracts/user.md#explicit-allowance-validation--confirmed-2026-11-01).

- D-19 · 2026-11-01 · Founder decision, resolves D-18 null/floor question: do not block clearing to null when policy allowance is below org default. Null uses policy; non-null values still meet both floors. Existing admin/HR authorization and unknown-policy semantics remain. Sources: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#policy-inheritance-below-organization-default--confirmed-2026-11-01), [contract](../contracts/user.md#null-policy-inheritance-acceptance-gates--2026-11-01).

- D-20 · 2026-11-01 · Founder rationale: Null keeps policy-derived allowance responsive to tenure/experience rather than freezing the initial calculation. Preserve null; retain evaluated policy/version/inputs in period history. The example progression is not a complete statutory interpretation. Canonical sources: [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01), [policy model](../domain/policy-model.md#dynamic-inheritance-rationale--2026-11-01) and [contract](../contracts/user.md#dynamic-policy-inheritance--founder-rationale-2026-11-01).

- D-21 · 2026-11-01 · Founder agreement to architect refinements: nullable Memberships.AnnualAllowanceOverrideDays plus employment/policy inputs; yearly AnnualLeaveEntitlements retains policy/calculated/applied results/deadline/provenance. Use policy versus Custom allowance editor with org default suggested for custom mode. Refines D-17 prefill without changing allowed null or explicit-value floors. Existing custom allowance overtaken by policy minimum remains unresolved. Sources: [charter](../product/product-charter.md#founder-agreement--allowance-override-and-yearly-history--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#allowance-override-and-yearly-entitlement-history--agreed-2026-11-01), [contract](../contracts/user.md#agreed-allowance-configuration-and-yearly-history--2026-11-01).

- D-22 · 2026-11-01 · Founder decision, resolves D-20/D-21 stale-override question: leave existing custom allowance unchanged, no automatic effective raise and no review workflow. Later administrator notification and employee membership-edit warning flag the shortfall. Null inheritance and new explicit-edit floors remain unchanged. Notification channel/timing and production policy review remain open. Sources: [charter](../product/product-charter.md#founder-decision--existing-override-below-a-later-policy-minimum--2026-11-01), [ADR-0001](../adr/0001-company-first-web-api.md#existing-custom-allowance-after-policy-progression--confirmed-2026-11-01), [contract](../contracts/user.md#existing-allowance-below-a-later-policy-minimum--confirmed-2026-11-01).

- D-23 · 2026-11-01 · Codex / workflow readiness judgment: VAC-22 is ready for its existing schema-design outcome under the workflow's resolved-or-explicitly-excluded gate. Remaining product/identity/policy questions are documented exclusions for runtime work, not approval to invent behavior. Status todo means ready to produce design artifacts, not authorization to build/provision the full feature set.

- D-24 · 2026-11-01 · Founder request: Split current and future work into separately tracked items. VAC-22 stays the design parent, without changing to an implementation epic. VAC-23–VAC-25 are its current subtasks; VAC-26–VAC-33 are linked future outcomes with their own unresolved questions/direct dependencies. No policy, permission, implementation or deployment decision is added by decomposition.

- D-25 · 2026-11-01 · Founder instruction: Isolate and commit the VAC-22 package on its own branch from the current VAC-21 HEAD for software-engineer handoff. This authorizes the local branch/commit, not a push or Azure deployment; existing future-story gates remain in force.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / assistant recorded | Capture schema, questions, source links and backlog entry; verify documentation consistency | Unknown | Issue-specific duration not measured; story/backlog diff. |

| W-2 | 2026-11-01 | Codex / assistant recorded | Record invitation registration timing/default role and future form location; reconcile canonical sources and open questions | Unknown | Duration not measured; linked charter/ADR/contract and this revision. |

| W-3 | 2026-11-01 | Codex / assistant recorded | Record invited-email binding; reconcile canonical sources and acceptance scenarios | Unknown | Duration not measured; story/charter/ADR/contract revision. |

| W-4 | 2026-11-01 | Codex / assistant recorded | Capture future organization onboarding/cardinality and proposed invitation-only MVP boundary | Unknown | Duration not measured; story and canonical source updates. |

| W-5 | 2026-11-01 | Codex / assistant recorded | Confirm invitation-only MVP/manual bootstrap in canonical sources and acceptance gates | Unknown | Duration not measured; documentation revisions. |

| W-6 | 2026-11-01 | Codex / assistant recorded | Record invitation lifecycle/backoffice requirement, schema implications and access gates | Unknown | Duration not measured; canonical-source and story revisions. |

| W-7 | 2026-11-01 | Codex / assistant recorded | Confirm first-admin invitation flow and reconcile specifications/acceptance gates | Unknown | Duration not measured; canonical-source/story revisions. |

| W-8 | 2026-11-01 | Codex / assistant recorded | Confirm platform-operator bootstrap/role authority and update acceptance gates | Unknown | Duration not measured; story and canonical-source revisions. |

| W-9 | 2026-11-01 | Codex / assistant recorded | Capture whole-day request scope/future hourly storage and quantity-unit acceptance gates | Unknown | Duration not measured; story and canonical-source revisions. |

| W-10 | 2026-11-01 | Codex / assistant recorded | Record membership balance/defaults/renewal direction; research official GR carryover guidance; reconcile source precedence and open decisions | Unknown | Duration not measured; story, charter, ADR, contract, policy model/register revisions. |

| W-11 | 2026-11-01 | Codex / assistant recorded | Clarify nullable annual allowance override; reconcile schema/source-of-truth proposals and open org-default decision | Unknown | Duration not measured; story and canonical-source revisions. |

| W-12 | 2026-11-01 | Codex / assistant recorded | Confirm organization default prefill and preserve explicit-null policy inheritance | Unknown | Duration not measured; story/canonical-source revisions. |

| W-13 | 2026-11-01 | Codex / assistant recorded | Record org/policy explicit allowance floor, warning/rejection gates and null interaction question | Unknown | Duration not measured; canonical-source/story revisions. |

| W-14 | 2026-11-01 | Codex / assistant recorded | Resolve null/org-floor interaction and reconcile explicit versus inherited allowance validation | Unknown | Duration not measured; story and canonical-source revisions. |

| W-15 | 2026-11-01 | Codex / assistant recorded | Record dynamic policy inheritance rationale and review official GR progression context | Unknown | Duration not measured; source discussion and canonical-source/story revisions. |

| W-16 | 2026-11-01 | Codex / assistant recorded | Record agreed allowance override/history/editor refinement and reconcile previous prefill proposal | Unknown | Duration not measured; canonical-source/story revisions. |

| W-17 | 2026-11-01 | Codex / assistant recorded | Record unchanged existing allowance and deferred notification/warning; reconcile prior review/block proposals | Unknown | Duration not measured; story/canonical-source revisions. |

| W-18 | 2026-11-01 | Codex / assistant recorded | Assess readiness, clarify design deliverables/exclusions and update issue/backlog status | Unknown | Duration not measured; story and backlog revisions. |

| W-19 | 2026-11-01 | Codex / assistant recorded | Decompose current/future scope into eleven issue records, update parent/backlog and verify relationships | Unknown | Duration not measured; shared split activity recorded only here, referenced by new issues without duplicate totals. |

| W-20 | 2026-11-01 | Codex / assistant recorded | Isolate VAC-22 source documents/related issues, preserve unrelated changes, verify and commit the handoff package | Unknown | Duration not measured; dedicated branch diff, preservation hash checks and commit evidence. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded. Earlier consultation time is unmeasured and not added as another total.

## History

- H-1 · 2026-11-01 · Codex: Created in Specification at the founder's request; schema/product questions require review before implementation readiness.

- H-2 · 2026-11-01 · Codex: Remains Specification after invitation registration/default role clarification; recipient binding, identity and remaining schema decisions are unresolved.

- H-3 · 2026-11-01 · Codex: Remains Specification after invited-email binding is confirmed; verification mechanism, existing-account handling and other schema questions remain open.

- H-4 · 2026-11-01 · Codex: Remains Specification after future organization model clarification; invitation-only MVP proposal and bootstrap remain unresolved.

- H-5 · 2026-11-01 · Codex: Remains Specification; invitation-only onboarding and manual bootstrap approach confirmed, but procedure, invitation security/identity and other schema choices remain open.

- H-6 · 2026-11-01 · Codex: Remains Specification after lifecycle/backoffice decisions; platform operator bootstrap, authentication and admin creation flow remain open. No implementation/provisioning.

- H-7 · 2026-11-01 · Codex: Remains Specification after first-admin invitation confirmation; platform-operator bootstrap, authentication and remaining database decisions are open.

- H-8 · 2026-11-01 · Codex: Remains Specification after platform bootstrap/role-authority confirmation; operational/identity details and other schema questions remain open.

- H-9 · 2026-11-01 · Codex: Remains Specification after request granularity decision; decimal precision, balance type/period and future hourly rules remain open.

- H-10 · 2026-11-01 · Codex: Remains Specification; annual period and allocation direction clarified, but membership balance semantics, override precedence, carryover migration/consequences and policy approval remain open.

- H-11 · 2026-11-01 · Codex: Remains Specification; scalar and null semantics resolved, organization-default interaction and period/policy processing remain open. No migration/runtime changes.

- H-12 · 2026-11-01 · Codex: Remains Specification; joining prefill/null semantics confirmed, while individual-below-org-default, policy and processing decisions remain open.

- H-13 · 2026-11-01 · Codex: Remains Specification; explicit allowance floor confirmed, null/floor interaction and existing-value revalidation unresolved.

- H-14 · 2026-11-01 · Codex: Remains Specification; null/explicit/default semantics resolved, other policy, historical revalidation and persistence questions remain. No runtime changes.

- H-15 · 2026-11-01 · Codex: Remains Specification after dynamic inheritance rationale; fixed-override revalidation and reviewed policy algorithm remain open.

- H-16 · 2026-11-01 · Codex: Remains Specification after design refinement agreement; custom-floor transitions, policy algorithm and physical/runtime design remain open.

- H-17 · 2026-11-01 · Codex: Remains Specification; stale-override behavior decided, notification mechanism, policy applicability and other schema/processing details remain open.

- H-18 · 2026-11-01 · Codex: Specification → Open / ready for action (todo). Accepted decisions support bounded schema-design work; remaining runtime behavior is explicitly excluded. Design artifacts/review remain to be delivered, so not In progress/Done/Released.

- H-19 · 2026-11-01 · Codex: Remains Open for design; VAC-23–VAC-25 created as current child tasks, VAC-26–VAC-33 as independent future Specification follow-ups. No design/implementation subtask is marked complete.

- H-20 · 2026-11-01 · Codex: Remains Open for design; founder-authorized branch/commit handoff prepared. No application code, Azure provisioning or deployment in this change.

## Verification and release

Documentation checks cover allocated ID, issue/backlog consistency, dependencies/cycles, local links and whitespace. Runtime acceptance scenarios are planned gates, not executed evidence. No migrations, application changes or deployment. Current status is Open for the design deliverables; earlier Specification history remains recorded.

## Open questions and follow-up

Readiness assessment, 2026-11-01: the questions below are retained for design options/future runtime scopes; they do not require speculative product decisions to deliver the bounded schema proposal. No question is closed merely by changing this story to todo.

| ID | Decision needed | Architect recommendation — PROPOSED |
|---|---|---|
| Q1 | New-invitee flow confirmed; are separate personnel records without login also needed? | Confirmed flow: invitation first, then Users + Memberships together at registration/acceptance, default employee. Do not infer a separate Employees entity from this flow; that additional requirement remains open. |
| Q2 | Timing resolved: registration/acceptance creates account and membership. Invited-email matching confirmed; how is recipient control verified? | Registration must use the invited email (confirmed), with existing normalization. Existing-account behavior, recipient-verification mechanism remains open. Seven-day expiry, single use, revocation and resend invalidation are confirmed. Manual bootstrap approach confirmed in Q10; operational procedure remains open. Transactional acceptance/token representation remain architect recommendations. |
| Q10 | RESOLVED: MVP onboarding and bootstrap approach. | Founder confirmed invitation-only MVP and manual provisioning of the initial organization/admin membership. Required backoffice role now owns organization/admin provisioning; backoffice creates organization then invites first admin; first operator is manually provisioned (Q11). Public signup and multi-organization operations stay deferred. |
| Q11 | RESOLVED: first backoffice operator and platform-role authority. | Controlled manual setup creates the first operator. Afterwards only existing backoffice operators grant/revoke that role. Bootstrap tooling, authentication, audit and recovery procedures remain to design. No employee/leave-data access inferred. |
| Q3 | Which authentication approach supports manual accounts and recovery? | Use a supported identity solution; do not extend development credentials into production. Provider remains unselected. |
| Q4 | Request granularity resolved; are balances per type/period, what allocation precision applies, and how do event-based types work? | Whole-day employee requests only in MVP; future hourly storage required. Explicit Quantity/Unit and decimal(12,4) proposed. Annual period is confirmed as calendar year; membership column is a nullable annual allowance override; null uses policy. Allocation precision, event-based semantics, conversion, cross-period splitting and snapshot/history mapping remain open. |
| Q5 | What if pending requests collectively exceed availability at approval time? | Preserve no pending deduction where approval is required; transactionally recheck balance when deciding. Agree rejection/exception behavior and approver authority. |
| Q6 | How do country policy, organization default and individual override combine? Who reviews policy/updates? | GR MVP; versioned reviewed policy floor, org default and admin/authorized HR increases confirmed. Explicit employee override below org default is rejected with a warning even if above policy minimum (confirmed). Scalar meaning resolved as annual allowance override with null → policy; org default custom-option prefill is confirmed (refines automatic joining prefill); null policy inheritance below org default is allowed (confirmed); existing override overtaken by policy stays unchanged with later notification/edit warning, no auto raise/review (confirmed); notification delivery, later bulk changes, policy applicability, prorating and authority mapping need decisions. |
| Q12 | How are annual renewal, March cutoff and existing carryover settings reconciled? | Calendar-year renewal and configured next-year end-March carryover required. Policy placement is proposed; legacy CarryoverYears migration, consumption order, cutoff/expiry consequences and timezone remain open. Official guidance supports taking-leave deadline, not silent forfeiture. |
| Q7 | Which catalogues are shared/company-owned, and is the future workspace model needed now? | Company-own customer-editable configuration; defer cross-company workspaces and review existing catalogue semantics before changing them. |
| Q8 | What are deletion, username-reuse, rehire and retention rules? | Preserve current lifecycle initially; agree reuse/rehire/retention/erasure before production. Soft deletion alone does not resolve these. |
| Q9 | Which schedule/calendar/service precision and history are needed for calculations? | Do not infer weekdays from five/six-day counts or round prior service silently. Agree effective dates and missing-data behavior before charging leave. |

Platform bootstrap and role-grant authority are confirmed. Employee request units are confirmed as whole days for MVP, with future hourly schema capability. Membership nullable annual allowance semantics are confirmed. Organization default custom-option prefill is agreed; Use policy preserves null. Explicit employee allowances below org default are blocked (confirmed). Null → policy is allowed even below org default (confirmed). Existing custom allowances overtaken by policy remain unchanged, with future admin notification/membership-edit warning and no review (confirmed). Next clarify carryover processing (Q6/Q12); authentication and operational procedures remain open design work. First organization administrators register through admin invitations (confirmed). Invitation lifecycle is confirmed; recipient verification and operational procedure remain open. Existing-account handling remains open; there is no new public orphan-account signup requirement. The new-invitee flow is confirmed; separate personnel-without-login support remains unresolved rather than assumed. Resolve only decisions necessary for the selected persistence iteration; later workflow questions can remain explicitly excluded. Future follow-ups are now tracked as VAC-26–VAC-33; they remain Specification and do not gate design completion.
