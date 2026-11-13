---
id: VAC-43
type: epic
summary: Deliver company calendars, assigned approvals and personnel oversight
status: qa
created: 2026-11-12
updated: 2026-11-13
parent: null
depends_on: []
---

# VAC-43 — Deliver company calendars, assigned approvals and personnel oversight

![Epic](badges/epic.svg) **🔍 QA** · Owner: Delegated implementation roles

## Description

An administrator manages company-specific non-working dates, reviews assigned leave decisions and understands personnel leave through a coherent administration experience. The owner explicitly authorized Product Owner, Product Designer, Frontend Engineer and Software Engineer delegation on 2026-11-12.

Children:
- [VAC-44](VAC-44-company-closure-leave.md): Record company closures with automatic leave and configurable balance impact.
- [VAC-45](VAC-45-recurring-company-holidays.md): Configure fixed-date recurring holidays for the whole company.
- [VAC-46](VAC-46-admin-settings-design.md): Refine administrator settings for company calendar and personnel tasks.
- [VAC-47](VAC-47-ux-ui-workflow-evaluation.md): Evaluate UX/UI prompts and skills for administrator journeys.
- [VAC-48](VAC-48-assigned-approval-inbox.md): Decide leave requests assigned to the signed-in administrator.
- [VAC-49](VAC-49-personnel-leave-overview.md): Review company personnel and recorded leave in People.


## Scope

Deliver the six requested areas through the linked children. Preserve accepted balance, overlap, approval-required inheritance, past-date and privacy behavior. This epic does not authorize statutory holiday defaults, payroll, broader identity, arbitrary personnel surveillance, notifications, production deployment or a UI-library change.

Previous owner UI feedback stays in VAC-42. VAC-3 is an older availability overview proposal; VAC-4 an earlier fictional inbox proposal; VAC-20 owns existing annual-balance summaries; VAC-40 owns national holiday import. They are coordination context, not duplicate implementation scope.

## Dependencies

None. Children own their own direct prerequisites.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [x] Given the accepted company calendar configuration, when an administrator saves valid company dates, then subsequent leave calculations use them and saved history remains unchanged.
- [x] Given a configured assigned approver, when they decide pending leave, then authorization, statuses and balance accounting are correct once, including retries.
- [x] Given a company administrator, when reviewing personnel, then actual recorded leave is distinguished from fictional availability and unknown balances.
- [x] Given employees or another company's actor, when calling administration endpoints or direct routes, then administration and private personnel data remain denied.
- [ ] Each child's acceptance and appropriate frontend/API/SQL/rendered checks are linked before the epic moves to Done.


Checked items reflect the automated/local evidence described below, including InMemory authorization/accounting checks. They do not certify native SQL-provider behavior, physical-device or trusted keyboard operation. Broad rendered/manual criteria remain unchecked where final evidence is pending.

## Subtasks and responsibilities

Children record their own work and evidence. Do not sum overlapping agent time or child logs into this epic.

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

- D3 · 2026-11-12 · Owner follow-up: Assigned approvers must be company administrators. Missing valid configuration blocks new approval-required future requests with actionable setup feedback; past-only bypass remains. Existing legacy pending records are preserved while the rerouting question is pending. This recovery boundary creates no orphan assignment or fallback approval authority.

- D4 · 2026-11-12 · Owner final reply: Approver setting changes reroute all pending requests, including legacy pending, using current effective team → department → organization configuration. Preserve approved/declined decisions and completed history. This supersedes D3’s temporary preservation boundary for unresolved pending routing only.

## Work log

- W1 · 2026-11-12 · Assistant recorded: issue/specification and delegated implementation coordination; duration unmeasured. Human actual: Unknown. No child/parallel time roll-up.

- W2 · 2026-11-13 · Assistant recorded / Product Owner: consolidated implementation status, evidence boundaries and outstanding gates; duration unmeasured. Human actual: Unknown. Shared test measurements belong to the epic verification report and are not summed into child time.

## History

- H1 · 2026-11-12 · Assistant / Product Owner: Created In progress after owner explicitly requested delegated implementation. Open decisions constrain specific mutations and are not evidence of completed functionality.

- H2 · 2026-11-12 · Assistant / Product Owner: Incorporated explicit follow-up answers; original D1/H1 retained. Remaining policy questions constrain only their affected operations. No runtime completion claimed.

- H3 · 2026-11-13 · Assistant / Product Owner: In progress → QA after delegated implementation and focused automated/build evidence. Full rerun/rendered evidence remains consolidated in the linked report; native keyboard and actual-SQL gates remain open.

## Verification and release

Implemented across frontend, API/application/domain and SQL migration artifacts. Shared automated evidence includes 62 passing API integration/offline cases with 20 SQL-provider cases skipped, 10 unit tests, 28 focused checks and a strengthened offline migration/model test. Production API/frontend builds pass. Earlier real-HTTP administrator acceptance passed; final strengthened HTTP/browser and Angular reruns are tracked in the evidence report. The epic remains QA until the outstanding gates and review are resolved.

[Shared verification report](media/VAC-43/verification.md) owns final command results, screenshots, revisions and limitations; shared automation is not counted separately for each child. Source/test inspection is not a deployed or actual-SQL result. Outstanding gates: native keyboard QA, SQL-provider runtime grants/concurrency and execution of the actual forward migration. No commit, push or deployment; this issue is QA, not Done or Released.

## Open questions and follow-up

Resolved by owner follow-up: deducting closures charge annual leave; insufficient-balance employees are skipped with an explicit report; administrators configure assigned approvers at team/department/organization with team → department → organization inheritance; assigned self-approval is allowed; February 29 recurs in leap years only. OPEN QUESTION: missing/absent/deleted approver fallback and closure correction/effective-date lifecycle. Continue independent work; do not infer permission or history-rewrite rules.


### Final verification update · 2026-11-13

Assistant / QA coordination: final admin browser journeys pass at 1440/375/320px, 85 Angular tests pass, 62 integration checks pass with 20 SQL-provider skips, 10 unit tests pass, strengthened migration/model check passes, and strengthened real HTTP acceptance passes. The existing isolated trusted native calendar/picker/avatar suite also passes locally, including the reported historical-date regression. Earlier statements that the final browser rerun or all native input were unverified are superseded by this evidence. New admin-specific native keyboard/assistive-technology checks and real SQL/grant/migration execution remain open; QA status is retained. Independent Product Designer and QA Engineer reviews completed. See the [shared report](media/VAC-43/verification.md) for exact scope, screenshots, remaining gates and product questions. No commit, push, deployment or database application.


### Publication authorization · 2026-11-13

Owner explicitly requested commit, push and PR creation after implementation review. Assistant prepared branch `VAC-43-admin-functionality` targeting `master`, including the existing unmerged owner UI-feedback commit `8cc5496` and the verified administrator changes. This supersedes earlier no-commit/no-push statements for these actions only; QA status and SQL/admin-accessibility gates remain unchanged. No merge, deployment or database application is part of this publication step. Assistant publication work duration: unmeasured. Human actual: Unknown.
