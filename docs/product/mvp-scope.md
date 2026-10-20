# MVP scope

**Status:** PROPOSED simplification, 2026-10-20. Confirm company assumptions in the [charter](product-charter.md) before implementation.

## Company pilot

- Support multiple customer companies with isolated data; start actual use with the founder's company.
- Manually managed company setup, application accounts and personnel. A personnel record does not automatically grant login access; Microsoft directory integration is deferred.
- Company email is the globally unique username. Each account has access to one customer company for the initial scope; multi-company membership and company switching are deferred.
- Employees, simple teams and an assigned approver; no arbitrary hierarchy builder.
- Admin-configured leave types, working days and holiday dates.
- Opening yearly allocations and auditable adjustments; no statutory entitlement engine.
- Submit, approve, reject and cancel requests, with history and explained balances.
- Own requests/balance, approval inbox and permission-aware team availability.
- Basic administrator export and operational audit records.

**ASSUMPTION:** Full-day requests and one approval step are enough initially. Part-time work, half days, cross-year requests, carryover and cancellation of approved leave need explicit rules before they are supported. Unsupported requests must fail clearly rather than produce guessed calculations.

## Deferred

Native mobile apps; Teams/calendar/payroll integrations; automatic accrual and country packs; multiple teams/employers per employee; coverage rules; delegation engine; multi-level approval builder; attachments; resource booking; analytics platform; self-service subscriptions and automated billing. Email delivery is optional for the first pilot if the in-app inbox is sufficient; confirm operational need.

## Acceptance scenarios to implement and verify

1. An admin sets up people, a leave type, working days, holiday dates and opening allocations. Only authorised administrators can change them, with history.
2. An employee submits a request; non-working days are excluded and the calculation is displayed. Invalid or unsupported ranges fail without changing balance.
3. Submission reserves available balance; approval converts that reservation into used balance exactly once. Rejection or allowed cancellation releases it exactly once. Simultaneous requests cannot overspend it.
4. Only the assigned authorised approver can decide. Self-approval and fallback routing must follow a confirmed company rule.
5. Colleagues see permitted availability without private leave details; employees see their own records. Admin exports follow the same authorisation boundary.
6. With customer companies A and B seeded, users and administrators of A cannot read or mutate B's employees, requests, balances, calendar, configuration, exports or audit records, including through guessed identifiers.

7. Creating an account with an existing company-email username fails, including when the existing account belongs to another company. No duplicate account or access to that other company is created. Duplicate handling must not disclose the other company or its employee details.

## Delivery sequence

1. Confirm the company's rules and manual account/access lifecycle.
2. Build one vertical slice: sign in, view balance, submit, decide, update calendar and audit history.
3. Verify isolation, concurrent balance changes and recovery; run the company pilot.
4. Use pilot findings to select commercial onboarding, billing and hosting requirements.
