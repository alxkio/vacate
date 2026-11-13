---
id: VAC-49
type: story
summary: Review company personnel and recorded leave in People
status: qa
created: 2026-11-12
updated: 2026-11-13
parent: VAC-43
depends_on: [VAC-31]
---

# VAC-49 — Review company personnel and recorded leave in People

![Story](badges/story.svg) **🔍 QA** · Owner: Delegated implementation roles

## Description

As an administrator, I can review personnel and the leave they have taken, preferably by extending People so the directory and personnel oversight remain discoverable. Existing employee directory and annual balance summary behavior is retained.

## Scope

Company-admin-only reporting over actual saved leave and derived accounting, with person/year/team/department context as justified by the data. Reuse People as the entry where feasible and distinguish directory access from admin personnel details. Existing annual balance summary is VAC-20 context; no duplicated parallel balance engine, fictional absence reconstruction, export or employee access to colleagues' private leave is authorized.

## Dependencies

[VAC-31](VAC-31-leave-request-accounting-transactions.md) supplies persisted request/date accounting, overlap handling and annual/type balance evaluation. Verify this existing output; its broader unfinished lifecycle is not accepted by dependency alone.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [x] Given a company administrator and actual saved leave, when opening personnel oversight from People, then people and recorded dated leave/used totals are associated clearly with the selected period and scope.
- [x] Given pending/rejected/cancelled records, when reporting leave taken, then these states are distinguished from approved consumption instead of summed as taken days.
- [x] Given legacy opening totals without dated records or unresolved entitlements, when viewing a person, then unknown/history gaps are explicit rather than invented dated events or zero balances.
- [ ] Given filters and navigation to person/period details, when changing scope, then loading/empty/error/retry behavior and desktop/mobile tables remain usable and accessible.
- [x] Given an employee, delegated settings lead or foreign-company actor, when requesting admin personnel detail directly, then the server denies unauthorized leave disclosure while the existing sanitized directory remains available.
- [x] Given sign-out/account changes or stale asynchronous responses, when loading personnel, then prior-company/person details are cleared and never rendered for the new actor.


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

## Work log

- W1 · 2026-11-12 · Assistant recorded: issue/specification and delegated implementation coordination; duration unmeasured. Human actual: Unknown. No child/parallel time roll-up.

- W2 · 2026-11-13 · Assistant recorded / Product Owner: consolidated implementation status, evidence boundaries and outstanding gates; duration unmeasured. Human actual: Unknown. Shared test measurements belong to the epic verification report and are not summed into child time.

## History

- H1 · 2026-11-12 · Assistant / Product Owner: Created In progress after owner explicitly requested delegated implementation. Open decisions constrain specific mutations and are not evidence of completed functionality.

- H3 · 2026-11-13 · Assistant / Product Owner: In progress → QA after delegated implementation and focused automated/build evidence. Full rerun/rendered evidence remains consolidated in the linked report; native keyboard and actual-SQL gates remain open.

## Verification and release

Focused/API checks cover personnel privacy/foreign-company denial, opening-history and unresolved-balance distinctions, recorded dates/statuses and stale-year/actor response rejection. Existing HTTP acceptance passed; full final personnel desktop/mobile/flow evidence remains tracked in the shared report. No attendance or fictional dated history is inferred; SQL-provider execution and native keyboard operation remain unverified.

[Shared verification report](media/VAC-43/verification.md) owns final command results, screenshots, revisions and limitations; shared automation is not counted separately for each child. Source/test inspection is not a deployed or actual-SQL result. Outstanding gates: native keyboard QA, SQL-provider runtime grants/concurrency and execution of the actual forward migration. No commit, push or deployment; this issue is QA, not Done or Released.

## Open questions and follow-up

Exact report columns and the most useful period/filter defaults may be refined by design using implemented data; do not infer attendance/presence from absence of leave. Medical evidence, private profile facts and request notes are excluded.


### Final verification update · 2026-11-13

Assistant / QA coordination: final admin browser journeys pass at 1440/375/320px, 85 Angular tests pass, 62 integration checks pass with 20 SQL-provider skips, 10 unit tests pass, strengthened migration/model check passes, and strengthened real HTTP acceptance passes. The existing isolated trusted native calendar/picker/avatar suite also passes locally, including the reported historical-date regression. Earlier statements that the final browser rerun or all native input were unverified are superseded by this evidence. New admin-specific native keyboard/assistive-technology checks and real SQL/grant/migration execution remain open; QA status is retained. Independent Product Designer and QA Engineer reviews completed. See the [shared report](media/VAC-43/verification.md) for exact scope, screenshots, remaining gates and product questions. No commit, push, deployment or database application.
