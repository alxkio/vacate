# Leave-policy model

**Status:** PROPOSED — requires legal review before statutory defaults are shipped.

## Design principle

Vacate stores reviewed, versioned, employer-configurable policy data. It does not infer a complete legal entitlement from an organisation’s country alone.

## Policy pack fields

- Jurisdiction, legal employer, effective date range, source URL, reviewer, and review date.
- Leave type, eligibility, accrual/allocation, carryover, expiry, rounding, and negative-balance rules.
- Working schedule and public-holiday calendar applicability.
- Approval, evidence/documentation, retroactive-request, cancellation, and escalation rules.
- Whether a value is statutory baseline, collective-agreement term, employer policy, or employee-contract override.

## Safety rules

- Never store medical diagnoses for sick leave unless a reviewed workflow establishes necessity and legal basis.
- Display the policy version and calculation explanation to the employee and administrator.
- Preserve historical policy versions for past requests and ledger entries.
- Mark every imported country rule as `UNVERIFIED` until it has a primary source and legal review.

## Open questions

1. Will Vacate provide legal-policy content, allow customer configuration only, or use a hybrid model?
2. Who is accountable for policy updates in Greece and future jurisdictions?
3. Which employee-contract attributes are necessary at MVP: start date, work schedule, legal employer, location, collective agreement?

