---
id: VAC-24
type: task
summary: Design database integrity constraints and verification scenarios
status: done
created: 2026-11-01
updated: 2026-11-01
parent: VAC-22
depends_on: [VAC-23]
---

# VAC-24 — Design database integrity constraints and verification scenarios

![Task](badges/task.svg) **✅ Done** · Owner: Unassigned

## Description

Turn the relational model into a reviewable integrity, concurrency and verification design.

Current design subtask of [VAC-22](VAC-22-relational-database-schema.md). Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Design keys, indexes, company-consistent FKs, uniqueness, lifecycle restrictions, optimistic concurrency and transaction boundaries. Provide non-executed draft DDL or a constraint matrix and a verification plan; no migrations or runtime feature implementation.

The scope is ready for design work; direct prerequisite outputs must be available before dependent execution. No runtime implementation is included.

## Dependencies

- [VAC-23](VAC-23-database-erd-and-catalogue.md): ERD and column catalogue to constrain this design.

Parent relationship is coordination/completion grouping, not a dependency on VAC-22; this avoids a parent/child cycle.

## Acceptance scenarios

- [x] Model tables have proposed PK/public-Guid uniqueness, tenant-scoped FKs/indexes and active-membership/global-username uniqueness rules.
- [x] Concurrent membership assignment, last-active-admin changes, invitation consumption and allowance-accounting operations have documented transaction boundaries and failure outcomes, with undecided product outcomes labelled.
- [x] A verification matrix covers A-to-B reads/writes/reference manipulation, private projections, platform/company privilege separation, null/explicit allowances, stale overrides and lifecycle timestamps.
- [x] Draft constraints are checked for consistency with nulls, soft deletion and optional structure; unsupported hourly/request/carryover policy remains excluded.

## Subtasks and responsibilities

Database/backend: constraint/index/transaction design. QA/privacy/security: review denial/concurrency/projection scenarios; no self-approved production release. UX/UI/infrastructure implementation: Not applicable.

## Attachments and sources

- [VAC-22 decisions and schema context](VAC-22-relational-database-schema.md).
- [Product charter](../product/product-charter.md).
- [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0003](../adr/0003-domain-and-application-services.md).
- [User contract](../contracts/user.md), [API contract](../contracts/api.md) and [policy-source register](../compliance/policy-sources.md).

Accepted canonical sources override issue notes. No unreviewed statutory defaults or new private-data permissions are established by this record.

## Comments

- C-1 · 2026-11-01 · Codex: Created by splitting current design and future work from VAC-22; no implementation or release evidence yet.

- C-2 · 2026-11-01 · Codex / Software Engineer: Delivered and self-reviewed the bounded design artifact, in VAC-23 → VAC-24 → VAC-25 order. [Canonical output](../database/integrity-and-verification.md). Independent product/privacy review and proposed ADR acceptance remain separate; no runtime evidence is claimed.

## Decisions

- D-1 · 2026-11-01 · Founder request: Split current work and future scope into separate tracked items. Existing product decisions remain in linked canonical documents; no open choice is silently resolved.

- D-2 · 2026-11-01 · Codex / engineering proposal: Physical mapping, constraints and migration options are PROPOSED. Accepted behavior is traced to ADRs/charter; policy/identity/retention choices remain explicit in the output.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |
| W-2 | 2026-11-01 | Codex / assistant work | Draft and self-review linked design deliverable | Unknown | Duration not measured; no human or automation time inferred. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed: not recorded. No estimate recorded. No implementation time recorded.

## History

- H-1 · 2026-11-01 · Codex: Created as todo; bounded design work is actionable, subject to listed prerequisites.

- H-2 · 2026-11-01 · Codex: todo → done for design delivery after source/constraint/mapping self-review and documentation checks. No implementation or ADR acceptance is implied.

## Verification and release

Documentation metadata, links, parent/dependency graph and backlog consistency are checked during the split. Acceptance evidence is the linked design output and its Review findings/Design review section, plus the [package verification record](media/VAC-34/verification-2026-11-01.md). Relative links, metadata and dependency graph checked; SQL tests are a future verification plan, not executed results. No runtime test, migration, provisioning or deployment is claimed by this design task.

## Open questions and follow-up

Exact product approval/carryover decisions are excluded; design records their required future acceptance gates rather than selecting outcomes.
