# Leave balances — UI proposal

**PROPOSED · 2026-10-22 · Mock only.** Based on the [UI Architect prompt](../../.github/prompts/agents/ui-architect.agent.md), [calendar proposal](calendar-ui-proposal.md), [MVP accounting](../product/mvp-scope.md) and [leave-type review](../product/leave-types-review.md). The review owns attributed rules and historical limitations; this proposal establishes no legal allowances.

Keep all three alternatives. Add an expandable **My leave balances** card; on mobile, place it above the calendar. Each type shows available/total, unit, period and labelled percentage. Expanding reveals a horizontal segmented bar, exact numbers and **Allowance and rules**. **Show all types** expands the catalogue.

**Fictional illustration, not an entitlement:**

```text
▸ Annual leave    12 / 24 working days available · 50%
  [ Used 8 | Pending 4 | Available 12 ]          2026
  Allocation 24 · Used 8 · Pending reservations 4
  Available after reservations: 12 working days
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

Expanded rules show basis, eligibility, period/event, pay, service thresholds and source/version. Annual-leave information distinguishes current-employer service, total recognized service and five/six-day schedules; hire date alone is insufficient. Avoid double-crediting any disability supplement; reduced childcare hours and equivalent leave represent one underlying allowance, not two allocations.

Changing request type updates its rules and unit. Unknown calculations say **Balance cannot be calculated in this demo**. Do not collect diagnoses or proof. Team/organization scopes retain **My balances** only; colleagues' sensitive categories and balances stay private. Demo accounts share one fictional company and provide no real authorization.

Acceptance checks:

- Disclosures work with keyboard, visible focus and `aria-expanded`; chart numbers remain readable without color. A/B/C work at 375 px without overflow.
- Allocation 24, used 8, pending 4 yields 12/50% available. Approval yields used 12/pending 0/available 12; rejection instead restores available 16. Repeated decisions do not double-apply.
- Unknown, event-based, reduced-hours, zero and excess fixtures retain their distinct states and units.
- Production tests must deny cross-company/unauthorized employee balance access and clear account caches. A static mock cannot prove isolation.

**OPEN QUESTIONS:** approved-future versus completed presentation, carryover, accrual, rounding and production permissions.

**Verified:** documents read and arithmetic checked. This is a design proposal; implementation and legal validation remain pending.
