# Integrity, indexes, transactions and verification

Status: PROPOSED · 2026-11-01 · [VAC-24](../jira/VAC-24-database-integrity-and-verification-design.md).
Prerequisite reviewed: [VAC-23 model/catalogue](schema-catalogue.md). This is a constraint matrix in place of executable DDL. No SQL tests have run.

## Keys and checks

| Scope | Proposed enforcement | Limit / failure handling |
|---|---|---|
| All entity tables | Clustered PK Id; unique Guid, CHECK Id > 0, Guid != all-zero GUID; tenant rows UNIQUE(CompanyId, Id) for composite FK targets | Immutable Guid/CreatedAt enforced through restricted EF updates; not just a convention on user input |
| Lifecycle | UTC offset-zero checks on all datetimeoffset columns; CreatedAt <= UpdatedAt; nullable lifecycle instants >= CreatedAt; DeletedAt requires DeleteRequestedAt and DeleteRequestedAt <= DeletedAt <= UpdatedAt | Service clock owns instants; deletion request doesn't release membership/username or erase data |
| Users | Unique Username over all rows, binary collation on normalized text; nonempty trimmed names; Gender/Status allowlists | Normalization/email validation stays in domain; deleted/disabled username still reserved. SQL 2601/2627 maps to current conflict, no account detail leak |
| UserPrivateProfiles | PK/FK UserId → Users.Id, NO ACTION; children >= 0; NOT(Married=1 AND SoleCare=1) | Required dependent created in same transaction; database FK alone cannot require every User to have a profile |
| Memberships | Unique UserId WHERE DeletedAt IS NULL; CompanyId → Organizations.Id; UserId → Users.Id; SystemRoleId → SystemRoles.Id | “Active” index means non-deleted, not enabled account or employment-date calculation. Requesting deletion retains slot. Concurrent assignment loser conflicts atomically |
| Tenant references | (CompanyId, JobRoleId) → JobRoles(CompanyId, Id); same pattern for Departments/Teams; Teams(CompanyId, DepartmentId) → Departments | Nullable FK skips absent target. Non-null foreign tenant IDs fail even through direct SQL. All delete actions NO ACTION |
| Manager | ManagerUserId → Users.Id; service also requires active membership in same company and allowed non-deleted target | Current model stores UserId; same-company manager cannot be expressed by FK to filtered membership index. Do not claim simple FK proves tenant consistency. Lock same-company membership set on assignments/removals; optional later trigger must be separately reviewed |
| Structure consistency | Service checks a selected team's non-null DepartmentId matches membership assignment per current contract; team moves revalidate referencing members | Nullable composite FK cannot enforce this cross-table rule; use transaction with organization scope lock. Reproduce current API handling for standalone teams; do not make departments mandatory |
| Membership configuration | PriorServiceYears >= 0; EmploymentEndDate >= HireDate when both known; SettingsRole allowlist; owner/hr requires admin SystemRoleId | Preserve null dates/service; no legal tenure rounding. Employment end does not automatically delete membership |
| Organization | WorkWeekDays IN (5,6); CarryoverYears >= 0; name nonempty/max 200 | Do not reinterpret 0 legacy unlimited. Approval bit nullable only on structure overrides |
| Snapshots | PK MembershipId; composite (CompanyId, MembershipId) FK; PeriodEnd >= PeriodStart; used/pending/policy minimum >= 0, custom >= COALESCE(policyMinimum,0) when non-null | Preserve current constructor behavior, including unknown PolicyMinimum. No claim of real accounting or reliable policy. AsOf range must follow actual imported data, not an invented check |
| References | WorkScheduleId → shared WorkSchedules.Id; calendar/policy FK gates in catalogue must resolve before migration | No tenant FK to a global catalogue. Reference catalogues cannot acquire invented policy values |
| Annual history (future) | Unique(CompanyId, MembershipId, EntitlementYear, Revision); year 1..9999, Revision > 0; composite member/version/supersedes FKs; same member/year on supersedes chain; known/unknown null checks; ISJSON(EvaluationInputs) | PROPOSED revisions; authoritative revision selection/effective-time rule needs acceptance. A rowversion is not immutable history. Reject updates/deletes of evaluated revisions through restricted write path |
| Future quantities | Quantity decimal(12,4), Unit IN ('day','hour'); unit/leave-type agreement checked in service; signed balance entries allowed | Never add different units or force all accounting amounts >= 0. New/changed explicit allowance floors are service rules against known policy + org default, not SQL checks against live tables |
| Future invitation | Unique token hash if token flow adopted; composite company assignment FKs; expiry/accepted/revoked timestamps; server-owned role | No hardcoded provider/token choice. Email comparison uses existing username normalization |

No blanket cascading delete. Soft-deleted targets still satisfy FKs, so application checks must reject new references to them. Query filters are a convenience, not an authorization boundary; admin/history and filter-bypass paths need the same company checks. Restrict direct database writes to migration and reviewed application principals.

