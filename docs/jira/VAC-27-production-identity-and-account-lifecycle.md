---
id: VAC-27
type: story
summary: Establish production identity and account lifecycle
status: specification
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: [VAC-26]
---

# VAC-27 — Establish production identity and account lifecycle

![Story](badges/story.svg) **📝 Specification** · Owner: Unassigned

## Description

As an invited user or platform operator, sign in through a supported production identity design with explicit account and role lifecycle controls.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. This record tracks existing discussion scope, not additional product decisions or an implementation/deployment instruction.

## Scope

Future identity decision and implementation: provider/session approach, authentication adapters, verified invited-email binding, global username handling, existing unassigned-account behavior, disabling/revocation/recovery and platform-principal mapping. Support controlled initial backoffice-operator setup without public orphan signup; retain one assigned company membership for MVP. Invitation administration/registration UX is delivered in VAC-29. No provider is selected or identity behavior implemented by creating this record.

Future work remains Specification. Resolve the open questions and verify prerequisite outputs before marking ready or implementing.

## Dependencies

- [VAC-26](VAC-26-azure-sql-resource-persistence.md): Durable account/membership/organization repositories and reviewed SQL migrations/configuration.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] An accepted identity ADR/contracts and supported authentication/session adapters replace development-only credentials for the selected target; provider/session/verification/recovery behavior is tested.
- [ ] Global username conflicts, existing-account handling, disabling/revocation/recovery and session lifecycle have explicit success/error cases; invitation-only account creation is enforced through the agreed registration integration.
- [ ] Company membership, platform provisioning and private-data permissions remain separate; cross-company access and stale/revoked actors are denied, including direct HTTP routes.
- [ ] Backend/API/frontend identity flows and lifecycle timestamps agree; bootstrap, username reuse and retention/erasure are explicitly bounded and operational procedures are reviewable.

## Subtasks and responsibilities

Architect/security/product: identity/provider/lifecycle decisions. Backend/database: adapters and durable session/account mapping. UX/UI: sign-in/session/error/recovery behavior. Infrastructure: selected provider configuration. QA/privacy: revoked actors, cross-company isolation and safe projections.

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

Provider/session mechanism, recovery/verification, principal mapping, existing-account invitations and disable/retention/username-reuse rules remain open. VAC-26 supplies durable account storage; VAC-29 is coordination for invitation UI/recipient acceptance, not a reverse dependency.
