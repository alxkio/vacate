---
id: VAC-45
type: story
summary: Configure fixed-date recurring holidays for the whole company
status: qa
created: 2026-11-12
updated: 2026-11-13
parent: VAC-43
depends_on: []
---

# VAC-45 — Configure fixed-date recurring holidays for the whole company

![Story](badges/story.svg) **🔍 QA** · Owner: Delegated implementation roles

## Description

As a company administrator, I can add named fixed month/day holidays that recur yearly for the whole company. Regional variation motivates configurable company policy rather than inferred regional statutory defaults.

## Scope

Company-scoped, named fixed-date annual recurrence plus calendar/working-date integration. Apply to the whole company initially; no per-employee work-location matrix, movable religious-date calculation or modification of imported national holiday records. The owner's city/date examples are unverified illustrative inputs, not legal sources or seeded defaults. February 29 occurs only in leap years, with no substitute holiday in other years.

## Dependencies

None. Existing administration, directory and configuration APIs are the implementation baseline.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [ ] Given a company admin and a valid supported month/day and name, when saving a recurring holiday, then it persists as company configuration and appears in the company calendar in successive applicable years.
- [x] Given the company's new holiday and a fresh leave calculation, when selecting that date, then it is excluded from chargeable working dates with an understandable reason.
- [ ] Given imported national holidays and recurring company holidays sharing a date, when calculating leave, then the date is excluded once without duplicating leave or changing national reference data.
- [x] Given a February 29 recurrence, when viewing/calculating a leap year, then it applies on February 29; in other years no substitute date is created.
- [x] Given invalid dates, blank names or conflicting input, when saving, then field feedback preserves the draft and the server rejects invalid data.
- [x] Given an employee or foreign-company actor/reference, when attempting holiday administration, then mutation is denied and foreign configuration is not disclosed.
- [x] Given later company holiday changes, when reading already-saved leave, then saved dates/charges are not automatically rewritten.
- [x] Given missing public holiday coverage, when calculating leave, then accepted fallback remains truthful while configured company holidays are still honored.


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

AdminLeaveTests cover invalid/duplicate month-day validation, company authorization, leap-only recurrence, exclusion from new working-date calculations and preservation of saved history. Existing HTTP acceptance covers company-holiday exclusion and server lifecycle. Calendar screenshot and final rendered checks are tracked in the shared report; overlap with imported national holidays and native SQL execution are not independently certified here.

[Shared verification report](media/VAC-43/verification.md) owns final command results, screenshots, revisions and limitations; shared automation is not counted separately for each child. Source/test inspection is not a deployed or actual-SQL result. Outstanding gates: native keyboard QA, SQL-provider runtime grants/concurrency and execution of the actual forward migration. No commit, push or deployment; this issue is QA, not Done or Released.

## Open questions and follow-up

Resolved by owner follow-up: February 29 applies in leap years only; no substitute date in non-leap years. OPEN QUESTION: weekend observance, effective-year limits and historical change/correction operations. These are excluded until decided. Custom company settings do not certify statutory holiday applicability.


### Final verification update · 2026-11-13

Assistant / QA coordination: final admin browser journeys pass at 1440/375/320px, 85 Angular tests pass, 62 integration checks pass with 20 SQL-provider skips, 10 unit tests pass, strengthened migration/model check passes, and strengthened real HTTP acceptance passes. The existing isolated trusted native calendar/picker/avatar suite also passes locally, including the reported historical-date regression. Earlier statements that the final browser rerun or all native input were unverified are superseded by this evidence. New admin-specific native keyboard/assistive-technology checks and real SQL/grant/migration execution remain open; QA status is retained. Independent Product Designer and QA Engineer reviews completed. See the [shared report](media/VAC-43/verification.md) for exact scope, screenshots, remaining gates and product questions. No commit, push, deployment or database application.
