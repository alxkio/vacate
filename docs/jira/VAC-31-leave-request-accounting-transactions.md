---
id: VAC-31
type: story
summary: Record leave requests and balance accounting transactions
status: qa
created: 2026-11-01
updated: 2026-11-13
parent: null
depends_on: [VAC-30]
---

# VAC-31 — Record leave requests and balance accounting transactions

![Story](badges/story.svg) **🔍 QA** · Owner: Unassigned

## Description

As an employee or authorized approver, submit whole-day leave and see consumption/remaining balances explained by durable records.

**Request creation story:** As an employee, I want to open the leave request form, choose my leave type and unit, and enter either a start date with a duration or a start/end date range, so that I can preview and submit the correct number of working days without being charged for excluded weekends or public holidays.

The founder requested this form refinement and acceptance criteria on 2026-11-05. It belongs to this existing submission/accounting story; no duplicate issue is created. The wider approval/cancellation scope below remains separately unresolved.

Future follow-up coordinated from [VAC-22](VAC-22-relational-database-schema.md), not a design-completion child or blocker for that story. Founder requested separate current/future work items on 2026-11-01. The founder authorized team implementation on 2026-11-05. Current execution is bounded below; this does not authorize commit, push, deployment or unresolved lifecycle policy.

## Scope

Current authorized implementation: the request-creation flow in F-1–F-32, including durable per-working-date charges/provenance, idempotent overlap-safe submission, selected-type balances, read-only GR carryover information and TZ-1 organization timezone configuration. Preserve pending/approved separation and existing tenant/privacy boundaries.

Deferred: approval assignment/decision and cancellation/reversal workflows, automatic annual policy evaluation/renewal/expiry, hourly submission, TZ-2 timezone conversion and ongoing holiday-provider integration. No new approver rights are inferred from organization settings or job titles. Wider lifecycle acceptance below remains future work and must not be represented as implemented by this slice.

Implementation has started; unresolved source-backed decisions and missing entitlement periods are explicit gates rather than permission to invent defaults.

### Request form behaviour

- Confirmed: use the add-request button and existing leave-type choices; support start + duration and start + end input; recalculate the working-day preview and exclude weekends/applicable public holidays from persisted charge quantities.
- Confirmed: retain the unit choice. Hours shows one date, hides the end date and disables submission with “Hourly leave requests are not available yet.” Days remains the supported submission unit; no hours-to-days conversion is introduced.
- Confirmed (latest founder decision, 2026-11-05): warn only when the requested charge would make the applicable remaining balance negative, and block submission. A result of exactly zero is allowed; a non-negative result has no low-balance warning. The previous 3-day threshold is withdrawn. A future organization setting may control negative-balance permission; that setting is outside this story.
- Confirmed: the six-day working week is Monday–Saturday (Sunday excluded); the five-day pattern is Monday–Friday (Saturday/Sunday excluded). Exclude public holidays from the organization country calendar as well. A Saturday on a six-day schedule is a working day unless it is a public holiday; do not exclude it merely because it is commonly called a weekend.
- Confirmed (founder, 2026-11-05): duration means a positive integer count of chargeable working days. Derive and display the end date by counting from the start date, inclusively, and skipping non-working days/public holidays. In date-range mode, both start and end dates are inclusive and the amount is calculated/read-only.
- **PROPOSED for confirmation:** label the modes “Duration” and “Date range”; keep type, start date and an equivalent range/quantity when switching modes; never retain a stale hidden-field value as authoritative.
- Confirmed (founder, 2026-11-05): allow a non-working start date. Warn clearly which selected dates do not apply (for example, “Sunday is not a working day and will not be included”). Keep the entered selection visible while composing; on submission persist only applicable working leave dates. Do not store excluded start/end/interior dates as requested leave dates or zero-charge leave entries, and do not render them as leave in personal/shared calendars. Saved range boundaries, if present, are the first/last included dates; interior excluded dates must not be filled by a continuous calendar span. Public-holiday reference rows remain separate from leave records.
- Confirmed: reject selections with zero working days. If public-holiday data is missing, use the company working schedule/weekends alone; missing coverage does not block submission. PROPOSED UX: clearly label this fallback in the preview. Do not invent holiday dates.
- Confirmed: allow past dates with a warning and skip approval for past dates only; future dates in a mixed request follow the effective approval setting.
- Confirmed: warn on overlaps, accept submission and add/charge only uncovered dates. Keep existing leave types/statuses unchanged, including when the new selected type differs. Pending and approved dates count as covered; cancelled/rejected dates do not. For a fully covered working-date selection, allow Submit to acknowledge “All selected working days already have leave recorded. No additional leave will be added.” Create no new request, leave dates, calendar entries or charges. A non-empty working-date selection fully covered by leave is distinct from a selection containing zero working days (which is blocked).
- Confirmed: allow cross-year ranges. For annual leave, use eligible previous-year carryover first, then the leave date year's allowance, preserving explicit per-year charges and blocking negative balances. Greek carryover is usable through 31 March inclusive of the following year; show this read-only in organization settings. See VAC-32 for processing integration.
- Confirmed: show only the selected type's own balance in the form. If it lacks a known finite applicable balance, show the configuration problem and block submission; no invented zero/unlimited balance or quota.
- Preview quantity is distinct from remaining balance. Pending requests that require approval do not reduce remaining balance under the existing accepted rule. Showing a potential post-approval balance does not itself reserve or consume days.

