# Derived membership balances

Date: 2026-11-02 · [VAC-36](../jira/VAC-36-derived-balances-from-leaves.md) · [ADR-0004 amendment](../adr/0004-relational-persistence.md).

The product lead explicitly replaced Stage A balance snapshots now. MembershipEntitlements stores the current membership period, as-of reference, opaque policy version and nullable policy/custom allocation inputs. No Used, Pending, Allocation or Available column is stored. This is the existing one-period model, not a new historical entitlement/policy evaluator.

Leaves stores individual charged day quantities attributed to that membership entitlement through company-consistent composite FKs. Each row has a positive internal numeric identity Id, unique immutable GUID, CompanyId, MembershipId, EntryKind, Status, QuantityDays decimal(12,4), nullable StartDate/EndDate, required Source, server-owned UTC CreatedAt/UpdatedAt and rowversion. Quantities must be positive. An index on company/member/status supports the read path. The unit is explicitly days; no hour/day or working-calendar conversion is inferred from dates.

- RecordedLeave requires ordered, non-null occurrence dates. Used/Pending/Cancelled are accounting buckets in this read model; no request approval or cancellation endpoint/state machine is implemented. A privileged test/operator can supply explicitly sourced fictional rows; the application runtime has SELECT only.
- ImportedOpening requires null occurrence dates and Used/Pending only. Migration/import provenance identifies fictional opening quantities, not dated requests or approvals. A filtered unique index permits at most one opening per entitlement/bucket. Zero totals create no row.

On each SQL-backed membership load, EF reads entitlement and leave rows in the existing unit of work. Used is the sum of Used entries; Pending is the sum of Pending entries. Cancelled entries contribute neither. The existing domain projection derives Allocation and Available; approval-required pending amounts do not reduce Available. Unknown policy inputs continue to produce unknown allocation/availability, not zero. Profile/configuration writes do not rewrite leave rows or persist the calculated totals. Current aggregate ports hydrate rows then sum in memory; no throughput claim or independent cache is introduced.

New membership creation accepts no nonzero consumption totals. The separate explicit fictional importer is the only fixture path creating opening rows. Runtime Leaves privileges are SELECT only, not INSERT/UPDATE/DELETE. Custom allocation still updates MembershipEntitlements through the existing authorized membership use case.

## Forward migration and recovery

Keep the two already applied migrations unchanged. The third forward migration takes the shared transaction-owned resource lock, rejects unrecognized nonzero legacy consumption, creates entitlements/leaves, copies allocation inputs, imports approved fictional openings, verifies row counts and each used/pending sum, and only then drops MembershipBalanceSnapshots within the same transaction. Known fictional provenance requires matching membership/user/company GUIDs, IsDemo=true, expected period and exact original fixture quantities. Zero-consumption synthetic acceptance records retain their entitlement without invented leaves. Unknown nonzero records abort the entire migration for reviewed provenance rather than discarding or fabricating data.

No automatic startup migration/import or destructive database recreation. Repeated migration is a no-op through EF history. Down migration deliberately refuses to collapse leave records back into stored totals; recovery requires a reviewed forward change. Stop the old dev API for the brief schema/code cutover so it cannot use the removed table. Preserve all identities, organization flags, lifecycle values and custom allocation edits.

## Explicit remaining decisions

Submission/approval/cancellation write authority and transitions, concurrency/overspend prevention, date-to-working-day evaluation, cross-year attribution, carryover, yearly revisions, and country policy calculations remain outside this task. Linked entitlement defines accounting attribution; occurrence dates alone do not select a period or imply a statutory computation. A future authorized writer must enforce these rules transactionally; deriving a balance does not by itself prevent concurrent overspending. Neither opening rows nor server lifecycle timestamps constitute immutable legal/audit evidence.

## Execution evidence

[Replacement verification](../jira/media/VAC-36/verification-2026-11-02.md) records the rollback-only positive/negative migration rehearsal, explicit application/repeat, scoped permissions and hosted checks. The updated actual-SQL provider suite remains unexecuted after its execution approval request was rejected; earlier provider results must not be presented as verification of this new schema.
