# Vacate iteration plan: small demo to configurable Greek pilot

**Status:** DRAFT — for review, not implementation approval  
**Date:** 2026-10-20  
**Owner:** Product lead / founder

## Purpose and sources

Deliver a small Angular/API demo with fictional data, then add reviewed Greek business rules before using real employee data. This document saves the proposed roadmap for review; it does not approve delivery or supersede accepted decisions.

Sources: [AGENTS.md](../../AGENTS.md), [accepted ADR-0001](../adr/0001-company-first-web-api.md), [product charter](product-charter.md), [proposed MVP](mvp-scope.md), [policy model](../domain/policy-model.md), [policy-source register](../compliance/policy-sources.md), and founder answers in the planning conversation on 2026-10-20. The [product-owner prompt](../../.github/prompts/agents/product-owner.agent.md) was read with its historical-reference boundary applied.

### Founder-confirmed direction — 2026-10-20

- Start with a small interactive demo: fictional user selection, dashboard, requests, decisions, member creation and company calendar tagging, with resettable in-memory API data.
- Full-day annual and sick leave; initial Greek pilot covers private-sector, full-time Monday–Friday employees.
- Admins approve company requests and may approve their own requests.
- Employees also see who is away, with names and dates but without colleagues' leave types or private reasons.
- Forced company closures deduct annual leave; free company days deduct nothing. Validate real-world applicability during Greek policy review.
- Reviewed Greek rules are required before the real company pilot. The founder obtains sign-off from a qualified Greek employment/payroll adviser.

Other behavior specified below is **PROPOSED** for review. Greek legal interpretations remain **UNVERIFIED** until recorded and reviewed in the policy-source register. No statutory entitlement or holiday claim is established here.

## Personas

| Persona | Need | Initial access |
|---|---|---|
| Employee | Understand available leave, request time off and see who is away | Own balances and requests; colleagues' names and absence dates |
| Organisation admin | Manage employees, company dates and leave decisions | Employee capabilities plus company administration and overview |
| Product lead and policy reviewer | Confirm calculations against company policy and reviewed Greek requirements | Review specifications, evidence and calculation examples |

Departments/functions, integrations and multi-country rollout come later.

## Iterations and user stories

Each iteration is a reviewable vertical slice. Complete its acceptance checks before starting dependent work.

### Iteration 0 — Contracts, fixtures and a reliable build

#### US-01 — Consistent fictional company

As a reviewer, I want the same fictional people and leave records in both applications so that I can assess the demo reliably.

Acceptance criteria:

- Seed company A with two employees and one admin; seed company B with an employee and admin for isolation tests.
- Include annual allocations, approved annual leave, pending requests, recorded sickness, a forced closure and a free company day.
- API fixtures and the optional frontend mock adapter implement the same contracts and scenarios.
- Fixture dates are deterministic, with an explicit demo “today”; records contain no real personal data.
- Development-only user selection changes account context, not company membership. Demo mode and reset behavior are clearly labelled.
- Demo identity selection, reset and fixtures are unavailable outside the explicit development/demo environment.

#### US-02 — Repeatable verification

As a developer, I want one documented verification path so that each agent can validate its changes.

Acceptance criteria:

- API Release build, API tests, Angular production build and Angular tests run in a compatible CI environment.
- Resolve the [observed macOS build limitation](../build-check-2026-10-20.md) through compatible CI; do not downgrade dependencies without a separate technical decision.
- Document commands and distinguish compilation, automated tests and browser verification.

### Iteration 1 — Personal dashboard and calendar

#### US-03 — Understand my leave

As an employee, I want a personal dashboard so that I can understand my leave position at a glance.

Acceptance criteria:

- Show annual allocation, used, pending/reserved and available days.
- Show annual and sick leave cards; sickness displays recorded days without inventing a statutory allowance.
- “Total available” sums only compatible, balance-bearing day allowances; exclude sickness and company free days.
- Display an explanation of the balance arithmetic and the selected year.
- Frontend mock mode and API mode produce equivalent dashboard results.

#### US-04 — See my calendar and colleagues' availability

As an employee, I want a simple monthly calendar so that I can plan time away.

Acceptance criteria:

