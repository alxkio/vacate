# Leave balances — UI proposal

**ACCEPTED AND IMPLEMENTED IN MOCK · 2026-10-22.** Based on the [UI Architect prompt](../../.github/prompts/agents/ui-architect.agent.md), [calendar proposal](calendar-ui-proposal.md), [MVP accounting](../product/mvp-scope.md) and [leave-type review](../product/leave-types-review.md). The founder approved the display and specified a five-day, Monday–Friday workweek. The review owns attributed rules and historical limitations; this proposal establishes no legal allowances.

Keep all three alternatives. Place expandable **My leave balances** above the calendar in A/B/C, including mobile. Confirmed allocations show available/total, unit, period, labelled percentage and a horizontal segmented bar; expanding reveals exact numbers and **Allowance and rules**. **Show all types** expands the catalogue.

**Fictional illustration, not an entitlement:**

```text
▸ Annual leave    14 / 25 working days available · 56%
  [ Used 9 | Pending 2 | Available 14 ]          2026
  Allocation 25 · Used 9 · Pending reservations 2
  Available after reservations: 14 working days
```

Submission reserves balance: `available = allocation − used − pending`; percentage is available/allocation. Approval converts pending to used exactly once; rejection or permitted cancellation releases reservations once. Approved-upcoming breakdowns require confirmed ledger semantics: never subtract an amount already included in used again.

| Allowance/state | Presentation |
|---|---|
| Confirmed fixed allowance | Bar in its original days/hours/months and period |
| Event-based | “Per qualifying event”; known event allowance only, no invented annual quota |
| Reduced hours | Schedule/reduction information; no vacation-days percentage |
| No fixed allowance | Label and recorded usage, no percentage |
| Eligibility unconfirmed | “Eligibility to confirm”; no available amount/percentage |
| Confirmed no entitlement | “Not eligible”; no misleading 0% |
| Exhausted known allowance | “0 of N available”; distinct from missing information |

Never combine types, periods or units into an overall total/percentage. Never divide by zero; show excess requests explicitly. Pay status is separate from allowance. **ASSUMPTION:** fixtures are fictional, not policy calculations.

Expanded rules show basis, eligibility, period/event, pay, service thresholds and source/version. Annual-leave information distinguishes current-employer service from total recognized service; the mock uses five-day figures only. Hire date alone is insufficient. Avoid double-crediting any disability supplement; reduced childcare hours and equivalent leave represent one underlying allowance, not two allocations.

Changing request type updates its rules and unit. Unknown calculations say **Balance cannot be calculated in this demo**. Do not collect diagnoses or proof. Team/organization scopes retain **My balances** only; colleagues' sensitive categories and balances stay private. Demo accounts share one fictional company and provide no real authorization.

Acceptance checks:

- Disclosures work with keyboard, visible focus and `aria-expanded`; chart numbers remain readable without color. A/B/C work at 375 px without overflow.
- Allocation 25, used 9, pending 2 yields 14/56% available. Mock previews do not change this balance. Production approval/rejection must convert or release reservations once; those operations are outside this mock.
- Unknown, event-based and reduced-hours fixtures retain their distinct states and units. Excess requests are explicit. Configured zero allocations are a future production acceptance scenario.
- Production tests must deny cross-company/unauthorized employee balance access and clear account caches. A static mock cannot prove isolation.

**OPEN QUESTIONS:** approved-future versus completed presentation, carryover, accrual, rounding and production permissions.

**Verified:** browser checks cover all 29 catalogue entries, 28 requestable rule panels, balance expansion, units/percentages, unknown/excess projections, shared-calendar privacy and mobile layouts. See the [mock verification record](calendar-mock/README.md). Statutory calculations and production authorization remain pending.
