---
id: VAC-25
type: task
summary: Prepare the persistence ADR and migration plan
status: done
created: 2026-11-01
updated: 2026-11-02
parent: VAC-22
depends_on: [VAC-24]
---

# VAC-25 — Prepare the persistence ADR and migration plan

![Task](badges/task.svg) **✅ Done** · Owner: Unassigned

## Description

Provide the review package needed to implement SQL persistence without breaking current domain/API behavior.

Current design subtask of [VAC-22](VAC-22-relational-database-schema.md). Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Draft a proposed persistence ADR, EF/repository/unit-of-work mapping, API compatibility notes, migration/backfill/rollback plan and design review evidence. Cover inherited ERD/constraint outputs and current in-memory fixtures; no executing SQL, changing runtime identity or deploying Azure.

The scope is ready for design work; direct prerequisite outputs must be available before dependent execution. No runtime implementation is included.

## Dependencies

- [VAC-24](VAC-24-database-integrity-and-verification-design.md): Integrity/index/transaction design and verification matrix, including the inherited model.

Parent relationship is coordination/completion grouping, not a dependency on VAC-22; this avoids a parent/child cycle.

## Acceptance scenarios

- [x] The proposed ADR and mapping preserve ADR-0003 layer boundaries, private projections, numeric/internal versus GUID/public identity and server-owned timestamps.
- [x] Migration options cover existing in-memory data/fictional seeds, yearly policy provenance, allowance override mapping, and legacy CarryoverYears without silently changing product meaning.
- [x] Verification and recovery plans reference the integrity matrix; future infrastructure prerequisites, backup/restore, policy approvals and unresolved runtime choices are explicit.
- [x] Design review findings are recorded and linked; drafts are not marked ACCEPTED without the product lead's decision. No runtime tenant-test or release claim is made.

## Subtasks and responsibilities

Architect/backend/database: ADR/mapping/migration options. QA: validation/recovery plan. Product/privacy: review open choices and acceptance. Infrastructure: operational planning only. UX/UI implementation: Not applicable.

## Attachments and sources

- [VAC-22 decisions and schema context](VAC-22-relational-database-schema.md).
- [Product charter](../product/product-charter.md).
- [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0003](../adr/0003-domain-and-application-services.md).
- [User contract](../contracts/user.md), [API contract](../contracts/api.md) and [policy-source register](../compliance/policy-sources.md).

Accepted canonical sources override issue notes. No unreviewed statutory defaults or new private-data permissions are established by this record.

## Comments

- C-1 · 2026-11-01 · Codex: Created by splitting current design and future work from VAC-22; no implementation or release evidence yet.

- C-2 · 2026-11-01 · Codex / Software Engineer: Delivered and self-reviewed the bounded design artifact, in VAC-23 → VAC-24 → VAC-25 order. [Canonical output](../database/persistence-migration-plan.md). Independent product/privacy review and proposed ADR acceptance remain separate; no runtime evidence is claimed.

- C-3 · 2026-11-02 · Codex: Recorded explicit product lead acceptance in [ADR-0004](../adr/0004-relational-persistence.md#product-lead-acceptance--2026-11-02) and its index. No runtime or Azure changes made.

## Decisions

- D-1 · 2026-11-01 · Founder request: Split current work and future scope into separate tracked items. Existing product decisions remain in linked canonical documents; no open choice is silently resolved.

- D-2 · 2026-11-01 · Codex / engineering proposal: Physical mapping, constraints and migration options are PROPOSED. Accepted behavior is traced to ADRs/charter; policy/identity/retention choices remain explicit in the output.

- D-3 · 2026-11-02 · Founder instruction: Founder accepted delivered ADR-0004 and staged plan; proposed alternatives/unresolved mapping and runtime gates remain separate. Source: [ADR-0004 acceptance](../adr/0004-relational-persistence.md#product-lead-acceptance--2026-11-02).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |
| W-2 | 2026-11-01 | Codex / assistant work | Draft and self-review linked design deliverable | Unknown | Duration not measured; no human or automation time inferred. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed: not recorded. No estimate recorded. No implementation time recorded.

## History

- H-1 · 2026-11-01 · Codex: Created as todo; bounded design work is actionable, subject to listed prerequisites.

- H-2 · 2026-11-01 · Codex: todo → done for design delivery after source/constraint/mapping self-review and documentation checks. No implementation or ADR acceptance is implied.

- H-3 · 2026-11-02 · Codex: Remains Done for design delivery; product acceptance now recorded separately from earlier design self-review, with no runtime evidence implied.

## Verification and release

Documentation metadata, links, parent/dependency graph and backlog consistency are checked during the split. Acceptance evidence is the linked design output and its Review findings/Design review section, plus the [package verification record](media/VAC-34/verification-2026-11-01.md). Relative links, metadata and dependency graph checked; SQL tests are a future verification plan, not executed results. No runtime test, migration, provisioning or deployment is claimed by this design task.

## Open questions and follow-up

ADR-0004 was accepted by the product lead on 2026-11-02; physical implementation and runtime gates remain separate from completed design delivery. Provisioning/production identity/legal-policy/retention behavior must be resolved before dependent runtime work.
