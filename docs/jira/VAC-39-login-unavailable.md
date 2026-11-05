---
id: VAC-39
type: bug
summary: Fix invalid SQL hostname blocking development sign-in
status: released
created: 2026-11-05
updated: 2026-11-05
parent: null
depends_on: []
---

# VAC-39 — Fix invalid SQL hostname blocking development sign-in

![Bug](badges/bug.svg) **🚀 Released** · Owner: Assistant repair; product lead authorized dev release

## Description and reproduction

Product lead reports login is not working. Deployed development site under investigation: `https://lemon-beach-02f7a7103.4.azurestaticapps.net`.

1. Open the sign-in page and select a public fictional persona.
2. Submit its existing development credentials.
3. Expected: establish a server session and enter the authorized workspace, or reject invalid credentials without creating a local session.
4. Observed in HTTP diagnostics: session creation for Maya and Nora each returned no response within 35 seconds. API liveness responds healthy. The exact user-visible symptom/environment was requested and remains unconfirmed.

## Scope

Confirmed repair: remove the duplicate dot from the SQL hostname in Bicep and the existing deployed dev API setting; add a compiled-template regression guard to infrastructure PR/manual validation.

Investigate frontend configuration, session creation/restoration, API/database availability and browser behavior. Preserve tenant authorization, fictional-only sign-in, persisted SQL resources, TLS, free-limit AutoPause and existing scope. No fallback authentication or switch to in-memory persistence. Paid usage, database recreation, migrations, firewall expansion, deployment and destructive operations are not authorized by this bug record.

## Dependencies

None. Related operational context: [VAC-26](VAC-26-azure-sql-resource-persistence.md), [VAC-35](VAC-35-sweden-central-development-relocation.md), [SQL runbook](../database/azure-sql-operations.md). Existing free-tier and data-preservation decisions apply.

## Acceptance scenarios

- [x] Public fictional employee and administrator sign-in complete against the configured API and enter their permitted workspace.
- [x] Restoring/reloading the session works; sign-out revokes the diagnostic session.
- [x] Incorrect credentials and revoked sessions are denied without inventing a local session. Frontend behavior for other dependency outages is unchanged.
- [x] Focused live smoke checks deny foreign organization access and employee administrator-resource access. No application/authorization/private-field implementation changes; broader suites are not rerun.
- [x] Root cause, actual deployed revisions, fixes and verification limits are recorded without session tokens or personal data.

## Subtasks and responsibilities

- Frontend/QA: reproduce sign-in and routing, inspect config and browser network/errors.
- Backend/operations: inspect health, session HTTP responses and SQL availability without changing cost/data/security controls.
- Product: exact affected URL and user-visible symptom requested.
- Database schema and new product features: Not applicable.

## Comments

C1 · 2026-11-05 · Assistant: deployed public config reports frontend revision f955b2a322926b1101e48d1fb528e0529108c207 and the expected Sweden Central API. Liveness reports API assembly version 1.0.0+578a387f0636892a244387ac12972469b40f2421. Different revisions are observed, not assumed to be the cause.

C2 · 2026-11-05 · Assistant: Azure reports SQL status Paused, useFreeLimit=true and freeLimitExhaustionBehavior=AutoPause. Public network access is Enabled with the already authorized DevelopmentOpen rule. Recent allowance metrics returned no numeric samples; this does not establish quota exhaustion. Activity log shows last resume on November 4 and subsequent pause, with no resume recorded during diagnostics. Recent aggregated API exception/error queries returned no rows; absence of telemetry is not proof that requests succeeded.

C3 · 2026-11-05 · Assistant: isolated Chrome reproduced a pending sign-in at 60 seconds. Read-only SQL inspection triggered ordinary resume (40613 → Resuming → Online), but API requests still timed out. Sanitized configuration audit then confirmed the real cause: tcp:vacate-dev-srv..database.windows.net,1433. Database and managed identity matched the expected target; the Bicep suffix concatenation introduced the extra dot.

C4 · 2026-11-05 · Assistant: corrected Bicep, added a compiled-template CI guard, then applied the hostname-only live repair with escalation approval. Employee/admin HTTP sign-in, restoration, initial data, rejection/revocation and a real browser login passed. See [verification](media/VAC-39/verification-2026-11-05.md).

C5 · 2026-11-05 · Assistant: committed/pushed 3ba7661, merged PR #3 after both PR workflows succeeded, and deployed merged b482402 to dev through successful run 42072424616. Independent post-deploy HTTP/browser checks passed and both hosts reported the merged revision. [Release evidence](media/VAC-39/release-2026-11-05.md) distinguishes hosted native CI from focused live browser acceptance.

## Decisions

D1 · 2026-11-05 · Assistant: preserve existing free-tier, SQL data and security controls. Do not enable paid usage or infer that an ordinary Paused status means the monthly allowance is exhausted.

D2 · 2026-11-05 · Assistant: fix the malformed hostname in source and the existing dev API setting, preserving all other connection options. Use normal auto-resume only; no database recreation, firewall/schema/cost change, application deployment or fallback authentication. Record the Paused observation as incidental to the confirmed DNS error, not a proven quota cause.

D3 · 2026-11-05 · Product lead: explicitly authorized committing, pushing, merging and deploying the current branch. Target is the existing dev environment; preserve database data, free-tier controls and deployment checks.

## Work log

W1 · 2026-11-05 · Assistant recorded · Inspect sign-in source/configuration, reproduce deployed session timeouts, read Azure SQL state/metrics/firewall and API diagnostic summaries · Duration: Unknown (not measured); human actual: Unknown. HTTP timeouts measured separately: two 35-second attempts; not assistant/human working time.

W2 · 2026-11-05 · Assistant recorded · Reproduce browser hang, isolate malformed deployed SQL hostname, compile corrected Bicep, add positive/negative regression checks, apply and read back hostname-only repair, verify live sign-in and denials · Duration: Unknown (not measured); human actual: Unknown. HTTP/browser timings are verification measurements only.

W3 · 2026-11-05 · Assistant recorded · Commit/push fix, create and merge PR after successful checks, dispatch full dev deployment, monitor checks/apply/publish/smoke, verify live revision/login/denials and record release · Duration: Unknown (not measured); human actual: Unknown. No workflow duration is treated as assistant/human working time.

## History

H1 · 2026-11-05 · Assistant · Created In progress for the reported sign-in failure and ongoing availability investigation.

H2 · 2026-11-05 · Assistant · QA after source/configuration repair and focused live sign-in smoke passed; independent review, commit/push and hosted execution of the new template guard remain pending.

H3 · 2026-11-05 · Assistant · Released to the named dev target at merged revision b482402 after successful PR/deployment checks and post-deploy sign-in/authorization verification. Product lead authorized the release; independent human QA is not claimed.

## Verification and release

Current outcome: [dev release evidence](media/VAC-39/release-2026-11-05.md). Earlier investigation and QA entries below are historical.

API health responds; two fictional session POST requests timed out. Runtime configuration and read-only Azure state were inspected. Local Python HTTPS trust was insufficient, so diagnostics used system curl with certificate verification retained. No tokens/profile bodies were printed or added to evidence. This describes the initial investigation. The subsequent hostname-only configuration repair is verified in the linked evidence; no application binary or database deployment occurred.

## Open questions

The source fix/guard are merged and deployed; see [release evidence](media/VAC-39/release-2026-11-05.md). Broader timeout/readiness UX and process-local development-session limitations are unchanged. Independent human review/production readiness are not claimed by this dev release.