- Previous/next month and “today” navigation work.
- Distinguish weekends, own approved/pending leave, forced closures and free company days using labels as well as colour.
- Colleagues' approved absences show names and dates only; do not return their leave types or private details.
- Employees see only their own pending requests.
- Include loading, empty and failed-request states and a compact legend.

### Iteration 2 — Request and decide leave

#### US-05 — Preview and request leave

As an employee, I want to preview a request before submitting it so that I understand its effect.

Acceptance criteria:

- Select annual or sick leave and an inclusive date range.
- Preview explains counted working days and excluded weekends/company free days.
- Annual submission reserves available days; sickness records days without consuming annual allowance.
- Reject overlaps, invalid ranges, insufficient annual balance, partial days and cross-year requests in this initial slice.
- Rejected submissions leave requests and balances unchanged.
- No medical explanation or attachment is requested.
- The demo uses explicitly fictional rules, not claimed Greek statutory calculations.

#### US-06 — Decide requests

As an admin, I want to approve or reject requests so that company records remain current.

Acceptance criteria:

- An admin can decide requests within their company, including their own.
- Approval converts annual reservation to used days exactly once; rejection releases it exactly once.
- Repeated decisions and concurrent submissions cannot duplicate deductions or overspend balances.
- Employees can cancel pending requests; cancellation releases reservations exactly once.
- Approved cancellation is explicitly unsupported until its reversal rules are specified.
- Calendar, cards and request status refresh together after an action.
- Every decision records actor and timestamp.

### Iteration 3 — Members and company calendar

#### US-07 — Add employees

As an admin, I want to add members so that the company can use the demo with a small workforce.

Acceptance criteria:

- Add name, company email and opening annual allocation; new members default to employee access.
- Keep personnel records distinct from login access; real credential provisioning belongs to the pilot iteration.
- A demo account, where created, accesses exactly one company.
- Duplicate usernames are rejected across Vacate without exposing another company's identity or details.
- Employees cannot add members or alter allocations.
- Company context comes from the authenticated/demo account, not a trusted request-body company ID.

#### US-08 — Mark company closures

As an admin, I want to mark company dates so that employees understand when the office is closed and how leave is affected.

Acceptance criteria:

- Choose a date and either **forced annual leave** or **free company day**.
- Preview affected employees and balance effects before saving.
- A forced closure deducts one annual day per applicable working day; a free company day deducts nothing.
- Weekends produce no annual deduction.
- Block changes that overlap existing requests, conflicting closures or insufficient balances; show the affected records for review.
- Saving is atomic across affected employees.
- Removing a future closure reverses only its own movements, exactly once; past closure editing is unsupported initially.
- Record actor, timestamp and movement origin.
- These are demonstrated product semantics; real forced-closure use remains gated on Greek policy review.

#### US-09 — Understand company availability

As an admin, I want an organisation overview so that I can see who is away and what needs a decision.

Acceptance criteria:

- Show a monthly company calendar and pending-request list.
- Admins can inspect leave types and balances within their company.
- No department/function hierarchy is required.
- Company A administrators cannot view or change company B records.

### Iteration 4 — Specify and implement Greek rules

#### US-10 — Establish reviewed Greek policy

As the product lead, I want sourced rule specifications so that the pilot uses reviewed interpretations.

Acceptance criteria:

- Research official Greek sources for annual entitlement, relevant service/history inputs, sickness treatment, working-day counting, applicable holidays, carryover and expiry, and company-imposed closures.
- Record primary URLs, publication/effective dates, applicability, interpretation, reviewer and confidence in the policy-source register.
- Identify required employee inputs from the evidence; do not collect unrelated HR or medical data.
- Founder and qualified Greek employment/payroll adviser review the rule matrix and worked examples.
- Unsupported employee circumstances are identified explicitly.
- No statutory defaults enter the real pilot before sign-off.

#### US-11 — Calculate with configurable, versioned policies

As an admin, I want policy configuration so that Vacate can support company differences and later countries.

Acceptance criteria:

