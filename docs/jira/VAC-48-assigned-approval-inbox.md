---
id: VAC-48
type: story
summary: Decide leave requests assigned to the signed-in administrator
status: qa
created: 2026-11-12
updated: 2026-11-13
parent: VAC-43
depends_on: [VAC-31]
---

# VAC-48 — Decide leave requests assigned to the signed-in administrator

![Story](badges/story.svg) **🔍 QA** · Owner: Delegated implementation roles

## Description

As an administrator, I have an inbox of requests explicitly assigned to me and can approve or decline those requests. The owner selected assigned approvers rather than all admins sharing authority over every pending request.

## Scope

Actual saved requests, explicit company-scoped assignment and server-authorized decisions. Administrators configure team, department and organization approvers; resolution follows team → department → organization. Eligible assignees are company administrators only. An explicitly assigned administrator may approve their own request. Configuration changes reroute all pending requests, including legacy pending; completed decision history remains unchanged. Preserve inherited approval-required settings, past-date bypass only for past dates, pending non-deduction and no self-inferred assignments from job title/manager/fixture data. Show request dates/working quantities and relevant balance effects; do not expose family/eligibility inputs, medical notes or unrelated personnel details. Earlier VAC-4 mock is related background, not a prerequisite or authorization to use fictional rows.

## Dependencies

[VAC-31](VAC-31-leave-request-accounting-transactions.md) supplies persisted request/date accounting, overlap handling and annual/type balance evaluation. Verify this existing output; its broader unfinished lifecycle is not accepted by dependency alone.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [x] Given administrator-configured team/department/organization approvers, when submitting a request requiring approval, then assignment follows team → department → organization without deriving authority from a job title.
- [x] Given an explicitly assigned approver whose own request is pending, when they approve it, then self-approval is permitted subject to the same server balance/accounting checks.
- [x] Given an administrator changing valid approver configuration, when the change is saved, then all pending requests, including legacy pending, use current effective team → department → organization assignment and move between inboxes accordingly; completed decisions and their history remain unchanged.
- [ ] Given the signed-in assigned approver, when opening the inbox, then only their actionable pending requests appear with request/person/date context; empty/loading/error/retry states are clear.
- [x] Given an assigned approver and valid decision, when confirming approve/decline, then server-owned decision timestamp/status and accounting persist once atomically and the UI refreshes after server success.
- [x] Given approval that would cause negative balance or unknown required entitlement, when confirming, then the server rejects the decision safely with useful recovery and leaves the request pending.
- [x] Given missing valid approver configuration, when previewing/submitting new approval-required future leave, then actionable configuration feedback blocks the affected submission; a past-only request retains its accepted bypass. Existing pending requests follow current effective assignment without inventing fallback authority.
- [x] Given an employee assignee or foreign-company reference, when an admin saves approver configuration, then the server rejects the invalid/non-admin assignment.
- [x] Given another unassigned admin, employee, foreign-company actor or stale assignment, when deciding or guessing a request GUID, then the server denies authority and reveals no foreign/private data.
- [x] Given a mixed past/future request, when deciding, then only approval-required pending dates are changed and already-approved past dates remain unchanged.
- [x] Given retries or simultaneous decisions, when completing an action, then accounting is not duplicated and stale decisions report conflict or existing result truthfully.


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

AdminLeaveTests cover team/department/organization resolution, company-admin-only assignment, assigned self-approval, legacy/new pending rerouting, completed-history preservation, mixed-date decisions, revoked assignment, negative-balance rejection and InMemory concurrency. Existing HTTP acceptance passed. Final inbox mobile/rendered rerun and strengthened HTTP assertions remain pending in the shared report; live SQL concurrency/grants and native keyboard behavior are unverified.

[Shared verification report](media/VAC-43/verification.md) owns final command results, screenshots, revisions and limitations; shared automation is not counted separately for each child. Source/test inspection is not a deployed or actual-SQL result. Outstanding gates: native keyboard QA, SQL-provider runtime grants/concurrency and execution of the actual forward migration. No commit, push or deployment; this issue is QA, not Done or Released.

## Open questions and follow-up

Resolved by owner follow-up: administrators configure approvers at team/department/organization scopes, resolving team → department → organization. Assigned self-approval is allowed. Resolved by owner final reply: configuration changes reroute all pending requests using current effective team → department → organization configuration, including legacy pending; completed decisions/history remain intact. OPEN QUESTION: missing/absent/deleted approver fallback; rejection reason requirement and visibility. Block only affected paths; do not broaden company-wide decision authority.


### Final verification update · 2026-11-13

Assistant / QA coordination: final admin browser journeys pass at 1440/375/320px, 85 Angular tests pass, 62 integration checks pass with 20 SQL-provider skips, 10 unit tests pass, strengthened migration/model check passes, and strengthened real HTTP acceptance passes. The existing isolated trusted native calendar/picker/avatar suite also passes locally, including the reported historical-date regression. Earlier statements that the final browser rerun or all native input were unverified are superseded by this evidence. New admin-specific native keyboard/assistive-technology checks and real SQL/grant/migration execution remain open; QA status is retained. Independent Product Designer and QA Engineer reviews completed. See the [shared report](media/VAC-43/verification.md) for exact scope, screenshots, remaining gates and product questions. No commit, push, deployment or database application.
