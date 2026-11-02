---
id: VAC-36
type: task
summary: Derive membership balances from leave records
status: qa
created: 2026-11-02
updated: 2026-11-02
parent: null
depends_on: [VAC-25, VAC-34]
---

# VAC-36 — Derive membership balances from leave records

![Task](badges/task.svg) **🔍 QA** · Owner: Unassigned

## Description and authorization

On 2026-11-02 the product lead requested a leaves table with balances calculated when needed, then explicitly selected replacement now, including a scoped leave-record model and fixture migration. This supersedes the Stage A compatibility snapshot mapping without authorizing leave submission, approvals, policy calculations or invitations.

## Scope and decisions

- D-1 · 2026-11-02 · Product lead: persist leave records, derive consumption and remaining balance on read; replace snapshots now.
- D-2 · 2026-11-02 · Engineer with architect advice: MembershipEntitlements retains current period and allocation inputs, never Used/Pending/Available totals. Leaves has tenant-scoped positive day quantities and accounting status; runtime has read-only leave access until an authorized write workflow exists.
- D-3 · 2026-11-02 · Migration safety: known fictional legacy amounts become explicitly marked ImportedOpening entries with null occurrence dates. No dates, requests, approvals or real history are fabricated. Reject unrecognized nonzero legacy consumption; verify migrated sums before dropping snapshots. Zero consumption needs no opening entry. Preserve applied migrations/history.
- D-4 · 2026-11-02 · Organization settings physical mapping is unchanged; the question did not authorize that separate refactor.

RecordedLeave permits explicitly dated records for read-model verification; Used/Pending/Cancelled are accounting buckets, not implementation of an approval state machine. QuantityDays is authoritative charged quantity; dates do not imply working-calendar computation. Cross-period attribution, cancellations/reversals, request write authorization, concurrency/overspend and policy evaluation remain future accepted feature work. No additional Azure resource, tier or paid feature is needed.

## Dependencies

[VAC-25](VAC-25-persistence-adr-and-migration-plan.md): accepted mapping boundary and reviewed forward migration approach. [VAC-34](VAC-34-empty-azure-sql-free-offer.md): existing free-offer development SQL target. VAC-26 supplies already implemented adapters as coordination, not a reciprocal dependency. VAC-35 relocation remains separate.

## Acceptance scenarios

- [x] No current snapshot table or stored used/pending/available totals after forward migration; historic applied migration files remain.
- [ ] Entitlement/leave composite FKs reject foreign-company attribution; positive quantities, explicit origins/dates, opening uniqueness, UTC and concurrency checks hold.
- [ ] On-demand used/pending sums exclude cancelled records and preserve existing allocation/approval/unknown semantics.
- [x] Fictional migration preserves exact totals and identities, rejects unknown nonzero provenance, and is repeat-safe.
- [x] Allocation/profile edits cannot rewrite leave consumption; runtime cannot write Leaves or schema.
- [ ] Provider tests, hosted HTTP/schema and appropriate browser checks pass; existing native-browser limitation is reported separately.
- [x] Final architect review includes this replacement and post-cleanup state; no P0/P1 architectural blocker, provider/native QA gaps explicitly retained.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-02 | Codex / assistant recorded | Scope replacement, consult architect, implement and verify forward migration and derived read model | Unknown | Unmeasured; [execution evidence](media/VAC-36/verification-2026-11-02.md). No duplicate VAC-26/VAC-35 automation time. |

| W-2 | 2026-11-02 | Architect agent / assistant recorded | Pre-apply and final source/readback/cleanup review, numeric-ID correction and QA evidence review | Unknown | Unmeasured; [final review](media/VAC-36/architect-review-2026-11-02.md). No human release approval. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not separately measured; no updated provider execution occurred.

## History and verification

- H-1 · 2026-11-02 · Codex: Created In progress after explicit immediate-replacement instruction. Previous architect review applies to the preceding implementation; a fresh review is required for this change.

- H-2 · 2026-11-02 · Codex: In progress → QA after applied/repeated forward migration, rollback-only positive/negative rehearsal, limited grant probe and hosted HTTP/schema/smoke/full functional browser acceptance. Updated 17-provider-case execution request was rejected before running; no pass claimed and no retry made.

## Open questions

Future request/approval/cancellation policy, effective-dated/yearly entitlement evaluation, working calendars and production identity/recovery remain outside this task. Imported opening amounts are synthetic compatibility facts, not reconstructed real leave history.


## Acceptance evidence and final review

[Replacement verification](media/VAC-36/verification-2026-11-02.md), [artifact/target](media/VAC-36/deployed-artifact.json), [actual SQL controls](media/VAC-36/sql-free-controls-after-replacement.json) and [post-apply architect review](media/VAC-36/architect-review-2026-11-02.md). Migration provenance/count/sum checks ran against actual SQL in rollback-only acceptance, then applied/repeated successfully. Hosted HTTP/schema/smoke/full functional browser checks passed with unchanged API/UI contracts. Runtime cannot write Leaves. Remaining unchecked constraint/concurrency/cancelled-record scenarios need the 17 updated provider tests, whose execution request was rejected; previous provider results belong to the earlier schema. Native browser reliability remains VAC-15 QA. No full release approval or new leave workflow is claimed.