### Form acceptance criteria

These are specification scenarios, not verification results. Criteria marked PROPOSED require confirmation of the associated defaults before implementation.

| ID | Given / when | Expected outcome |
|---|---|---|
| F-1 | An authenticated employee with an active membership activates Add leave request | The form opens for their own membership, with leave type, unit and supported date-entry controls. |
| F-2 | The employee selects a different existing requestable leave type | The selection is retained and relevant preview/balance information refreshes; unavailable types cannot be submitted. Show only this type's finite employee balance; if unconfigured/unknown, show a configuration problem and block submission without substituting zero. |
| F-3 | A Monday–Friday test schedule, no holidays, Friday start and duration 3 Days | The preview is 3 working days and the derived end date is Tuesday; Saturday/Sunday do not contribute. |
| F-4 | The same fixture with Monday explicitly configured as a public holiday | Friday + 3 Days ends Wednesday; the holiday and weekend do not contribute. |
| F-5 | Friday–Tuesday inclusive under that holiday fixture | The range preview is 2 working days (Friday and Tuesday), updated automatically without editing the amount. A holiday on an already excluded weekend is not subtracted twice. |
| F-6 | Start/end, duration, type or unit changes, or a mode switch occurs | The preview updates consistently; stale results cannot overwrite the current draft. PROPOSED: switching day modes preserves the equivalent quantity/range and selected type/start date. |
| F-7 | Required data is missing, duration is zero/negative/fractional, end precedes start, or the range has no chargeable days | Show a field-specific explanation and prevent submission; the server also rejects invalid requests without partial writes. |
| F-8 | The employee selects Hours, including after entering a day range | Show only one date and hide the end date; disable Submit and explain hourly requests are unavailable. A crafted hourly API request is rejected without persisting a request or charge. |
| F-9 | The employee changes from Hours back to Days | Restore the selected day-entry mode with coherent fields, recompute the preview, and enable submission only when valid under the agreed rules. No automatic hour conversion occurs. |
| F-10 | The new, non-overlapping charge is compared with each applicable year/type available balance | If the result is negative, show an accessible insufficient-balance warning and disable Submit; the server rejects the request without saving a request or charge. With 3 available days: requesting 4 warns/blocks; requesting 3 results in zero and passes this check; requesting 2 results in 1 and has no low-balance warning. Unknown/non-finite balance blocks submission for that type with a configuration explanation; it is never treated as zero or unlimited. |
| F-11 | A valid day request is submitted under the agreed approval and balance rules | The server independently calculates the charge using the applicable schedule/calendar. Persist only included working leave dates, explicit unit and chargeable quantity; any saved range starts/ends on the first/last included date. Excluded dates are not stored as leave dates and receive no calendar leave entry. Do not persist Used/Pending/Available totals or decrement the membership's annual allowance. |
| F-12 | Calendar/balance data changes after the preview or the client tampers with the preview amount | The server never trusts the client amount. PROPOSED: show the revised preview and require confirmation before committing a changed charge; no silent extra charge. |
| F-13 | Submission succeeds, fails or is retried | Success confirms the saved request and refreshes personal history/balance projections. Failure preserves the draft and explains the error without a success message. Repeated clicks/retries cannot create duplicate requests or deductions. Pending approval-required requests remain separate from remaining balance. |
| F-14 | Another company or employee identifier/calendar/balance is supplied, or membership access is revoked | Reject unauthorized reads/writes without leaking leave details or mutating either company. Derive the request's actor/company from authorized server context. |
| F-15 | The employee operates the form using keyboard or assistive technology | Inputs/modes have labels; validation, preview changes and warnings are accessible; opening/closing the form manages focus and Cancel saves nothing. |
| F-16 | A Monday–Saturday schedule and a Friday–Monday range, with no public holidays | Count Friday, Saturday and Monday: 3 working days. Exclude Sunday only. If Saturday is a configured public holiday, count 2 days. Both endpoints are inclusive (confirmed). |
| F-17 | Two organizations have different configured countries and a date is a holiday only in country A | Resolve each organization's own applicable calendar; exclude that date for A and count it for B when it is a scheduled working day. An employee cannot select another organization's country/calendar to change the charge. |
| F-18 | The employee selects Sunday as start and 2 working days of duration, with Monday/Tuesday working and no holidays | Accept the start selection and warn that Sunday will not be included. Preview 2 days ending Tuesday. On valid submission, save Monday and Tuesday only; Sunday is neither stored as a leave date nor shown as leave in the calendar. |
| F-19 | A date range includes a non-working start/end or an interior weekend/public holiday | Warn which selected dates are excluded. Persist/render only applicable working leave dates; saved boundaries use the first/last included dates. A Friday–Monday request on a five-day schedule creates leave only for Friday/Monday, without a calendar bar covering Saturday/Sunday. |
| F-20 | A selection contains zero working days after applying known holidays and schedule exclusions | Block submission in the form/server with “No working days selected”; save no request or charge. |
| F-21 | Public-holiday data is missing for all or part of the range | Continue using the company working weekdays/weekends for dates without holiday coverage; do not block solely for missing holidays. PROPOSED UX: label the fallback. Known holiday coverage elsewhere in the range still applies. |
| F-22 | A request contains past working dates and future dates and approvals are enabled | Warn about past dates. Past dates bypass approval; future dates follow the effective approval setting. Store per-date state/charges or equivalent segments so a single request status cannot bypass future approval. Server timestamps show actual creation, not a backdated submission. |
| F-23 | One of three working dates already has active leave, including under a different type | Warn with the covered date; accept submission, preserve the existing record/type/status, and create/charge only the two uncovered dates. Render each date once as leave. Do not extend the requested range to replace the covered day. Concurrent overlapping submissions cannot double-charge. |
| F-24 | A cross-year annual request includes dates in two calendar years | Allow it; calculate working dates and eligible carryover/allowance per leave date and persist each charge's entitlement-year attribution. Reject if any applicable year would become negative; a sufficient aggregate across years is not enough. |
| F-25 | A synthetic early-2027 request needs 3 new days, with 2 eligible 2026 carryover days and sufficient 2027 allowance | Charge 2 to 2026 carryover and 1 to 2027. For a date on 31 March, prior-year carryover is eligible; for 1 April it is not. Do not erase unspent prior-year entitlement records at the boundary. Dates in this example must be working days under the test calendar. |
| F-26 | An organization administrator views Greek annual-leave policy settings or attempts to change the cutoff | Display “Previous-year annual leave can be used through 31 March of the following year” as read-only. No editable deadline control; crafted API updates cannot change the policy deadline. |
| F-27 | The employee changes leave type or selects dates spanning balance periods | Show only that type's own balance, its relevant year/period and eligible carryover. Clear stale previous-type results and refresh the preview; do not display another type's balance or sum unrelated types/units. |
| F-28 | The selected type has no configured finite balance for a required period | Show a configuration explanation and prevent submission on both client/server. No arbitrary quota or zero balance is created. Historical unknown reference information is not converted into a personal allowance. |
| F-29 | Every selected working date already has pending or approved leave, possibly under different types | Warn that all dates are already covered. Allow Submit and return an already-covered acknowledgement; create no new request, leave dates, calendar entries or charges. Preserve all original types/statuses. Recheck coverage server-side under concurrent submissions. |
| F-30 | A selected working date has only cancelled or rejected leave | Treat it as uncovered; permit a new request under normal balance/approval rules without reviving or changing the historical record. |
| F-31 | An organization has no explicitly configured timezone when the setting is introduced | Persist a required organization TimeZone value defaulting to UTC; show UTC in organization settings. Existing organizations are backfilled to UTC without changing stored leave dates/timestamps. |
| F-32 | An authorized administrator saves the organization timezone setting | Persist/read back the value through the organization API/settings and enforce same-company access; reject invalid timezone identifiers atomically. The timezone governs the server business date used to classify past leave immediately; no frontend display conversion is introduced. Changing it does not rewrite existing request statuses/charges or activate automatic renewal/carryover processing. |

