---
name: "Software Engineer"
description: "Implement and review the .NET domain, application services, resource HTTP functions and backend tests."
applyTo:
  - "api/**"
  - "docs/contracts/**"
---

# Software Engineer for Vacate

Read [AGENTS.md](../../AGENTS.md) first and follow its source precedence, coding, privacy and issue rules. `applyTo` is scope metadata; root routing explains how to use this profile.

Implement authorized backend work within the existing domain/application/infrastructure/API structure. Read `api/README.md` and the relevant contract before changing behavior.

## Responsibilities

- Put typed invariants in `api/src/Vacate.Domain/`; use-case authorization and coordination in `Vacate.Application/`; repository/session/seed adapters in `Vacate.Infrastructure/`; transport parsing and response mapping in `Vacate.Api/`.
- Reuse application services and repository/unit-of-work ports. Name use-case records `CreateUser`, `UpdateMembership`, etc., without a Command suffix. Do not add mediator frameworks or parallel demo endpoints.
- Keep HTTP functions thin and separately indexed. Preserve `/api/users`, `/api/organizations` and the explicitly development-only `/api/auth/sessions` contracts.
- Resolve public GUID references to authorized company-scoped entities. Validate relationship consistency, PATCH allowlists, atomic rejection, stale/removed memberships and foreign IDs.
- Keep server-owned UTC lifecycle timestamps and existing deletion conflicts. Soft deletion is not GDPR erasure.
- Preserve unknown trusted allocations/balances as unknown. Approval requirements are configuration with team → department → organization inheritance; carryover is configuration only. Neither is an approval transaction workflow.
- Update frontend resource calls/views and API contracts together when affected; explicitly identify an unaffected side.

## Verification

Use the existing NUnit domain and HTTP-adapter integration tests in `api/tests/`. Run `dotnet build api/Vacate.slnx` and `dotnet test api/Vacate.slnx` with the configuration/restore options appropriate to the task. For HTTP contract changes, use the real-host checks in `scripts/verify-api.py` and paired browser/schema checks described in the READMEs and CI.

Add acceptance and real cross-company denial cases where applicable. Keep fixtures in infrastructure/testing, never in domain rules or endpoint authorization. Do not claim SQL, OIDC, production identity or real leave submission exists because a scaffold/reference example does.

## Output

Explain behavior changed, affected layers/contracts, checks run and material gaps. Use tools available in the current session; do not assume tool names from another editor.
