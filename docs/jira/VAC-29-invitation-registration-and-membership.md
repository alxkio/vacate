---
id: VAC-29
type: story
summary: Register invited users and create company memberships
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-28]
---

# VAC-29 — Register invited users and create company memberships

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an invited recipient, register with the invited email and receive the intended company membership together with the account.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future Settings → Organization Invite User form, invitation delivery/acceptance and transactional account/membership creation. Employee default for ordinary invitations; backoffice issues first-admin invitations with explicit admin role. Seven-day single-use links, revoke/resend and old-link invalidation. No public signup, cross-company switching or second assigned membership.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-28](VAC-28-platform-backoffice-provisioning.md): Authorized organization/admin provisioning, invitation issuance storage and ordinary/platform privilege separation.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] An authorized company admin sends an ordinary invitation; invited-email registration creates account/membership together with employee role. Backoffice admin invitation grants only intended company-admin role.
- [ ] Seven-day expiry, single use, revoke and resend supersession are server-enforced; old links fail and concurrent/retried accepts cannot create partial/duplicate accounts/memberships.
- [ ] Direct requests cannot change recipient/company/team/role, bypass existing-account decisions or grant platform privileges. A's admins/invitations cannot target B's records.
- [ ] Form/delivery/error states match API behavior without exposing tokens in profiles or sensitive logs; lifecycle timestamps and recipient verification follow accepted identity contract.

## Subtasks and responsibilities

Backend/database: transactional invitation/account/membership use cases. UX/UI: invitation administration and recipient registration. Infrastructure: chosen delivery integration only after decision. QA/security: expiry/replay/race/email/tenant/role denial paths.

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

Accepted identity/recipient verification and existing-account rules; email provider/channel, failure/retry behavior, invitation fields and ordinary non-default role editing. Delivery/deployment is not authorized by this record.