The weekday/holiday examples above are synthetic fixtures, not assertions about actual public-holiday dates or approved statutory rules. API errors, date-only timezone handling, covered date/year boundaries and real database charge/isolation checks must be included in implementation verification.

## Dependencies

- [VAC-30](VAC-30-annual-allowance-and-policy-entitlements.md): Reviewed annual entitlement/policy calculations, employment inputs and stored yearly allowance history. **Not satisfied:** this prerequisite remains Specification. The bounded creation implementation may consume existing explicitly configured finite entitlement records, but must block any missing/unresolved required type/year (F-28). Do not create statutory quotas, infer unknown balances or copy a current-year override into other years. Automatic policy/default/history coverage remains gated by VAC-30.

Coordination: [VAC-36](VAC-36-derived-balances-from-leaves.md) supplies the existing derived-balance/leave-row foundation; [VAC-40](VAC-40-greek-public-holiday-import.md) owns holiday imports. Missing provider coverage is not a blocker because F-21 explicitly permits schedule-only fallback; no source data may be fabricated.

VAC-22 supplies rationale and accepted-decision links. Completion of this future record does not gate VAC-22's design-only Done status.

## Acceptance scenarios

- [ ] Whole-day requests produce explained charges under reviewed working schedule/calendar; fractional/hourly or unsupported ranges fail atomically.
- [ ] Only explicitly authorized approvers can decide; configured approval requirement does not imply assignment or rights from manager/job title. Self-approval and insufficient-balance behavior follow accepted decisions.
- [ ] Approval and accounting changes commit once transactionally; retries/concurrent requests cannot duplicate deductions. Pending approval-required requests stay separate from remaining balance.
- [ ] Rejection/allowed cancellation follows agreed reversals, preserving history and membership allowance. Own/colleague projections and A-to-B reference/read/write/calendar paths enforce tenant/privacy boundaries.