## Access indexes

Proposed initial indexes match present lookups; verify plans/row counts before adding covering payloads. No family facts, tokens or evaluation JSON in INCLUDE columns.

| Table | Index / access path |
|---|---|
| Users | Unique Guid; unique Username; PK Id supports actor/account lookup |
| Memberships | Unique filtered UserId; (CompanyId, DeletedAt, SystemRoleId) INCLUDE(UserId); (CompanyId, UserId, Id) for membership/history/manager validation; (CompanyId, TeamId), (CompanyId, DepartmentId), (CompanyId, ManagerUserId) for reference removal checks; (UserId, Id) for history |
| Organizations | Unique Guid; PK Id |
| Departments / Teams / JobRoles | Unique Guid and (CompanyId, Id); Teams(CompanyId, DepartmentId) for structure read/removal checks |
| SystemRoles / WorkSchedules | Unique Guid, PK Id; no speculative title/name uniqueness |
| Snapshots | PK MembershipId; (CompanyId, MembershipId) FK/access support |
| Annual history (future) | (CompanyId, MembershipId, EntitlementYear, Revision DESC); unique key above; no separate mutable cached balance |
| Invitations/accounting (future) | Company-scoped invitation status/expiry; unique idempotency keys per operation scope; request/member-period indexes after query/state design |

## Transaction boundaries

Use one scoped DbContext and SQL transaction per IUnitOfWork.Execute operation. Proposed default READ COMMITTED plus rowversion predicates for ordinary edits; acquire transaction-owned exclusive `sp_getapplock` on `vacate:company:<numericId>` before organization-scoped cross-row mutations. All relevant writers must use the same lock, including account disable/delete, member promotion/demotion/removal, manager reassignment, team moves, and role/delegation changes. Re-read actor, membership, references and invariants after locking; never authorize from cached session claims alone. Global account changes lock affected organization then account; future multi-company work needs sorted company-lock ordering. Unassigned account creation relies on username uniqueness; acquire account lock before competing assignments and use the filtered index as final guard. No HTTP/email calls inside SQL transactions.

| Operation | Atomic writes / lock and conflict outcome |
|---|---|
| Create/update user | Account + private profile + lifecycle; rowversion on both; unique normalized username. Invalid family/name/status rolls back all writes |
| Create membership | Lock company and account; recheck invitation/development marker, no existing membership, active references; insert member + snapshot in one transaction; unique index arbitrates races |
| Edit membership/structure | Lock company; reload member/root token; validate all supplied fields before mutation; update aggregate and root UpdatedAt/token. Stale edits conflict; no partial PATCH |
| Last-active-admin removal/demotion/account disable | Lock company before count; join non-deleted membership admin and Users active/non-deleted; reject if no other active administrator remains; update User/member together as required. Two simultaneous demotions cannot both succeed. Apply same guard to all paths; rowversion alone cannot prevent write skew |
| Deletion requests / deletion | Lock organization/account as applicable; honor current references/last-admin conflicts; request timestamps are idempotent, actual deletion tombstones rows atomically. No cascade or GDPR-erasure promise |
| Future invite acceptance | Lock company, invitation/replacement chain, then account; verify normalized recipient, expiry strictly after now, not consumed/revoked/replaced; conditionally consume + insert account/profile/member together. Duplicate email/existing account follows unresolved product path; failure leaves invite unconsumed. Concurrent accept/revoke/resend has one winner |
| Future resend | Same invitation-chain lock; revoke old token + insert new seven-day invitation in one commit; token/email delivery happens after commit with separately reviewed reliable-delivery design |
| Future yearly entitlement | Company/member/year scope plus idempotency; append revision/provenance atomically; never overwrite Membership override or old year. Which event produces revision needs product acceptance |
| Future request/decision/ledger/carryover | Lock scoped member/period; verify state/version; append event and postings/reversals in one transaction with unique idempotency key. Retry produces same result, no duplicated debit/carry. Approver authority, cancellation/cutoff/consumption rules remain gates, not invented outcomes |

Timeout/deadlock/rowversion failure rolls back; do not replay non-idempotent operations blindly. Bounded retry may wrap the complete SQL transaction only after reloading and authorization, with external effects excluded. Translate known unique/FK/concurrency failures through existing ServiceException/HTTP contract; unexpected SQL details never reach clients. Current process lock is not durable rollback or distributed isolation.

## Verification plan (not executed)

Use NUnit with actual SQL Server provider and two independent DbContexts/connections; in-memory EF cannot prove filtered indexes, collation, rowversion or locks. Tests use two synthetic companies A/B and no personal production data. Schema tests run against an isolated explicitly authorized test target; VAC-34 empty DB must stay empty until a later schema authorization.

