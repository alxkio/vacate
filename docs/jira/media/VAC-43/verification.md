# VAC-43 implementation and verification

Date: 2026-11-13. Baseline commit: `8cc5496458bf3b4bb6aa8a8f544998df2898345f`. Verification ran before publication on `VAC-42-release-evidence`; the working tree was clean at the start of this epic. No deployment or database application was performed. The owner subsequently authorized commit, push and PR creation; publication uses `VAC-43-admin-functionality` against `master`. This does not change the QA status or outstanding verification gates.

## Outcome and product baseline

Implemented the accepted administrator epic from the [charter](../../../product/product-charter.md#owner-decisions--administrator-functionality--2026-11-12), preserving accepted request/accounting rules and Vacate's established visual identity. [Design handoff](../../../design/admin-functionality-handoff.md) records journeys, review workflows, states and independent visual review. VAC-42 retains its earlier owner feedback and the reported CI regression as subtasks.

Company closures automatically record approved leave. Deducting closures charge annual leave; employees without sufficient or known balance are skipped and reported. Non-deducting closures carry explicit provenance and leave balances unchanged. Company holidays recur on fixed month/day, including leap-years-only February 29. No regional legal holiday defaults were inferred from user examples.

Company-admin approvers inherit team → department → organization. Configuration changes reroute pending requests; decisions also verify current effective routing and active admin eligibility. Assigned self-approval is permitted. Completed decisions remain unchanged. Personnel reports use saved records and distinguish opening totals and unknown allowance.

## Prioritized findings and changes

| Impact | Finding | Implemented response | Evidence |
|---|---|---|---|
| High | Assigned decision flow and closure/holiday administration were unavailable | Real typed API services, tenant-keyed persistence, Settings calendar/approvers, assigned inbox and People personnel view | API tests, HTTP and browser journeys |
| High | Historical October CI targets disappeared after current-month defaults | Explicit fixture date in both native and functional historical paths; target readiness/diagnostics; regression test preserves today default | Angular route test, rendered target and isolated trusted native suite |
| High | Stale membership/configuration could retain decision authority | Current effective routing and active company-admin checks; completed decision history preserved | Membership-move and provisioning-grant revocation tests |
| Medium | Approval-table accessible labels escaped scroll containment at 375px (document width 676px) | Positioned table scroll region contains labels while retaining accessible names and horizontal table navigation | Strict document-width assertions at 1440/375/320 |
| Medium | Transport failures exposed “Failed to fetch” without recovery | Actionable retained-draft retry copy; specific server validation/conflict details preserved | Blocked holiday save, retained inputs and successful retry |
| Medium | Personnel year/filter and unknown figures could mislead | Loaded-year caption, unapplied-year hint, explicit units, known usage retained when allocation unknown, imported opening totals separated | Component/API tests and rendered personnel/history |
| Medium | Automatic closure records could resemble personal requests or unknown leave | Explicit company-closure provenance and “No balance impact” label, named publish reports with recorded/skipped results | HTTP exact dates/status/provenance assertions and employee history |
| Low | Mobile table actions were difficult to discover; success direction copy was inaccurate | Horizontal-scroll hints, neutral “Review employee results” success text | Final rendered checks |

## Pages, layouts and journeys verified

These additions are real API-backed functionality; all twelve local accounts and company data used here are explicitly fictional development fixtures. Saved records in this report mean records confirmed by the disposable local InMemory API, not production durability.

| Surface | Improvements / journey | Rendered artifacts |
|---|---|---|
| Admin Organization Settings | Company calendar and approver panels within existing settings hierarchy; holiday dialog validation, failed-save recovery and retry | [Desktop](admin-settings-1440.png), [375px](admin-settings-375.png), [320px](admin-settings-320.png), [save error](admin-holiday-save-error-mobile.png) |
| Closure dialog and report | Review affected employees before publish; explicit annual/no-impact choice; partial success and skipped employees; repeat publish safe | [Preview](admin-closure-preview-mobile.png), [desktop report](admin-closure-partial-results-1440.png), [320px report](admin-closure-partial-results-320.png) |
| Approval Requests | Current assigned inbox, review, approve/decline, changed assignment denial and self-approval | [Desktop](admin-assigned-inbox-1440.png), [375px](admin-assigned-inbox-375.png), [320px](admin-assigned-inbox-320.png), [review](admin-approval-review-mobile.png) |
| People / Personnel | Existing shared directory retained; admin-only annual balance overview and actual recorded leave details | [Desktop](admin-personnel-1440.png), [375px](admin-personnel-375.png), [320px](admin-personnel-320.png), [history](admin-personnel-recorded-history-mobile.png) |
| Employee request / My Leave | Company holiday exclusion; automatic closure provenance and no-impact label | [Saved request](admin-company-holiday-request-saved.png), [employee history](admin-closure-employee-history-mobile.png) |
| Workspace calendar | Current month default retained; explicit historical fixture URL works | [October target](calendar-historical-fixture-target.png) |

Admin views remain hidden/denied for employees. Other-company endpoints are denied. New company administration requires valid approver setup; no notification delivery, payroll, closure edit/cancellation, location-specific holiday calendar or automatic absent-approver substitution is claimed.

## Checks and results

Environment: Intel macOS 12.7.6; Node 22.22.3; Chrome 150.0.7871.125; .NET 10; Functions Core Tools 4.16.0. Local HTTP host used fictional seeded InMemory data with development authentication. Empty AzureWebJobsStorage logs an unhealthy storage probe; successful HTTP checks do not establish production host health.

| Check | Result | Scope and limit |
|---|---|---|
| API build | PASS, zero warnings/errors | Compiles final application and adapters |
| Backend unit suite | 10 passed | Domain/application unit checks |
| Backend full integration suite | 62 passed, 20 skipped, zero failed | Local/in-memory plus offline relational model; skipped tests require SQL connection |
| Final focused admin/deployment suite | 28 passed | Current effective routing, revocation, unknown usage and administration scenarios |
| QA-strengthened SQL model/forward-script check | 1 passed | Composite tenant FK/PK, rowversion, unique active scope, closure idempotency; checked-in incremental script equals EF-generated script; no database execution |
| Angular full suite | 85 passed across 19 files | Includes current-date/explicit historical URL and transport error recovery |
| Angular production build | PASS | Final copy refinement included |
| Real HTTP `verify-admin.py` | PASS after QA assertion strengthening | Leap validation/history immutability, inherited rerouting, assignment denial/self decision, balances, partial closures/replay, exact closure dates/provenance, cross-company denials and UTC lifecycle |
| Admin browser mode | PASS | Real API, settings/holiday retry/request/inbox/reroute/approve/decline/closures/personnel/employee history; no runtime exceptions; no page overflow at 1440/375/320 |
| Isolated native keyboard mode | PASS locally | Trusted input readiness, October date activation, Escape/focus return, shortlist and avatar; supplied Linux CI job was not rerun |
| Independent Product Designer review | No blocking/major residual usability defects | Screenshots and source; not physical touch or screen-reader proof |
| Independent QA review | No further confirmed production authorization/accounting defect | Found second historical fixture bug; strengthened structural and accounting checks; source review is not SQL-provider validation |
| Syntax and whitespace | PASS | JS/Python parse and git diff whitespace checks |

Commands (frontend commands run inside `frontend/`; Node path is workstation-specific):

```sh
dotnet build api/src/Vacate.Api --no-restore -m:1 -nr:false
dotnet test api/tests/Vacate.UnitTests --no-restore -m:1 -nr:false
dotnet test api/tests/Vacate.IntegrationTests --no-restore -m:1 -nr:false
dotnet test api/tests/Vacate.IntegrationTests --no-restore -m:1 -nr:false --filter 'FullyQualifiedName~AdminLeaveTests|FullyQualifiedName~DatabaseDeploymentTests'
dotnet test api/tests/Vacate.IntegrationTests --no-restore -m:1 -nr:false --filter FullyQualifiedName~SQL_model_and_forward_script
NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0 node node_modules/@angular/cli/bin/ng.js test --watch=false
NG_BUILD_SASS_EMBEDDED=0 NG_BUILD_MAX_WORKERS=2 NG_BUILD_PARALLEL_TS=0 node node_modules/@angular/cli/bin/ng.js build --configuration production
python3 scripts/verify-admin.py --api-base-url http://127.0.0.1:7073/api
MOCK_ADMIN_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 MOCK_SCREENSHOT_DIR=/private/tmp/vacate-admin-previews node frontend/verify.mjs
MOCK_NATIVE_ONLY=1 MOCK_API_URL=http://127.0.0.1:7073 MOCK_SCREENSHOT_DIR=/private/tmp/vacate-admin-native node frontend/verify.mjs
```

Use fresh disposable API fixtures between mutating suites. These new acceptance suites explicitly reject a clock outside their documented November–December 2026 fixture window rather than silently substituting past-date bypass for pending approval. Update fixtures deliberately when that window expires. Fixed-clock application tests remain independent of wall time.

## Persistence and contract coordination

Backend and frontend both changed: typed administration routes/contracts and company-calendar calculation feed the new views and closure labels. Infrastructure provisioning is unaffected. A new normalized [EF migration](../../../../api/src/Vacate.Infrastructure/Persistence/Migrations/20261112210758_CompanyAdministration.cs), [reviewable forward script](../../../database/migrations/0004-company-administration.sql) and runtime grant/verification changes are included. Apply through the existing operator database-first process before any eventual application publication; this work does not apply them.

The script was generated from `20261105214614_LeaveRequestSubmission` to `20261112210758_CompanyAdministration` using EF 9.0.21. Migration Up is additive and includes company tables, sequences, tenant foreign keys, lifecycle/rowversion/unique constraints and leave request decision/provenance columns. The review confirms source/model shape only. SQL transaction/concurrency behavior, application-role grant execution and production schema remain unverified because no SQL test connection was supplied; all 20 provider cases were explicitly skipped.

## Remaining questions and limits

- Product decision: editing/cancelling published closures and correcting generated leave history; no destructive mutation is exposed.
- Product decision: fallback for absent/deleted/unconfigured approvers; current behavior preserves pending records and requires valid explicit configuration rather than assigning substitute authority.
- Native keyboard checks for the new admin forms/tables/dialogs, assistive technology, Safari and physical mobile interaction remain open. Functional focus/DOM checks and the existing native calendar/picker/navigation suite have separate evidence.
- Loading/empty/denied/unknown/validation and stale-owner behavior have source/component/API coverage; not every combination was separately captured in a browser screenshot.
- SQL-provider and operator migration/grant execution remain release gates. No live/deployed smoke test, CI runner rerun, commit, push or deployment is claimed.

Implemented children and the epic remain QA; VAC-47's bounded prompt/workflow evaluation is Done. Full repository paths are listed in [files changed](files-changed.md). Shared automation measurements are reported once here; assistant/human actual time remains unmeasured/Unknown and is not inferred from timestamps or summed across agents.