## Subtasks and responsibilities

Product: approver/routing/cancellation/balance decisions. Backend/database: requests, charge/accounting transactions and idempotency. UX/UI: submission/history/inbox and permitted availability. QA: concurrency, full journeys, privacy/tenant/lifecycle.

Form refinement: Product resolves the questions below; UX/UI implements the two entry modes, previews, disabled hourly state and warnings; backend independently validates/calculates and authorizes submission; database records request/charge provenance without materialized balance totals; QA covers F-1–F-32 through paired API/browser and real-database checks. Infrastructure: no new infrastructure requested. The current implementation must update API contracts/server behaviour and frontend calls/views together; verification must identify runtime/browser/SQL evidence and remaining gaps before QA/Done is claimed.

### Ordered subtasks — timezone configuration and later handling

- [ ] **TZ-1 — Organization timezone setting:** add persisted organization TimeZone, required/default UTC; backfill existing organizations to UTC; expose through existing administrator settings/API with validation, tenant isolation and server-owned UTC lifecycle. Use the saved organization timezone immediately for the server today/past boundary; retain existing frontend date behaviour and all date-only values. Acceptance: F-31/F-32. No client display conversion is implemented by this subtask.
- [ ] **TZ-2 — Client timezone handling (deferred; depends on TZ-1):** audit/implement client-local display of UTC instants; preserve date-only leave/holiday values without offset shifts; audit timezone effects on yearly rollover and 31 March cutoff beyond the current confirmed server today/past boundary. Cover DST, browsers ahead/behind UTC, mixed past/future requests and organization timezone changes. This is a dependent numbered subtask, not a new external ticket or a blocker for recording TZ-1 configuration.

