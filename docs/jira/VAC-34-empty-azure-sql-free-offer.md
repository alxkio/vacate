---
id: VAC-34
type: task
summary: Provision an empty zero-cost Azure SQL free-offer database in dev
status: done
created: 2026-11-01
updated: 2026-11-01
parent: null
depends_on: []
---

# VAC-34 — Provision an empty zero-cost Azure SQL free-offer database in dev

![Task](badges/task.svg) **✅ Done** · Owner: Unassigned

## Description

Provision one empty Azure SQL free-offer database and its logical server in the existing development target, only after verifying zero initial and recurring incremental charges. User explicitly authorized this narrow split from VAC-26 on 2026-11-01, subject to cost/security/eligibility checks; no trial-credit, reimbursement or paid fallback is permitted.

## Scope

Repository-native standalone [Bicep entry point](../../infra/deployments/sql.bicep) and [SQL module](../../infra/modules/sql-free.bicep), [cost-control verifier](../../scripts/verify-sql-free-template.py), [runbook](../database/azure-sql-operations.md), eligibility/region/quota checks, lint/compile/generated ARM verification, validation/what-if, conditional apply and actual-property readback. Use the existing subscription/resource group in [infra/targets/dev.json](../../infra/targets/dev.json), with separately authorized SQL-only `sqlLocation: swedencentral`; leave its resource-group/application location in West Europe. Requested resource names: logical server `vacate-dev-srv`, database `vacate-dev-db`. No app deployments, EF/schema/migrations, persistence adapters, existing-service changes, paid dependencies, policy calculations, personal-data import or invitations.

Cost controls are literal: General Purpose serverless, useFreeLimit=true and freeLimitExhaustionBehavior=AutoPause. Limit data to free allowance, local short-term backups within offer, no LTR; no billing beyond allowance, automatic upgrades, private endpoints, paid monitoring/Defender, replicas, VMs or SQL Managed Instance. Entra-only authentication, TLS and disabled public access; no credentials or broad firewall rules. Accept monthly-exhaustion downtime.

## Dependencies

None. Empty infrastructure does not need schema implementation, VAC-22–VAC-25 completion or VAC-26 adapters. All required target information is already versioned. Eligibility/zero-cost regional availability are operational gates within this task, not schema dependencies.

Related: [VAC-26](VAC-26-azure-sql-resource-persistence.md) retains repository/EF persistence and all application/schema/connection work; it consumes this task's verified empty target after ADR/schema gates are resolved.

## Acceptance scenarios

- [x] Resolve actual subscription/group/location and existing Entra administrator without guessed identities; inspect subscription eligibility/free quota/regional capabilities.
- [x] Compile/lint standalone Bicep; verify generated ARM free-limit/AutoPause and SQL-only allowlist; inspect all resources/features for cost exposure.
- [x] Run target-specific ARM validation and what-if; unrelated resources are not changed.
- [x] If any zero-cost prerequisite fails, stop before deployment, retain reviewable implementation and identify the exact blocker.
- [x] After all eligibility/cost gates pass, deploy only empty SQL resources in the existing target, then read actual free-limit/AutoPause/storage/security properties and record deployed IDs.
- [x] Resolve the subsequent requested UTF/case-insensitive collation, verify the approved recreation and zero-cost creation/readback for that final choice. Actual Latin1_General_100_CI_AS_SC_UTF8 verified after approved zero-cost recreation.
- [x] Document monthly allowance, pause behavior and remaining application work. Tenant business-data tests are not applicable: no schema or application data path is created; network/auth restrictions and SQL-only change isolation are reviewed instead.

## Subtasks and responsibilities

Infrastructure: Bicep, current-subscription checks, cost/security controls and conditional deployment/readback. QA: compiled ARM guard and what-if resource inventory. Backend/database: no application/schema implementation. UI/UX: Not applicable. Product/policy: no new decisions or legal calculations.

## Attachments and sources

- [Initial West Europe evidence](media/VAC-34/verification-2026-11-01.md).
- [Current Sweden Central evidence](media/VAC-34/verification-sweden-central-2026-11-01.md) and [final actual readback](media/VAC-34/sweden-central-utf8-readback.json): local lint/build/cost guards, fresh subscription quota/capability/name checks, validation/what-if and actual deployment verification passed. The initial disabled-LTR API issue and later approved collation recreation are recorded transparently. Final deployment vacate-dev-sql-utf8-20261101 Succeeded in subscription07d79495-1f4f-40fd-9fdf-84605214e5e6, group rg-vacate-dev, SQL region Sweden Central. Full deployed IDs are in linked evidence; name server vacate-dev-srv, database vacate-dev-db. No SQL data-plane multilingual tests, schema, app principal/integration, invitations, commit/push/merge or independent production approval claimed.

## Open questions and follow-up

No blocking infrastructure question remains for this task. User's Greek/Nordic UTF-8, case-insensitive, accent-sensitive choice is applied and verified. Actual idle pause is60minutes versus guide15; monthly exhaustion AutoPause is verified and no paid fallback allowed. App managed-identity database principal/permissions, secure network route, EF/schema/migrations and API integration remain VAC-26. No SQL-password app user or app connection setting was created. Policy/onboarding/retention and proposed runtime ADR acceptance remain their existing future gates; do not infer readiness from an empty SQL database.
