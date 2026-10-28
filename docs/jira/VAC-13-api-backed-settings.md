---
id: VAC-13
type: story
summary: Support profiles, memberships and organizations through application services and API
status: qa
created: 2026-10-27
updated: 2026-10-27
parent: null
depends_on: [VAC-12, VAC-2]
---

# VAC-13 — Support profiles, memberships and organizations through application services and API

![Story](badges/story.svg) **🔍 QA** · Owner: Codex

## Description and scope

Founder request, 2026-10-27: seed the test accounts in the API; implement CRUD for accounts, memberships, organizations and existing optional departments/teams. Reads and updates use real HTTP from the web; creation/deletion remain API-only. Add createdAt, updatedAt, deleteRequestedAt and deletedAt UTC timestamps. Future feature work must cover API and frontend together.

Founder-confirmed persistence: server memory, reset on API restart; browser reload/sign-out retain edits. ASSUMPTION: opt-in Infrastructure development credentials/fictional seeding with opaque expiring server-issued sessions; production OIDC and database infrastructure remain undecided in ADR-0002. No real employee data. Deletion is a soft lifecycle operation, not a claim of GDPR erasure. Existing leave ledgers and reference calculations remain fictional and separate; no unapproved entitlement policy is encoded.

## Dependencies

[VAC-12](VAC-12-profile-and-membership-settings.md) supplies the implemented self-profile/membership page and allowlists. [VAC-2](VAC-2-organization-settings-mock.md) supplies organization/week and department/team forms. Both outputs inspected; their independent review remains outstanding. [VAC-11](VAC-11-draft-user-schema.md) is related contract coordination, not another implementation blocker.

## Acceptance scenarios

- [x] Domain entities/value objects enforce rules without HTTP/storage; application services own user, membership and organization use cases; repositories/seeds live in Infrastructure; endpoints remain thin.
- [x] Application code has no demo folders or demo resource routes; Angular uses feature folders and separate resource API services.

- [x] All twelve fictional accounts authenticate through the enabled API; unavailable/disabled API fails visibly without local write fallback.
- [x] Self-profile HTTP edits validate atomically, persist across page reload/sign-out while the API is running, and reject family conflicts/overposting.
- [x] Only target-company admins update membership configuration; colleagues never receive private family data. Membership web editing works.
- [x] Admin organization/workweek and department/team edits use HTTP and survive browser reload. Optional structure is retained.
- [x] API-only create/read/update/delete lifecycle is covered for accounts, memberships, organizations and structural nodes; references cannot cross tenants.
- [x] UTC lifecycle timestamps are server-owned; deletion requests and deletion differ, deleted records are excluded, sessions lose access on account/membership removal.
- [x] API tests and frontend contract checks exercise unauthorized, cross-company and stale-session writes; paired checks remain in CI.

## Responsibilities

UI/backend: HTTP reads/writes, busy/error states, DTO allowlists, development sessions, server-owned lifecycle and seeded fixtures. Database: no production database decision; persistence scope documented. QA: contract, access/lifecycle and browser acceptance; independent security/release review remains necessary. Infrastructure: local enable flag and CI host verification; no deployment requested.

## Sources

[User contract](../contracts/user.md), [organization contract](../contracts/organization.md), [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md). Founder instructions in this session are the authority for the new scope.

## Comments

C-1 · 2026-10-27 · Codex: Existing API has liveness only. Application authentication and database infrastructure are open; demo endpoints must be explicit and disabled by default.

## Decisions

D-1 · 2026-10-27 · Founder: API CRUD, web reads/updates, lifecycle timestamps and paired API/frontend changes are required going forward.

D-2 · 2026-10-27 · Founder: Reset edits on API restart and use server memory for this iteration.

D-3 · 2026-10-27 · Codex / ASSUMPTION: Demo-only provisioning grants let an existing admin manage newly created empty organizations without changing their single membership; new unassigned accounts have no demo credentials. See [demo API contract](../contracts/api.md); production onboarding/authority remains open.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis |
|---|---|---|---|---|---|
| W-1 | 2026-10-27 | Codex / assistant recorded | Inspect, implement and verify API-backed demo settings | Unknown | Session work; no complete issue duration measured |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-27 · Codex: Created In progress for authorized API implementation.

## Verification and release

Implementation checks passed; see [verification evidence](media/VAC-13/verification.md). Independent privacy/security and release review remain pending. No commit, push, deployment or production-readiness claim.

## Open questions

Production OIDC provider/claims, database hosting, organization provisioning authority, invitation delivery/acceptance, retention/erasure rules and approved experience policies remain open. Single-process server memory/reset-on-restart is confirmed.

## Architecture correction · 2026-10-27

C-2 · 2026-10-27 · Founder: Requested DDD/final structure and user/membership services; rejected parallel demo application folders.

D-4 · 2026-10-27 · Founder direction: [ADR-0003](../adr/0003-domain-and-application-services.md) owns the final layered structure. Typed domain aggregates, application services/repository ports and Infrastructure adapters replace the initial API-local JSON store. Development seed/sign-in remain separately enabled adapters, not a separate application. Earlier pre-refactor test results are historical; validation is repeated for the new structure.

D-5 · 2026-10-27 · Founder: All entities have numeric Id plus immutable Guid; remove InternalId aliases. The later API clarification requires GUIDs for public routes/references, with numeric keys used internally. Username is never an update target. See [ADR-0003](../adr/0003-domain-and-application-services.md#identity-and-use-case-naming--founder-clarifications-2026-10-27).

D-6 · 2026-10-27 · Founder: Name use-case records CreateUser, UpdateUser, etc., without a Command suffix.

D-7 · 2026-10-27 · Founder: Human-readable code, one statement per line, spaces, short comments where needed and one blank line between method declarations. Preserve the founder's concurrent membership edits while formatting and verifying the implementation.

C-3 · 2026-10-27 · Founder: Reported TS5055 input-overwrite diagnostics in app/spec tsconfigs and unresolved checkout@v7 in workflows. Reproduced TS5055 with direct tsc; explicit root/output directories now keep emitted files under ignored out-tsc. Verified every external action tag and action.yml through official GitHub repositories, then pinned the resolved commits. The upstream v7 checkout tag exists; the cause of the editor lookup failure is UNVERIFIED. No hosted workflow run is claimed.

H-2 · 2026-10-27 · Codex: Moved to QA after layered implementation, API/frontend/real-host/browser acceptance and reported configuration fixes passed. Independent review remains outstanding.

C-4 · 2026-10-27 · Founder: Requested reverting action commit hashes in workflow YAML. Restored the existing readable version tags in both workflows; retained the TypeScript configuration fixes and paired API/frontend checks. YAML parsing passed; no hosted workflow was run.

C-5 · 2026-10-27 · Codex: Investigated “Unable to find reusable workflow” on the local ci.yml call. Verified both files are tracked, the target path exists, ci.yml declares workflow_call and skip_backend matches the caller. Official GitHub documentation accepts this same-repository syntax. The installed VS Code GitHub Actions extension is 0.32.3; its local resolver requires registered repository/workspace context. The exact live editor state is UNVERIFIED; no YAML change is justified by these checks. Suggested checking GitHub Actions sign-in/repository-root context and reloading the editor. See https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows and the matching upstream diagnostic report https://github.com/github/vscode-github-actions/issues/254.