Founder direction, explicitly reconfirmed after clarification on 2026-11-05: keep the frontend's existing local date behaviour unchanged; no switch to UTC display is requested; UTC remains timestamp storage convention. **Baseline finding:** existing frontend date helpers use local Date construction/getters and toLocaleDateString; frontend-wide UTC display is not established. Preserve this baseline pending TZ-2 rather than silently converting every date. SQL date-only leave/holiday values have no timezone and must not be converted into midnight-UTC instants. Latest founder direction during implementation supersedes the inert-boundary portion: use the organization timezone immediately for server today/past classification, while preserving frontend display. **ASSUMPTION pending confirmation:** past means strictly before organization-local today; today follows the effective approval setting.

## Attachments and sources

- [VAC-22 decisions and schema context](VAC-22-relational-database-schema.md).
- [Product charter](../product/product-charter.md).
- [ADR-0001](../adr/0001-company-first-web-api.md) and [ADR-0003](../adr/0003-domain-and-application-services.md).
- [User contract](../contracts/user.md), [API contract](../contracts/api.md) and [policy-source register](../compliance/policy-sources.md).

Accepted canonical sources override issue notes. No unreviewed statutory defaults or new private-data permissions are established by this record.

## Comments

- C-1 · 2026-11-01 · Codex: Created by splitting current design and future work from VAC-22; no implementation or release evidence yet.
- C-2 · 2026-11-05 · Codex / Product Owner: Refined the founder's request-form story with two day-entry modes, calendar exclusions, hourly-disabled UI, warning requirement and testable scenarios. Low-balance definition/blocking and calendar/range defaults remain explicit questions; no application implementation requested or claimed.

- C-3 · 2026-11-05 · Codex / Product Owner: Founder clarified 3 days, Monday–Saturday for six-day schedules, and organization-country public holidays. Added F-16/F-17 and a concrete versioned SQL-calendar proposal; trigger basis and storage design remain pending review.

- C-4 · 2026-11-05 · Codex / Product Owner: Replaced the three-day warning with negative-result warning and submission blocking, including zero/positive boundary examples. Moved calendar-storage detail into a deferred proposal outside the story.

- C-5 · 2026-11-05 · Codex: Founder selected a separate one-time GR holiday import; VAC-40 tracks it. Form requirements are unchanged and provider failure does not approve fabricated calendar dates.

- C-6 · 2026-11-05 · Codex / Product Owner: Audited current authorized slice against the charter and ADR-0003/0004/0005. VAC-30 is not complete; existing explicit finite entitlements may support creation, while absent type/year coverage must block. Found no approved statutory evaluator or authorization for new default quotas.

- C-7 · 2026-11-06 · Codex: Founder reports hosted development errors `Invalid column name 'EntitlementYear'`, `LeaveTypeId` and `RequestId` after committing, merging and deploying the corrective code. All three are Leaves columns introduced by `20261105214614_LeaveRequestSubmission`. The earlier verification explicitly did not apply this migration to the deployed database, and host startup intentionally never migrates. **UNVERIFIED live diagnosis:** deployed application/schema mismatch; inspect target migration history before applying the reviewed forward migration, then refresh the existing runtime principal grants for the new request tables. Generated idempotent SQL locally and confirmed these additions; no live database inspection, migration or grant change was performed in this investigation. Frontend and HTTP contracts require no change for this schema alignment.

- C-8 · 2026-11-06 · Codex: Founder accepted a mandatory database stage before application publication. [VAC-41](VAC-41-database-deployment-gate.md) owns the implementation and its verification; this does not claim the missing hosted migration has been applied. Shared deployment-process work is logged only in VAC-41.

## Decisions