| ID | Scenario and expected evidence |
|---|---|
| V01 | Round-trip all current resource fields, GUIDs, optional hierarchy and server UTC lifecycle across new context/process; no public numeric IDs |
| V02 | Parallel normalized-email creates (case/space variants) yield one account/profile and one current-contract conflict; removed username remains reserved |
| V03 | Parallel membership assignments to A/B yield one non-deleted row; deletion request retains slot, deleted history permits later authorized assignment |
| V04 | A actor guesses B GUID in GET/PATCH/DELETE and numeric adapter access; current not-found/denial contract, zero changed rows/timestamps in B; test filter-bypass/history paths |
| V05 | A member references B team/department/job role/calendar/policy; service denies atomically and direct SQL composite FK rejects tenant mismatch. Global schedules intentionally remain shared |
| V06 | Foreign/removed manager, removed structure and mismatched team/department rejected; concurrent manager removal/team move and assignment preserve references; no unscoped manager lookup |
| V07 | Own profile returns allowed private fields; colleague/admin-colleague projection contains only allowlist. Exercise SQL projection and raw HTTP JSON, not UI hiding; no private fields in logs |
| V08 | Stale rowversions on user/private profile/member/organization conflict without partial writes. Race child edit with root deletion and verify root token participates |
| V09 | Two concurrent last-admin demotions/deletes/disables with separate connections: at most one succeeds; repeat with disabled user and stale actor. All paths take same company lock |
| V10 | Null approval inherits team→department→organization; explicit false survives round-trip; role/title alone grants no delegation, revocation is observed on next operation |
| V11 | Invalid family/service/date/role patch rolls back every field; UTC createdAt immutable, updatedAt server-owned, request/delete timestamps and conflict behavior match API |
| V12 | Policy 22/org25/null stays null and evaluates22; explicit23 rejected; explicit25 allowed; unknown policy unresolved; Use policy not coerced by suggestion. Later existing21/policy22 remains21 with separate warning feature; history unchanged. Stage B tests, not current AnnualBalance claim |
| V13 | Yearly evaluation records exact version/inputs and explicit unknown state; retry no duplicate revision, January renewal doesn't overwrite prior year or add carry twice. Revision selection acceptance required |
| V14 | Future company admin cannot grant platform role; backoffice provisioning grants no employee/private data visibility; revoked platform authority rejected; manual bootstrap procedure independently reviewed |
| V15 | Future same-link concurrent acceptance, expiry boundary, wrong email, resend-old-link, revoke/accept race: exactly one permitted outcome; rejected attempts create no account/member and don't consume valid invitation |
| V16 | Future submit/decide/cancel/retry/reverse preserves balanced totals and request state; day/hour separated, whole-day submission boundary; unknown approval/carryover cases remain blocked pending decisions |
| V17 | Migration on empty SQL + representative synthetic fixtures preserves IDs/GUIDs/counts/precision, rejects dangling references before writes, repeat deployment applies no duplicate seeds; rollback/restore drill in authorized environment |
| V18 | Existing HTTP host, shared schemas and browser settings paths work after repository swap; dev sign-in stays opt-in; InMemory sessions remain process-local. The 2026-11-13 shared SQL session amendment additionally requires cross-provider resolution, exact expiry, selected-ticket logout, account-wide revocation/rollback, concurrent sign-in versus disable and foreign-company denial. No application change is validated by empty infrastructure alone |

## Design review

Codex self-review, 2026-11-01: nullable FK semantics preserve optional structure but do not enforce active targets; manager FK and team/department consistency require locked service checks. Filtered membership uniqueness alone cannot protect last admin; company lock strategy is explicit. Dynamic policy floors cannot be static checks because stale overrides are deliberately preserved. Annual snapshot constraints are compatibility-only and cannot be reused unchanged for Stage B. Independent review and SQL runtime evidence remain pending.

## Multilingual persistence check · 2026-11-01

User confirmed Nordic and Greek text plus distinct accents. Extend future V01/V17 SQL round-trip checks with synthetic Greek/Nordic/supplementary Unicode text, case-insensitive and accent-sensitive comparisons under the approved database default, and separate normalized-username uniqueness under its explicit reviewed collation. No SQL schema/test data is applied by VAC-34. Control-plane collation readback verifies configuration, not executed string-comparison tests.


## Stage A execution update — 2026-11-02

The [Stage A implementation](implementation-stage-a.md) and [VAC-26 evidence](../jira/media/VAC-26/verification-2026-11-02.md) record the applied baseline and nine passing tests against the actual free dev SQL database. The initial adapter adds a conservative transaction-owned global admission lock before company locks because existing ports traverse multiple companies. This is an explicit serialization limitation. Private-profile aggregate hydration remains internal; response projection isolation is tested. Future-stage V12–V16, independent review and hosted cutover/recovery remain pending; this update does not assert all proposed scenarios passed.
