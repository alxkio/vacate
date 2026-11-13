---
id: VAC-46
type: task
summary: Refine administrator settings for company calendar and personnel tasks
status: qa
created: 2026-11-12
updated: 2026-11-13
parent: VAC-43
depends_on: []
---

# VAC-46 — Refine administrator settings for company calendar and personnel tasks

![Task](badges/task.svg) **🔍 QA** · Owner: Delegated implementation roles

## Description

Improve the administrator Settings layout around company workspace, organization policy, company calendar and structure tasks while preserving Vacate's established visual identity and accepted behavior.

## Scope

Incremental design and implementation for the new administration tasks. Reuse VAC-42's workspace/at-a-glance → configuration → structure order, accessible switches and creation dialogs. Incorporate approved new calendar controls through deliberate feature panels. Do not repeat completed VAC-42 feedback, restructure employee permissions or install a UI library.

## Dependencies

None. Existing administration, directory and configuration APIs are the implementation baseline.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [x] Given an administrator on desktop/mobile, when opening Settings, then company context, policy/calendar controls and organizational structure have clear headings and understandable destinations.
- [ ] Given keyboard navigation, when using sections/forms/dialogs, then labels, focus visibility, error association and dialog focus return work.
- [ ] Given loading, denied, empty, error and success states, when administration data changes, then drafts and recovery remain understandable and server saves are not implied before success.
- [x] Given a non-admin or delegated lead, when visiting Settings or direct URLs, then existing permitted sections remain unchanged and new admin-only actions remain denied.
- [ ] Before/after rendered desktop/mobile checks distinguish implemented controls from unavailable policy-dependent actions.


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

Implementation is ready for review. Rendered settings checks passed at 1440/375/320px; source and focused component checks cover labels, validation, inherited choices, actor response isolation and save recovery. An approval-inbox overflow found during QA was corrected; final browser rerun remains pending in the shared report. Native keyboard operation is not verified, so the keyboard acceptance item remains unchecked.

[Shared verification report](media/VAC-43/verification.md) owns final command results, screenshots, revisions and limitations; shared automation is not counted separately for each child. Source/test inspection is not a deployed or actual-SQL result. Outstanding gates: native keyboard QA, SQL-provider runtime grants/concurrency and execution of the actual forward migration. No commit, push or deployment; this issue is QA, not Done or Released.

## Open questions and follow-up

No independent policy decision is authorized by visual design. Pending closure/approval policy can block its own controls while other settings improvements continue.


### Final verification update · 2026-11-13

Assistant / QA coordination: final admin browser journeys pass at 1440/375/320px, 85 Angular tests pass, 62 integration checks pass with 20 SQL-provider skips, 10 unit tests pass, strengthened migration/model check passes, and strengthened real HTTP acceptance passes. The existing isolated trusted native calendar/picker/avatar suite also passes locally, including the reported historical-date regression. Earlier statements that the final browser rerun or all native input were unverified are superseded by this evidence. New admin-specific native keyboard/assistive-technology checks and real SQL/grant/migration execution remain open; QA status is retained. Independent Product Designer and QA Engineer reviews completed. See the [shared report](media/VAC-43/verification.md) for exact scope, screenshots, remaining gates and product questions. No commit, push, deployment or database application.