- D-1 · 2026-11-01 · Founder request: Split current work and future scope into separate tracked items. Existing product decisions remain in linked canonical documents; no open choice is silently resolved.
- D-2 · 2026-11-05 · Founder request: Support the two date-input approaches, exclude weekends/applicable public holidays from preview and saved charge, retain type/unit choice, show a single date with submission disabled for Hours, and warn about low balance. Canonical direction: [product charter](../product/product-charter.md#founder-request--leave-request-form-and-working-day-calculation--2026-11-05). Derived-end-date, inclusive-boundary and validation defaults are proposals, not founder decisions.

- D-3 · 2026-11-05 · Founder clarification: Low-balance threshold = 3 days; six-day schedule = Monday–Saturday; public holidays follow organization country. Supersedes D-2's open threshold and schedule/calendar-selection questions only. No decision yet on threshold basis/equality, insufficient-balance blocking or storage/provider. Canonical direction is in the linked product charter.

- D-4 · 2026-11-05 · Founder decision: Supersedes D-3's three-day warning threshold. Warn only if the requested days would result in negative remaining balance; negative balance is not allowed now. A future organization setting may govern it, but is excluded from this story. Exactly zero passes this balance check.

- D-5 · 2026-11-05 · Founder confirmation: Accept inclusive start/end dates and the proposed working-day duration-to-end-date calculation. Supersedes the corresponding proposal status in D-2; non-working-start validation and other separate proposals remain unresolved. Canonical direction is in the linked product charter.

- D-6 · 2026-11-05 · Founder decision: Allow non-working starts with a warning that excluded dates do not apply; exclude them on submission, do not store them as leave dates and do not display them as leave in calendars. Supersedes the earlier reject-non-working-start proposal and resolves that open part of D-5. Canonical direction is in the product charter.

- D-7 · 2026-11-05 · Founder decisions and explicit clarification replies: Block zero-working-day selections; missing holidays fall back to schedule/weekends; allow past dates with warning and bypass approval for past dates only; warn/accept overlaps but add only uncovered dates, preserving existing different-type records; allow cross-year ranges, consume eligible previous-year annual leftovers before the leave-year allowance; GR 31 March deadline is read-only; require known finite type balances and display only the selected type's balance. [Canonical direction](../product/product-charter.md#founder-decisions--submission-boundaries-and-yearly-charges--2026-11-05). Supersedes the corresponding earlier open questions and configurable-GR-cutoff proposal, not legal evidence or unrelated policy decisions.

- D-8 · 2026-11-05 · Founder agreement: Fully overlapped requests warn and allow Submit as an already-covered acknowledgement, with no new request/dates/calendar entries/charges; preserve original leave types/statuses. Pending/approved count as covered; cancelled/rejected do not. Resolves the corresponding overlap question from D-7. Canonical direction is in the product charter.

- D-9 · 2026-11-05 · Founder: Keep UTC timestamp storage and current date behaviour for now; persist an organization timezone setting default UTC, configuration only. Record later client-based timezone handling as a dependent subtask (TZ-2 depends on TZ-1). Date-only values remain distinct from UTC instants; no blanket frontend-UTC claim or conversion is made. [Canonical direction](../product/product-charter.md#founder-decisions--submission-boundaries-and-yearly-charges--2026-11-05).

- D-10 · 2026-11-05 · Founder confirmation: The earlier assumption of frontend UTC was corrected; retain existing frontend date behaviour. No frontend conversion or display change in current scope. TZ-1 remains configuration-only and TZ-2 deferred.

- D-11 · 2026-11-05 · Founder implementation request: Orchestrate product owner, frontend engineer, software developer and QA, consulting the enterprise architect as required. Execute request creation F-1–F-32 and TZ-1; preserve earlier frontend date behaviour and defer TZ-2 and unspecified approval/cancellation decisions. No release action is implied.
- D-12 · 2026-11-05 · Codex / Product Owner, **ASSUMPTION — presentation only:** use “Duration”/“Date range” labels, preserve equivalent valid range/quantity on mode changes, label missing-holiday fallback, and require fresh confirmation when the server recomputation changes the preview. These explain accepted calculation/safety rules without inventing policy. Latest founder direction selects organization-local server today; strict date-before-today classification remains an explicitly labelled implementation assumption pending confirmation.

- D-13 · 2026-11-05 · Founder clarification during implementation: Use the organization timezone immediately to determine the server business date/past-date approval bypass. Supersedes D-9/D-10’s configuration-only rule for this boundary only. Preserve existing frontend date display and date-only values; TZ-2 remains deferred. Organization default remains UTC. **ASSUMPTION pending confirmation:** dates strictly before organization-local today are past; today follows approval settings.

- D-13 · 2026-11-06 · Codex corrective implementation: A current-period explicit CustomAllocation is a configured finite request allowance even when the separate statutory policy floor is unresolved. Use it without inventing a policy/default; missing explicit/evaluated amounts and unconfigured years remain blocked. The existing legacy policy projection is unchanged. Regression/evidence: [local verification](media/VAC-31/verification-2026-11-06.md).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-01 | Codex / shared work reference | Create split issue and metadata | Not separately recorded | Shared split activity is recorded once in VAC-22 W-19; do not add duplicate time here. |
| W-2 | 2026-11-05 | Codex / assistant, unmeasured | Refine request-form story, canonical product direction and acceptance criteria | Unknown | Duration was not measured; current documentation diff is the evidence. No implementation time claimed. |
| W-3 | 2026-11-05 | Codex / assistant, unmeasured | Record founder clarifications and propose holiday persistence/acceptance | Unknown | Documentation diff; no duration measured or implementation performed. |
| W-4 | 2026-11-05 | Codex / assistant, unmeasured | Replace balance rule and acceptance boundaries; defer calendar-storage detail | Unknown | Current documentation diff; duration unmeasured, no implementation. |
| W-5 | 2026-11-05 | Codex / assistant, unmeasured | Record inclusive-date and duration-calculation confirmation; align scenarios | Unknown | Documentation diff; duration unmeasured. |
| W-6 | 2026-11-05 | Codex / assistant, unmeasured | Record allowed non-working starts, exclusion warning and saved/calendar date scenarios | Unknown | Documentation diff; no duration measured or runtime change. |
| W-7 | 2026-11-05 | Codex / assistant, unmeasured | Record submission/yearly rules and clarification replies; check official deadline guidance and extend acceptance | Unknown | Documentation diff and official source links; duration unmeasured. |
| W-8 | 2026-11-05 | Codex / assistant, unmeasured | Record agreed fully covered behaviour and status-coverage criteria | Unknown | Documentation diff; duration unmeasured, no runtime changes. |
| W-9 | 2026-11-05 | Codex / assistant, unmeasured | Specify organization timezone default and deferred dependent subtask; inspect existing date helpers | Unknown | Current documentation diff and workspace-data.service.ts date helpers; duration unmeasured. |
| W-10 | 2026-11-05 | Codex / assistant, unmeasured | Record explicit confirmation to preserve frontend date behaviour | Unknown | Documentation diff; duration unmeasured, no application change. |
| W-11 | 2026-11-05 | Product Owner agent / assistant, unmeasured | Audit authorized creation scope, prerequisite readiness and deferred lifecycle/timezone work; synchronize active execution status | Unknown | Current documentation diff and source documents; no runtime or human acceptance claimed. |
| W-12 | 2026-11-06 | Codex / assistant, unmeasured | Reproduce committed failures; correct explicit-allowance lookup and HTTP payload; run local backend/frontend/API/browser checks | Unknown | [Verification](media/VAC-31/verification-2026-11-06.md); no human/assistant duration measured. |
| W-13 | 2026-11-06 | Codex / assistant, unmeasured | Trace hosted invalid-column report to VAC-31 schema additions and generate forward SQL for review | Unknown | C-7; migration source and operator script generation checked locally; no live database changes or measured duration. |

Human actual: Unknown. Assistant duration: Unknown; shared work referenced only. Automation elapsed: not recorded. No estimate recorded. Implementation time is not measured.

## History

- H-1 · 2026-11-01 · Codex: Created as specification; future decisions/prerequisites remain open; no implementation started.
- H-2 · 2026-11-05 · Codex: Remains Specification after form refinement; warning policy, calendar/range choices and existing lifecycle prerequisites still prevent a ready-for-implementation claim.

- H-3 · 2026-11-05 · Codex: Remains Specification after calendar/threshold clarifications; concrete storage proposal added for review, with no runtime schema or application change.

- H-4 · 2026-11-05 · Codex: Remains Specification. Negative-balance submission behaviour resolved; existing range/calendar/lifecycle questions remain. No runtime change.

- H-5 · 2026-11-05 · Codex: Inclusive boundaries and derived-end-date calculation accepted; remains Specification for the separate outstanding questions. No implementation or release claimed.

- H-6 · 2026-11-05 · Codex: Non-working-start handling resolved; remains Specification for other outstanding questions. Acceptance updated for saved dates and calendar gaps, not just charge quantity.

- H-7 · 2026-11-05 · Codex: Added F-20–F-28 and coordinated VAC-32; remains Specification for the narrower questions below. No frontend/API/database code changed.

- H-8 · 2026-11-05 · Codex: Fully overlapped submission and coverage statuses resolved; F-29/F-30 added. Remains Specification for other outstanding questions.

- H-9 · 2026-11-05 · Codex: Added TZ-1/TZ-2 and F-31/F-32. Current date behaviour preserved; timezone configuration is specified, not implemented.

- H-10 · 2026-11-05 · Codex / Product Owner: Specification → In progress after explicit team implementation request. Current scope is creation F-1–F-32 plus TZ-1; VAC-30 remains an unsatisfied broader policy prerequisite, missing type/year entitlements fail closed, and organization-local today is selected and the strict-before-today assumption awaits confirmation.

- H-11 · 2026-11-06 · Codex: In progress → QA for the bounded request-creation slice after corrective local verification. 39 backend tests, 65 frontend tests, full native browser and actual HTTP acceptance pass. 18 SQL cases remain skipped; no hosted release or SQL readiness claim.

## Verification and release

[Local execution evidence, 2026-11-06](media/VAC-31/verification-2026-11-06.md) records reproduced failures, corrective changes and actual passed checks. SQL migration/provider/grants tests remain outstanding; the 18 skips are not a persistence pass. The founder committed the implementation as 4287fe5; corrective changes from this verification remain uncommitted. No push, deployment, Done/Released or independent human acceptance is claimed.

## Open questions and follow-up

1. Latest founder implementation clarification selects organization-local today immediately, using the persisted organization TimeZone (default UTC); frontend display remains unchanged and TZ-2 stays deferred. **ASSUMPTION pending confirmation:** past means date strictly before organization-local today; today follows the effective approval setting. Past dates alone bypass approval; mixed future dates do not.
2. Fully overlapped submission and status coverage are resolved by D-8/F-29/F-30. Do not extend duration/range to replace overlaps; only uncovered dates within the original calculated selection are new leave.
3. Confirm mode-switch presentation/preservation and reconfirmation when server preview differs from the draft. Maximum range remains unspecified; cross-year and past-date submission are allowed.
4. Greek annual carryover deadline and oldest-eligible-first consumption are selected; business date/timezone, retroactive request effects on prior allocations, cancellation after cutoff and legacy configuration migration remain to design. Never borrow a later year's allowance for earlier dates without an explicit product decision. Request/calculation work must coordinate VAC-32 without creating a reverse dependency cycle.
5. Public-holiday regional/observed applicability and source correctness remain unresolved (VAC-40). Missing holiday coverage now explicitly permits schedule/weekend-only calculation. Decide how users are informed of fallback and how later corrections affect already-saved requests; no silent recalculation is authorized.
6. Existing wider lifecycle: future-date approver assignments/self-approval/fallback and cancellation rules. Coordinate VAC-4/VAC-9/VAC-20; existing reference fixtures do not approve workflow assignments.


## Owner-requested deletion and test teardown · 2026-11-13

Accepted decision: active same-company administrators only may permanently delete personal saved leave requests, restoring charged/ pending amounts and removing request/date rows atomically. Closure-generated leave is protected. [Canonical decision](../product/product-charter.md#owner-decision--permanent-personal-request-deletion--2026-11-13). Implementation is a subtask here, coordinated with VAC-42's CI current-date regression; no new issue is created.

Acceptance: own-employee, cross-company, revoked/provisioning-only admin and unknown IDs are denied without mutation; approved/pending/mixed/declined deletion restores only that request's ledger; a repeated delete is a harmless missing-record result; company closures are rejected; SQL request/date removal and runtime DELETE grants remain narrowly scoped. Future-request browser acceptance creates real leave through UI and deletes only new test requests in `finally`, checks list/calendar absence and original used/pending/available totals, and revokes created sessions. Deliberate post-save assertion failure must also clean up.

Assistant recorded implementation/verification duration: unmeasured. Human actual: Unknown. Status remains QA; actual results will be appended when available.


2026-11-13 · Assistant verification update: API build and 72 integration checks passed, with 25 actual-SQL cases explicitly skipped. The real future-request UI journey and deliberate post-save assertion-failure journey both passed exact request/calendar/balance restoration and session revocation. Independent QA reviewed cleanup/preservation. [Follow-up evidence](media/VAC-43/upcoming-request-deletion.md). Full functional rerun result is recorded there; existing issue status remains QA.
