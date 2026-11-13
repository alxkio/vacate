# Administrator journeys and interface handoff

Reviewed 2026-11-12 for [VAC-43](../jira/VAC-43-admin-functionality.md), including [VAC-46 settings](../jira/VAC-46-admin-settings-design.md) and [VAC-47 UX/UI workflow](../jira/VAC-47-ux-ui-workflow-evaluation.md). This is a design handoff and reusable review workflow. It does not establish implemented or released functionality.

## Evidence and decisions

Authority: [product charter](../product/product-charter.md#owner-decisions--administrator-functionality--2026-11-12), accepted ADRs, the owner's explicit answers, and implemented VAC-42 behavior. Inspected current `organization-settings.html`, unified settings, People, workspace navigation and existing policy controls. Visually inspected the [VAC-42 desktop settings capture](../jira/media/VAC-42/owner-feedback/feedback-settings-1440.png): white bordered sections, teal actions, pale canvas, restrained typography, workspace editor beside structure summary. This capture proves the incumbent composition, not the new epic's behavior.

Accepted owner decisions on 2026-11-12:

- Company closures automatically record closure leave. A balance-deducting closure charges annual leave; insufficient-balance employees are skipped and reported individually.
- Recurring custom holidays initially apply to the whole company, on fixed month/day dates each year. A 29 February holiday applies in leap years only. Owner-supplied regional examples express the need; they are not verified statutory holiday data and must not be preloaded as legal facts.
- Requests use an assigned approver configured at team, department or organization level. More specific configured assignments take precedence; organization is the fallback when team/department assignment is missing. Self-approval is allowed when the requester is the assigned approver. Server resolution is authoritative.
- Preserve employee public-directory access. Personnel leave records are a separate, administrator-authorized view; table visibility is not authorization enforcement.
- Past requests remain allowed with warnings, as confirmed during VAC-42. This epic does not silently change that policy.

No self-approval or leap-day question remains: both were explicitly answered by the owner. Any additional publication lifecycle rules remain product decisions; see the child issues before implementing unsupported behavior.

## Navigation and settings composition

Reuse the existing destinations: Settings → Organization, Approval Requests, and People. Keep navigation names consistent with page headings and current selection. Add admin-only Leave overview within People, preserving Company directory as the public view. Do not make the employee directory an entry to other employees' requests or balances.

Settings order:

1. Company workspace and At a glance: identity, timezone, country, working week, saved structure counts.
2. Organization settings: existing policy switches, explicit save/recovery, organization approver configuration.
3. Company calendar: separately headed Closed dates and Recurring holidays panels, each with its own empty state, add action, server feedback and list.
4. Departments and teams: existing structure creation/drilldown; scope-specific approver control belongs beside the relevant approval settings.

Use section navigation or anchors to make lower sections discoverable without changing scope routing. Avoid turning all sections into equal primary actions. Keep each form's save outcome local; saving an approver must not appear to publish a closure or save another draft.

## Proposed journeys within accepted scope

Thoughts and feelings have not been researched. The comprehension risks below are **ASSUMPTIONS**, to be tested through task walkthroughs rather than presented as participant evidence.

| Stage and user goal | Actions and touchpoints | System response / handoff | Friction and recovery | Evidence / success signal |
| --- | --- | --- | --- | --- |
| Plan a company closure | Admin opens Settings → Company calendar → Add closure; enters title, start/end and deduction choice | Persistent labels explain automatic company-wide recording; annual-leave consequence is visible before publication | Required or reversed dates show associated field errors; cancellation preserves the unchanged saved list | Accepted automatic recording; admin can predict the balance consequence before saving |
| Publish and account for exceptions | Admin publishes once and waits | Server result distinguishes recorded employees from skipped employees and provides the supported skip reasons | Keep retry idempotent; a failure is not success. Partial success must say how many were recorded and skipped, with an explicit report rather than a green-only success toast | Accepted skip-and-report rule; server counts and report reconcile |
| Confirm employee impact | Admin opens People → Leave overview; employee later opens own history/calendar | Saved closure entries are labeled as company closure and show their actual balance effect | Do not substitute fictional reference events when saved records fail to load. Report partial/unavailable data | Completion requires saved records, not a locally inserted decorative calendar entry |
| Add a recurring company holiday | Admin opens Recurring holidays → Add holiday; names the day and chooses month/day | Server saves annual company-wide calendar configuration; list shows month/day and recurrence | Invalid calendar dates are field errors. Duplicate/overlap behavior follows server policy. Failed saves retain draft | Fixed annual company-wide scope accepted; recurrence is understandable without an invented year |
| Assign an approver | Admin chooses organization/team/department settings and saves an eligible assignee | Show saved assignment and inherited fallback, including effective organization fallback where appropriate | Never say “No approval required” when the actual state is approval required but assignment missing. Preserve draft and show actionable failure | Team → department → organization resolution; cross-company assignees excluded server-side |
| Resolve assigned work | Assignee opens Approval Requests; pending assigned items appear; opens Review | Details show employee, leave type, requested dates, calculated duration, status and available decision actions | Loading/error/empty/denied differ. A stale decision refreshes with “This request has already been decided.” only when server confirms it | Assigned inbox accepted; server success removes resolved item from pending queue |
| Decline or approve and confirm | Assignee explicitly chooses Approve or Decline; enters supported reason if required | Decision stays pending until server confirms; requester sees authoritative new status in own history | Preserve selected request on failure. No optimistic success, bulk actions or implied permission based on administrator title | Decision result and requester status agree; other tenant/unassigned actor cannot act |
| Inspect personnel leave | Admin opens People → Leave overview, selects supported year/status/person filters | Real saved request records and supplied balance fields appear with clear units/status | Unknown balance is “Unavailable”, never zero. Empty filters differ from no records. No medical proof or unrelated private profile data | Admin overview accepted; directory-only employee gets server denial for private records |

## Controls and copy

### Closed dates

Panel helper: “Record company closure days for employees. Choose whether they use annual leave.” Action: **Add closure**. Dialog heading: **Add company closure**. Inputs: **Closure name**, **Start date**, **End date**, and switch **Deduct from annual leave**. Supplementary copy when enabled: “Annual leave is recorded automatically. Employees without enough balance are skipped and listed in the result.” When disabled: “Company closed dates appear on the calendar without reducing annual leave.” Primary action: **Publish closure**, only when the server actually publishes and records it. Otherwise name the implemented lifecycle truthfully.

Result copy must reflect the response, for example “Closure recorded for 8 employees. 2 employees were skipped.” Counts are illustrative only and must never be hardcoded. Put a visible **Skipped employees** heading above named exceptions and server-provided reasons. Keep the report available after closing the dialog. Do not imply skipped employees were allocated annual leave or successfully covered.

### Recurring holidays

Panel helper: “Additional company holidays repeat on the same month and day each year.” Inputs: **Holiday name**, **Month**, **Day**. Action: **Add recurring holiday** / **Save holiday**. Explain whole-company scope once. Do not call these national public holidays or claim legal validation. For 29 February show “Leap years only”; never move it to a neighboring date. Other invalid month/day combinations are errors.

### Assigned approvers and inbox

Use **Assigned approver** and **Use inherited approver** where inheritance is actually supported. Show effective fallback in ordinary text with the scope name. Native selection must identify the employee by name and sufficient work context to disambiguate, without exposing private personal fields. A missing required organization approver needs a clear unresolved state and server-backed recovery.

Inbox heading **Approval Requests**; helper **Leave requests assigned to you**. Default pending view. Columns: Employee, Leave type, Dates, Duration, Status, Action. **Review request** opens detail; Approve and Decline remain distinct, with request context visible. Never rely on red/green alone. Display sensitive reasons only to the authorized audience and only when supported by the contract.

### Personnel overview

Use **Company directory** and admin-only **Leave overview** as clearly labeled views. Request rows distinguish taken/approved/pending/declined states rather than calling every recorded request “leave taken”. Avoid a calculated balance summary unless the server returns its unit, year and authoritative value. Calendar samples, reference allowance calculations and actual saved requests remain visibly separate.

## Interaction, accessibility and responsiveness

- Reuse existing native dialogs, field labels, switches, primary/secondary buttons, alerts and saved-state conventions. No new UI library, font, illustration or brand system is needed.
- Native dialog: visible heading, Cancel, Escape where safe, initial focus to meaningful input/heading, contained focus, error association and focus return to the trigger. During a write prevent duplicate submission and explain progress. Do not erase a draft on server failure.
- Associate errors with fields through `aria-describedby`; invalid inputs use `aria-invalid`. Announce asynchronous error/success messages. Visible focus and text labels remain available when colors are absent.
- Desktop: align panels to the incumbent spacing; keep decision details near decision actions. Tables use semantic headers/caption in a named, keyboard-focusable scroll region when overflow is needed.
- At 375px and 320px: stack form fields/actions, wrap headings and reports, keep page-level overflow absent, and allow intentional table-region overflow. Primary actions and inputs remain reachable without hover. Test long names, month/day labels and full failure messages.
- Test 200% zoom and actual keyboard navigation. Resized Chromium screenshots establish layout only; they do not prove real touch, Safari behavior, screen-reader operation or WCAG conformance.

## Prioritized design risks and checks

| Priority | Risk | Required evidence |
| --- | --- | --- |
| P1 | Partial closure publication looks like full employee coverage | Force an insufficient-balance case; verify recorded and skipped counts, reasons and persisted records |
| P1 | Admin overview or approval detail leaks private records | Exercise employee, unassigned approver and foreign-company denial at API and direct-view boundaries |
| P1 | A retry records duplicate closure leave or applies a decision twice | Retry after interrupted response; verify server idempotency/conflict handling and honest UI result |
| P1 | Missing approver is confused with disabled approval | Configure each scope/fallback/missing state; compare visible effective assignee and server resolution |
| P2 | New calendar controls become undiscoverable below the long settings form | Inspect desktop/mobile headings and section links; find Add closure without knowing document order |
| P2 | Saved request history is confused with reference calendar samples | Follow closure → own history and People → overview; inspect data-source labels and unavailable states |

## Reusable administrator UX/UI review prompt

This is a manually invoked prompt within a design artifact. It is not an automatic instruction, registered agent, installation or change to discovery. Existing [Product Designer profile](../../.github/agents/product-designer.agent.md) already links the required skills; no profile or skill modification is justified by this feature.

> Use the repository Product Designer profile and source precedence to review the implemented administrator journeys in VAC-43. Inspect the working tree and preserve unrelated changes. Read the relevant issues, accepted product decisions and actual API/frontend behavior. Use `user-journey-mapping` to trace Settings → closure publication → employee history, Settings → recurring holiday → request calculation, assignment → inbox → requester status, and People → personnel overview. State which paths are implemented, fictional, proposed or unavailable. Read installed Impeccable once and select `critique` for independent design review, `clarify` for consequential copy, `adapt` for responsive behavior, `audit` for measurable technical checks and `polish` for supported refinement. Follow each selected workflow's prerequisites; listing a workflow is not execution. Preserve Vacate's established visual identity and accepted policy. Prioritize blocked tasks, privacy, duplicate writes, partial success and recovery before cosmetic drift. Inspect rendered desktop/mobile states and keyboard operation; distinguish screenshots, source evidence, automated interaction and unavailable checks. Implement only authorized improvements. Keep policy/permission changes as explicit product questions and continue independent work. Update the linked issues and report prioritized findings, changed files, verification and remaining limits. Do not commit, push, deploy, create external design files or contact others without separate authorization.

Workflow selection and expected outputs:

| Workflow | Inputs | Output / boundary |
| --- | --- | --- |
| Journey mapping | Accepted scope, current routes, server handoffs, role permissions | Stage map, completion signal, alternate paths and explicit uncertainty; not participant research |
| Impeccable critique | Stable target, independent assessments, rendered/source evidence | Prioritized findings following the installed orchestration; do not call a handoff a completed critique |
| Impeccable clarify | Closure consequence, skip report, assignment and saved-status text | Plain accurate copy; legal/policy meaning unchanged |
| Impeccable adapt | Existing panels/dialogs/tables and target viewports | Reachable essential controls and wrapping/overflow checks; device/gesture limits stated |
| Impeccable audit | Final changed markup, semantics, focus, errors, contrast, detector | Measurable technical findings with false positives reviewed; not an accessibility certification |
| Impeccable polish | Implemented complete paths, neighboring tokens/patterns | Small supported refinements and final rendered checks, not concealed redesign |

Figma evaluation: **not selected for this implementation**. The incumbent app, source controls and browser checks support a concrete review without an external design copy that can drift. Figma remains useful later if competing navigation concepts or stakeholder-editable prototypes need comparison. The owner mentioned “perhaps Figma”; no Figma file, external write, connector setup or design-to-code import was required or performed.

## Verification status

Completed for this artifact: role/skill/context review; source inspection; incumbent screenshot inspection; accepted decisions mapped to forms, handoffs, privacy boundaries and recovery; relative-link validation. No application code changed by this design task, so it introduces no API contract or tenant-isolation behavior to test. Frontend/backend feature implementation and its runtime authorization checks remain owned by the sibling tasks.

**UNVERIFIED:** new rendered admin screens, gesture/keyboard/screen-reader behavior, SQL-backed closure publication, approval transactions and host deployment. Add concrete evidence here or in child issues as implementation is verified; source recommendations above are not claims of passing behavior. No user research or emotional measurements were invented.

### Implementation source review · 2026-11-12

Inspected the new `administration` components, templates and shared styles after implementation. This was an independent source review against the handoff, not a completed Impeccable critique or rendered accessibility audit. The implemented sources provide distinct closure/holiday controls, preview before publication, a persistent employee result report, explicit assignment inheritance, assigned inbox actions, administrator-only personnel view, native dialogs, owner-scoped asynchronous responses, field validation and responsive form/action stacking.

Findings sent to the Frontend Engineer for correction before rendered checks:

- **P1:** personnel table caption used the editable year while displaying records from the previously loaded year. Use the tracked `loadedYear` for results; distinguish draft filter from applied data.
- **P2:** saved closure result reports did not identify the closure whose results were shown. Preserve the closure name in the report heading and move focus to the result context when opened, so multiple publications remain distinguishable.
- **P2:** annual balance table numeric columns omitted their day unit. Add the unit in headers or the table caption.

Correction source check: the Frontend Engineer applied all three findings. Re-read templates now use `loadedYear`, explain an unapplied year selection and label annual amounts in days. Closure results retain name/dates; `showReport()` renders then focuses the named results heading. These fixes are source-verified; new rendered behavior remains unverified until the feature browser checks. Final rendered evidence belongs in the feature verification record.

### Partial rendered review · 2026-11-13

Independently inspected local Chrome/CDP screenshots in `/private/tmp/vacate-admin-previews`: settings at 1440/375/320, holiday save failure on mobile, assigned inbox at 1440/375, and the saved leave confirmation after excluding a configured company holiday. Settings retain the incumbent hierarchy, identity, section separation and wrapping; the mobile holiday dialog keeps the draft and both actions visible. The saved confirmation is visually distinct from an unsaved preview. These screenshots establish the captured layouts and copy, not keyboard or gesture operation.

The acceptance harness separately found actual page overflow at 375px in the inbox; that is a functional layout finding under correction, even though intentional table-region clipping alone is not a defect. **P2:** holiday network failure displayed raw “Failed to fetch” without a next action; sent to the Frontend Engineer to use actionable save/retry copy while retaining server validation details. A short horizontal-scroll cue was suggested for narrow inbox/personnel tables whose actions are offscreen. Closure result, personnel and decision-state captures remain pending in this partial review.

### Final rendered review · 2026-11-13

Independently inspected the final local screenshot batch: updated holiday failure, closure preview, partial closure reports at desktop/320px, mobile approval review, personnel overview at desktop/320px, mobile recorded personnel history and employee closure history. No blocking or major remaining usability defect was found in these captured states. Holiday failure now explains that saving was not confirmed and entries are kept. The closure report names the publication, shows dates and distinguishes 3 recorded from 9 skipped employees in the exercised case. Its focused heading is visible. Employee history explicitly identifies the automatic company closure and no balance impact. Personnel captions identify year and units; mobile tables have scroll instructions and visible contained scrollbars.

The parent reports the final browser acceptance passed strict page-overflow checks at 1440/375/320 for settings, inbox, partial closure reports and personnel after the Frontend Engineer bounded the visually-hidden table-label containing block. This is independently inspected screenshot evidence plus separately attributed harness evidence, not an independent rerun of the functional harness. No screen-reader, real touch, Safari or accessibility-conformance claim follows from it.

Remaining minor observation: the publication message says “results below” while appearing after the report; “Review employee results” avoids a misleading directional cue. This does not block the verified publication/report path. Runtime and release limitations remain in the epic verification record; no deployment was performed by the design role.
