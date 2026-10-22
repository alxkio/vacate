# Leave mock release — 2026-10-22

## Reviewed scope and decisions

The founder approved publishing the mock login/root page, teal v favicon, leave catalogue and expandable personal balances to Azure dev. All names and data remain fictional. The approved mock workweek is Monday–Friday, five days. A/B/C direction selection remains open.

Sources changed: [approved leave summary](product/leave-types-review.md), [balance design](design/leave-balances-proposal.md), [source register](compliance/policy-sources.md), [mock README and previews](design/calendar-mock/README.md), gallery assets, frontend static routing, packaging, CI and cloud smoke checks. The catalogue has 29 entries and 28 requestable choices; disability supplements adjust annual allocation rather than becoming separate requests. Annual service tiers are reference text; configured balances do not calculate eligibility.

## Review and local acceptance

An independent QA/privacy reviewer checked the changes against the previously published version. One finding was corrected: after reversed dates, changing only the start date must clear the end-date validation error. A browser regression now exercises rejection, correction and successful preview. The reviewer confirmed the fix and reported no remaining blockers within the synthetic-demo scope.

Chrome acceptance passed with Node 22.22.3:

- Both mock credentials, invalid login, tab-session reload and logout.
- All 29 catalogue entries and all 28 requestable rule panels.
- Expandable balances, exact percentages, separate units/periods, unknown projections and explicit excess amounts; previews leave balances unchanged.
- Five-day references, shared-calendar privacy, twelve scope/view combinations and sixteen mobile overflow checks.
- Eight desktop/mobile screenshots without JavaScript exceptions.

Package checks passed for all gallery assets, the revision marker, matching favicons and preservation of Angular's entry as `app.html`. JavaScript/Python syntax, static-routing JSON, workflow YAML and `git diff --check` passed. Full Angular/API builds and tests run on GitHub's Linux runners because the local OS cannot build the Angular native dependency.

## Deployment evidence

Hosted CI, Azure deployment and post-deployment checks are pending at this review checkpoint. Target: subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, resource group `rg-vacate-dev`. Infrastructure configuration is unchanged in this release.

## Boundaries and open questions

The demo sign-in provides no server authentication or tenant authorization. No employee data or business endpoints are introduced. Shared fixtures contain generic availability; personal rules and balances remain in the viewer's area. Production tenant-isolation tests remain required before real data or balance APIs are added.

UI direction, company policy/eligibility, service evidence, accrual, carryover, rounding, holiday calendars and production permissions remain open. Historical/reference rules are labelled and are not enforced as statutory defaults.
