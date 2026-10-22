# Documentation map

Start with the [product charter](product/product-charter.md), [proposed MVP](product/mvp-scope.md), [technology proposal](../TechChoices.md) and [repository review](review-2026-10-20.md).

For review: [iteration plan](product/iteration-plan.md) — draft personas, user stories, acceptance criteria, API endpoints and a path from a mocked dashboard to a configurable Greek pilot.

| Area | Purpose | Status |
|---|---|---|
| product/ | Company-first intent, scope, personas, evidence and measures | Charter distinguishes confirmed intent from proposals; other material is draft |
| domain/ | Glossary, scenarios and policy boundaries | Proposed; broader models do not expand MVP |
| compliance/ | Data map, retention and policy-source register | Draft; decisions and source review outstanding |
| adr/ | Durable accepted decisions | ADR-0001 records product direction; ADR-0002 records Azure hosting |
| jira/ | File-based issues, product backlog, decisions and work logs | One retrospective released story; fictional example excluded from the backlog |
| reference/ | Conventions observed in another codebase, to inform the layout | Reference only; not a decision |
| archive/ | Superseded technology proposal | Historical reference only |

Decision labels: ACCEPTED means implementation may rely on it; PROPOSED and ASSUMPTION require validation; OPEN QUESTION needs a decision; UNVERIFIED lacks adequate evidence; SUPERSEDED is retained history.

Source precedence follows AGENTS.md. Use accepted ADRs first, then accepted product direction, then reviewed policy sources. Historical domain, market research and prompts cannot override them. Record conflicts and ask the product lead rather than silently selecting a rule.

- [First cloud deployment preparation (2026-10-21)](cloud-deploy-2026-10-21.md) — app migration, configured target, verification and remaining account setup.
- [First dev deployment (2026-10-22)](cloud-deploy-2026-10-22.md) — published gallery/API URLs, deployed commit, verification and remaining product decisions.
- [Calendar UI proposal (2026-10-22)](design/calendar-ui-proposal.md) — three proposed layouts, interactions and permission boundaries; [interactive local mock and previews](design/calendar-mock/README.md).
- [Approved mock leave-type summary](product/leave-types-review.md) — allowances, rules and five-day workweek; production policy validation remains open.
- [Expandable leave balances](design/leave-balances-proposal.md) — accepted UI Architect recommendation, implemented with fictional per-type quantities, percentages and rules.
- [Leave mock release](release-2026-10-22-leave-mock.md) — independent review, acceptance checks and successful Azure dev deployment.
