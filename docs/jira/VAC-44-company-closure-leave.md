---
id: VAC-44
type: story
summary: Record company closures with automatic leave and configurable balance impact
status: qa
created: 2026-11-12
updated: 2026-11-13
parent: VAC-43
depends_on: [VAC-31]
---

# VAC-44 — Record company closures with automatic leave and configurable balance impact

![Story](badges/story.svg) **🔍 QA** · Owner: Delegated implementation roles

## Description

As a company administrator, I can configure closed dates and choose whether closure leave deducts employee leave balances. The owner selected automatic recording of closure leave rather than requiring each employee to submit a request.

## Scope

Company-owned closure dates and an explicit balance-impact setting; a reviewable affected-person/date/charge result before applying automatic records; integration with server-owned request/date accounting. Non-deducting closures must not charge entitlement. Respect applicable schedules, holidays and already-covered dates. Do not infer that automatic closure leave follows employee approval or bypasses unconfirmed closure-specific rules. Deducting closures use annual leave. Insufficient-balance employees are skipped with a visible report; no debt is permitted. Applicability population and update/cancel effects must be explicit before those specific mutations ship.

## Dependencies

[VAC-31](VAC-31-leave-request-accounting-transactions.md) supplies persisted request/date accounting, overlap handling and annual/type balance evaluation. Verify this existing output; its broader unfinished lifecycle is not accepted by dependency alone.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [x] Given authorized company administration and valid closure dates, when reviewing a closure, then the UI distinguishes affected employees/dates, existing overlaps and balance impact before an application attempt.
- [x] Given a balance-affecting closure, when applying it, then automatic annual-leave records carry closure provenance and explicit entitlement-year charges; no employee submission is required.
- [x] Given a non-deducting closure, when affected records are created, then remaining balances are unchanged and the closure is visibly distinguished from ordinary personal leave.
- [x] Given overlaps, non-working dates or holidays, when calculating effects, then no existing leave type/status is rewritten or duplicate date/deduction created.
- [x] Given an employee whose annual balance cannot cover the closure, when applying the closure, then that employee is skipped and explicitly reported while eligible employees are processed without negative balances.
- [x] Given retry or concurrent application, when applying the same closure, then records/charges are created at most once and failures cannot silently partially apply contrary to the accepted publishing policy.
- [x] Given an ordinary employee or foreign-company actor/reference, when managing closures, then the server denies mutation without data leakage.
- [ ] Given later closure/calendar edits, when reading previously recorded leave, then history remains intact pending an explicit correction/cancellation decision.


Checked items reflect the automated/local evidence described below, including InMemory authorization/accounting checks. They do not certify native SQL-provider behavior, physical-device or trusted keyboard operation. Broad rendered/manual criteria remain unchecked where final evidence is pending.

## Subtasks and responsibilities

Product Owner records accepted decisions and outstanding questions. Product Designer maps multi-page journeys and rendered states. Frontend Engineer owns capability views/data access; Software Engineer owns typed use cases, server authorization and contracts. QA evidence covers focused tests, API/tenant checks and desktop/mobile rendered results. Database work is applicable only where persisted domain configuration/transactions change; infrastructure provisioning is not requested.

## Attachments and sources

- [Shared implementation verification, file manifest and screenshots](media/VAC-43/verification.md).

- [Product charter — administrator epic](../product/product-charter.md#owner-decisions--administrator-functionality--2026-11-12).
- [ADR-0003](../adr/0003-domain-and-application-services.md), [ADR-0004](../adr/0004-relational-persistence.md), [ADR-0005](../adr/0005-frontend-capability-architecture.md).
- [Epic VAC-43](VAC-43-admin-functionality.md); [issue workflow](README.md).

## Comments

- C1 · 2026-11-12 · Assistant / Product Owner: Owner requested delegated implementation of the six-area administrator epic. Policy-dependent operations remain explicitly bounded by unresolved decisions; independent work continues.

## Decisions

- D1 · 2026-11-12 · Owner: automatic closure leave; recurring holidays apply to the whole company initially; approval inbox uses assigned approvers. Canonical source: linked product charter. No commit, push or deployment is authorized for this work.

- D2 · 2026-11-12 · Owner follow-up: Annual leave funds deducting closures; skip insufficient-balance employees and report them. Administrators configure approvers by team/department/organization, with team → department → organization inheritance; assigned self-approval is allowed. February 29 applies in leap years only. This resolves the corresponding original questions without changing unrelated lifecycle or privacy rules. Canonical source: linked product charter.

## Work log

- W1 · 2026-11-12 · Assistant recorded: issue/specification and delegated implementation coordination; duration unmeasured. Human actual: Unknown. No child/parallel time roll-up.

- W2 · 2026-11-13 · Assistant recorded / Product Owner: consolidated implementation status, evidence boundaries and outstanding gates; duration unmeasured. Human actual: Unknown. Shared test measurements belong to the epic verification report and are not summed into child time.

## History

- H1 · 2026-11-12 · Assistant / Product Owner: Created In progress after owner explicitly requested delegated implementation. Open decisions constrain specific mutations and are not evidence of completed functionality.

- H2 · 2026-11-12 · Assistant / Product Owner: Incorporated explicit follow-up answers; original D1/H1 retained. Remaining policy questions constrain only their affected operations. No runtime completion claimed.

- H3 · 2026-11-13 · Assistant / Product Owner: In progress → QA after delegated implementation and focused automated/build evidence. Full rerun/rendered evidence remains consolidated in the linked report; native keyboard and actual-SQL gates remain open.

## Verification and release

Automatic annual/non-deducting closure recording, skipped-employee reporting, balances, provenance, overlap preservation and InMemory retry/concurrency behavior are covered by AdminLeaveTests; existing HTTP acceptance passed. Native SQL locking/transaction/grant behavior is not established by these checks. Final strengthened HTTP/browser replay is pending in the shared evidence report.

[Shared verification report](media/VAC-43/verification.md) owns final command results, screenshots, revisions and limitations; shared automation is not counted separately for each child. Source/test inspection is not a deployed or actual-SQL result. Outstanding gates: native keyboard QA, SQL-provider runtime grants/concurrency and execution of the actual forward migration. No commit, push or deployment; this issue is QA, not Done or Released.

## Open questions and follow-up

Resolved by owner follow-up: deducting closures charge annual leave; insufficient-balance employees are skipped with an explicit report. OPEN QUESTION: employee population/employment-date boundaries; effective dates, editing/removing applied closures and correction history; informational configuration versus publication; unresolved-entitlement handling. Negative balances remain prohibited. Existing records must not be silently rewritten.


### Final verification update · 2026-11-13

Assistant / QA coordination: final admin browser journeys pass at 1440/375/320px, 85 Angular tests pass, 62 integration checks pass with 20 SQL-provider skips, 10 unit tests pass, strengthened migration/model check passes, and strengthened real HTTP acceptance passes. The existing isolated trusted native calendar/picker/avatar suite also passes locally, including the reported historical-date regression. Earlier statements that the final browser rerun or all native input were unverified are superseded by this evidence. New admin-specific native keyboard/assistive-technology checks and real SQL/grant/migration execution remain open; QA status is retained. Independent Product Designer and QA Engineer reviews completed. See the [shared report](media/VAC-43/verification.md) for exact scope, screenshots, remaining gates and product questions. No commit, push, deployment or database application.
