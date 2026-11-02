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



## Annual balance policy boundary — 2026-11-01 discussion

The founder selected GR as MVP policy jurisdiction, calendar-year annual entitlement, policy-minimum allocation, organization default vacation days, authorized admin/HR individual increases and configurable end-March next-year carryover cutoff. See the [charter](../product/product-charter.md#founder-clarification--membership-annual-balance-and-policy-defaults--2026-11-01). These are product requirements, not a reviewed statutory policy pack.

PROPOSED: versioned jurisdiction policy supplies reviewed allocation/carryover defaults and constraints; organization configuration stores permitted overrides; employee allocation may not fall below the policy floor. Unknown required inputs remain unresolved. Organization default versus employee override precedence, experience recognition/prorating and policy-update handling require decisions. Resolve a concrete cutoff for each entitlement year and retain its policy/configuration provenance. Treat a cutoff for taking leave separately from entitlement forfeiture/payment obligations; see [official research](../compliance/policy-sources.md#annual-leave-research--2026-11-01). Membership scalar semantics are now confirmed: nullable annual allowance override, null → applicable policy allowance, not remaining days. Organization default prefills explicit allowance at joining, while explicit null retains policy inheritance (confirmed). Founder confirmed explicit individual allowances must meet both org default and policy minimum; warn/reject lower values. Null explicitly selects policy and is allowed even if policy is below org default (founder-confirmed); the org floor applies only to non-null employee overrides; per-period accounting and legacy carryover migration also remain open. No statutory numbers or automatic expiry engine approved.


## Dynamic inheritance rationale — 2026-11-01

Founder intends null employee allowance to follow the applicable policy as tenure/experience changes. Do not replace null with the computed number; distinguish configured override from evaluated period allocation and retain policy version/evaluation inputs. The discussed 20 → 21 → 22 progression is illustrative, not a complete approved GR engine. [Official Ministry guidance](https://ypergasias.gov.gr/ergasiakes-scheseis/atomikes-ergasiakes-sxeseis/chronika-oria-ergasias/), checked 2026-11-01, distinguishes initial calendar years/prorating and tenure, and includes both same-employer and total-experience thresholds; detailed applicability/effective dates remain to review. Founder subsequently decided existing overrides overtaken by a later policy minimum stay unchanged, with no automatic effective raise/review workflow; future admin notification and membership-edit warning flag the shortfall. Any recommendation to introduce an explicit source selector or change organization prefill is a proposal, not a new accepted product decision.


## Agreed configuration versus evaluated entitlement — 2026-11-01

Founder agreed to named AnnualAllowanceOverrideDays on membership plus yearly AnnualLeaveEntitlements preserving applied policy version/results. Use policy keeps null dynamically inherited; Custom allowance makes organization default an explicit suggestion/prefill and stores a validated number. This refines earlier unconditional prefill. Do not mutate a null override into a calculated default or recalculate historical years under current policy. Existing fixed overrides overtaken by policy remain unchanged with warning/notification and no review (founder decision); per-year revision/effective-date details remain open; no statutory algorithm approved. See the [charter](../product/product-charter.md#founder-agreement--allowance-override-and-yearly-history--2026-11-01).


## Existing-value transition exception — 2026-11-01

[Founder decision](../product/product-charter.md#founder-decision--existing-override-below-a-later-policy-minimum--2026-11-01): preserve an existing custom allowance if policy/tenure later raises the minimum above it, without changing effective allowance or imposing review. Future administrator notification/membership-edit warning reports the discrepancy. New/explicitly changed values still require current floors and null remains dynamic. This is product behavior, not an approved statutory exception or a claim of compliance; reviewed applicability and production policy decisions remain separate.