- Separate work schedules, calendar dates, leave-type behavior, allocation/eligibility rules and request lifecycle rules.
- Distinguish statutory baseline, employer policy and employee allocation adjustments.
- Use typed rule settings and explicit calculation strategies; do not build an arbitrary scripting engine.
- Policy versions have applicability dates, jurisdiction and source/review references.
- Requests and balance movements retain their policy version and calculation explanation.
- Policy changes do not silently recalculate historical records.
- Unknown or unsupported cases fail clearly instead of guessing.
- Add only rule capabilities required by approved Greek examples; defer unused international options.
- Verify extensibility with a fictional second-country configuration, without claiming that it represents another country's law.

### Iteration 5 — Real company pilot

#### US-12 — Replace demo infrastructure safely

As the company owner, I want a controlled pilot so that real employee data and balances are protected.

Acceptance criteria:

- Replace in-memory state with approved persistent storage and transactional balance movements.
- Implement real sign-in, account provisioning/recovery and role enforcement.
- Disable demo selectors, reset endpoints and fictional fixtures.
- Verify company isolation, concurrency, migration behavior and backup restoration.
- Review personal-data visibility, retention and audit access.
- Compare representative opening balances and calculation examples against the company's reviewed records.
- Pilot begins only after Greek policy sign-off and release review.

**OPEN QUESTION:** Authentication, hosting/database selection and retention remain existing open decisions. Resolve them through explicit decision stories before implementing this iteration; agents must not choose them implicitly.

## Initial API endpoint catalogue

**PROPOSED:** Use `/api` routes, OpenAPI contracts, date-only leave ranges and standard problem responses. Scope all business endpoints to the caller's company.

| Endpoint | Purpose | First iteration |
|---|---|---|
| `GET /health` | Application liveness; does not imply database health | Existing |
| `GET /api/me` | Current account, company and capabilities | 0 |
| `GET /api/me/dashboard?year=` | Own balances and leave summaries | 1 |
| `GET /api/calendar?from=&to=&scope=personal\|company` | Permission-filtered calendar | 1 |
| `GET /api/leave-types` | Available types and supported capabilities | 1 |
| `GET /api/leave-requests?status=` | Own requests; company requests for admins | 2 |
| `POST /api/leave-requests/preview` | Explain request calculation without mutation | 2 |
| `POST /api/leave-requests` | Submit request | 2 |
| `POST /api/leave-requests/{id}/decision` | Admin approval or rejection | 2 |
| `POST /api/leave-requests/{id}/cancel` | Cancel own pending request | 2 |
| `GET /api/members` | Admin member list and overview data | 3 |
| `POST /api/members` | Add personnel and opening allocation | 3 |
| `POST /api/company-calendar/closures/preview` | Explain proposed closure effects | 3 |
| `POST /api/company-calendar/closures` | Add company closure | 3 |
| `DELETE /api/company-calendar/closures/{id}` | Remove supported future closure | 3 |

Development-only demo endpoints list fictional accounts and reset fixtures. They are not authentication APIs. Policy-management and real account-lifecycle contracts will be specified after their review/decision stories, before implementation.

## Agent delivery and verification

- Maintain one ordered backlog with story IDs, dependencies, acceptance criteria and evidence links.
- Give each implementation task one small vertical slice, its approved contracts and fixture scenarios.
- Require implementation and independent QA/privacy review for access-sensitive changes.
- Each handoff names documents changed, decisions made, remaining questions and verification evidence.
- Run two-company tests for every scoped endpoint, including guessed identifiers and admin actions.
- Test balance transitions, retries, concurrent requests, closure reversals and historical policy preservation.
- Browser-check employee dashboard → preview → submit → admin decision → refreshed calendar/balances, plus member creation and closure tagging.
- Passing smoke tests alone does not approve the pilot.

During implementation, update the product charter/MVP, personas, policy model and source register to reflect approved decisions. Keep this roadmap separate from historical reference material.

### Proposed demo defaults requiring review

Resettable in-memory API, matching frontend fixtures, annual allocation supplied manually, no negative annual balances, no automatic holiday imports, no cross-year requests and no approved-leave cancellation. These are bounded demo behaviors pending reviewed Greek rules.

### Document verification

Checked this draft against the planning conversation's selected answers, repository source precedence and the existing product/policy documents. This task changes documentation only; no implementation or runtime verification is claimed. Source documents changed: this draft and the documentation map. No new implementation decision is accepted by saving this document.
