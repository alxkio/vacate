---
id: VAC-28
type: story
summary: Provision organizations and administrators through backoffice
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-27]
---

# VAC-28 — Provision organizations and administrators through backoffice

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As a platform backoffice operator, create organizations and issue first-administrator invitations without acquiring employee-data access.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future backoffice authorization/API/UI and platform-role persistence using reviewed identity design. Controlled manual creation of first operator; thereafter existing operators grant/revoke the role. Create organization then explicit admin invitation; acceptance flow is delivered by the linked invitation story. No company switching, impersonation or private employee/leave visibility.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-27](VAC-27-production-identity-and-account-lifecycle.md): Working selected-target identity/session adapters, verified-recipient/account contract and platform-principal mapping.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] Controlled bootstrap creates the first platform operator; subsequent role mutations require current backoffice authority and are auditable.
- [ ] An operator creates an organization and first-admin invitation with server-owned admin assignment; issuance alone creates no recipient account/membership. Define integration with invitation acceptance.
- [ ] Company admins/employees/unauthenticated callers cannot provision arbitrary organizations or grant platform roles, including tampered/direct HTTP requests.
- [ ] Organization provisioning exposes only authorized provisioning data; no private family/profile/leave/balance access or implicit customer-company membership. API/UI and lifecycle/tenant checks agree.

## Subtasks and responsibilities

Backend/security: platform permissions and bootstrap boundaries. Database: role/provisioning persistence. UX/UI: bounded backoffice provisioning screens. QA: cross-tenant/privilege and lifecycle scenarios. Operations: controlled bootstrap/audit procedure.

## Attachments and sources

- [VAC-22 decisions and schema context](VAC-22-relational-database-schema.md).
- [Product charter](../product/product-charter.md).
- [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0003](../adr/0003-domain-and-application-services.md).
- [User contract](../contracts/user.md), [API contract](../contracts/api.md) and [policy-source register](../compliance/policy-sources.md).

Accepted canonical sources override issue notes. No unreviewed statutory defaults or new private-data permissions are established by this record.

## Comments

- C-1 · 2026-11-01 · Codex: Created by splitting current design and future work from VAC-22; no implementation or release evidence yet.

## Decisions

- D-1 · 2026-11-01 · Founder request: Split current work and future scope into separate tracked items. Existing product decisions remain in linked canonical documents; no open choice is silently resolved.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed: not recorded. No estimate recorded. No implementation time recorded.

## History

- H-1 · 2026-11-01 · Codex: Created as specification; future decisions/prerequisites remain open; no implementation started.

## Verification and release

Documentation metadata, links, parent/dependency graph and backlog consistency are checked during the split. Acceptance scenarios are pending; no runtime test, migration, provisioning, external messaging, commit, push or deployment is claimed.

## Open questions and follow-up

Identity/task VAC-27 output; exact operator/admin fields, role grant/revoke UX, failed or unaccepted first-admin invitation states and operational recovery. Related VAC-29 delivers recipient registration; it is not a blocker for backoffice issuing/storing invitations.
