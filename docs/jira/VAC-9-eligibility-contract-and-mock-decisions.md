---
id: VAC-9
type: story
summary: Model backend-owned leave eligibility with private mock decisions and a review matrix
status: released
created: 2026-10-24
updated: 2026-10-25
parent: null
depends_on: [VAC-5, VAC-6]
---

# VAC-9 — Model backend-owned leave eligibility with private mock decisions and a review matrix

![Story](badges/story.svg) **🚀 Released** · Owner: Codex

## Description

The founder wants leave availability to reflect current profile facts, with frontend gender/marital restrictions now and backend-owned business decisions later. Define the response boundary, centralize provisional Greece profile checks, and provide a revisable factor list for every type. Do not infer personal facts from names or present the mock shortcuts as verified statutory rules.

## Scope and dependencies

Requires [VAC-5](VAC-5-common-leave-types-chooser.md)'s existing catalogue and request/balance presentation plus [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md)'s canonical person/company fixtures. Coordinate UI rendering with [VAC-8](VAC-8-calendar-first-and-balances-page.md), without making independent layout work depend on legal-policy resolution.

- Define a proposed JSON response/schema for own-context decisions: eligible, not-eligible, to-confirm, safe reason and policy/evaluation versions.
- Centralize explicit fictional gender/marital/child/sole-care profile checks in the mock eligibility module, not page components. One GR configuration applies across companies; future company overrides are deferred. Existing allocation/rule values stay intact.
- Hide known-unavailable types from default personal request/balance choices. Show all retains their reference rules with disabled request options/actions, personal explanations and preview guards; unknown remains distinct and can preview only in this mock.
- Keep all rules discoverable. Show personal numeric allocation/projection only for eligible decisions with an existing valid ledger; eligible does not manufacture a quota.
- Backend contract documents authenticated company/person scope, policy/version/effective/event context, submission re-evaluation and server tenant-isolation gates. No endpoint, production schema migration or statutory evaluator is implemented.

## Policy conflict and review boundary

**Founder clarification, 2026-10-24:** authorize current-profile frontend gender/marital restrictions without requiring an upcoming event before showing/applying. Country GR is the shared baseline now; company customization, birth registration and evidence uploads come later. The mock implements married-profile marriage exclusion, a defined female/male type list, child-dependent context and divorced + child + sole-care checks. **OPEN for production:** official references contain transfer/placement and sole-care pathways that do not reduce to those shortcuts. The [30-type review matrix](../product/leave-eligibility-review.md) preserves the exact implemented list and source differences; adoption/special-maternity pathways remain To confirm. Authorization for the fictional mock does not establish a verified legal rule pack.

## Acceptance scenarios

- [x] A valid current account receives one decision per existing type, correct company/employee IDs and a consistent policy version matching the response schema.
- [x] Unknown, signed-out, unsupported-type and foreign-company contexts produce no other person's response and cannot complete a denied preview.
- [x] Fixtures exercise eligible, not-eligible and to-confirm across marriage, maternity/paternity, child-care and sole-care examples using explicit synthetic profile values, never inferring them from names/roles. Missing facts/unsupported countries remain To confirm.
- [x] Unknown/denied types show no numeric personal allocation/percentage/projection; source allowance rules stay visible; annual and existing Maya/Iris ledgers remain correct where eligible.
- [x] Disabled native options have an accessible personal explanation; forged option/example/submit paths cannot bypass the mock guard. Unknown preview is explicitly not an approved entitlement.
- [x] Account changes/history and shared team/department/organisation calendars do not expose eligibility, reasons or raw qualifying facts.
- [x] Packaging, cache configuration and web smoke include the eligibility asset; frontend-only release behavior remains supported.
- Future server gate: deny company A's reads/submissions for B, including forged employee/event IDs; re-evaluate expired/revoked policy decisions and authorize evidence/overrides. Public fixtures do not prove server isolation.

## Subtasks and responsibilities

- Policy researcher: sourced, dated 30-type factor matrix, authorized mock-filter list and remaining source differences; no legal advice or statutory-default approval.
- Domain/backend contract: response schema and private/future enforcement responsibilities; no backend runtime business-rule change.
- Frontend Engineer: consume assessment states from the centralized frontend mock module; no inline page policy; hide denied default choices, show reference/unknown reasons and guards.
- QA: schema/fixture scenarios, account isolation, unknown/denied request states, shared privacy and package checks.
- Database/infrastructure: no new resource, real profile table, evidence upload or migration.

## Sources and attachments

- Founder feedback, 2026-10-24: eligibility examples and backend-first business logic with schema/mock values now; revise remaining questions later.
- [Eligibility review](../product/leave-eligibility-review.md), [proposed backend contract](../contracts/leave-eligibility.md), [JSON schema](../contracts/leave-eligibility.schema.json), [policy-source register](../compliance/policy-sources.md).
- [Synthetic decision fixtures](../design/calendar-mock/dist/leave-eligibility.js); all person/scenario data is public fiction.

## Comments and decisions

- C-1 · 2026-10-24 · Codex: Requested clarification on literal demographic filters versus event/care factors. Layout work proceeds independently; unresolved eligibility remains To confirm and founder proposals are retained in the review list.
- C-2 · 2026-10-24 · Founder clarification: use current-profile gender/marital gates in frontend now; future events are registered later, with documents later still. Apply shared Greece country rules across companies for now, with company-level customization later. Updated mock/contract accordingly; remaining legal exceptions stay reviewable.
- C-3 · 2026-10-24 · Codex: Default personal choices omit known-ineligible types, matching the clarified request that marriage leave is not offered to married profiles. Show all keeps source rules inspectable with disabled request actions. Missing facts/unsupported countries and legal exceptions remain explicit To confirm; no future event registration is required in this mock.
- D-1 · 2026-10-24 · Founder direction: backend owns business logic later; model the expected boundary now with mock values.
- D-2 · 2026-10-24 · Engineering assumption, revisable: configure synthetic service responses with eligible/not-eligible/to-confirm; no frontend demographic evaluator, real profile collection or blanket legal exclusion.
- D-3 · 2026-10-24 · Founder clarification supersedes D-2's frontend-evaluation limitation: use a centralized provisional GR mock profile evaluator, explicit fictional profile values and backend-shaped decisions. Keep production legal interpretation/source conflicts separate. No upcoming-event prerequisite, real-profile collection, registration or upload implementation.

- C-4 · 2026-10-25 · Founder authorized commit and Azure dev deployment; preserve frontend-only publishing and verify the hosted revision before marking Released.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-24 | Codex and policy review agent / assistant recorded | Draft policy matrix, response schema, scoped synthetic decisions and fixture/package checks | Unknown | Founder request; contract/research/code sources above. Parallel duration unmeasured; UI layout time belongs to VAC-8. |
| W-2 | 2026-10-25 | Codex / assistant recorded | Record eligibility acceptance in the shared frontend-only dev release | Unknown | [Release evidence](../release-2026-10-25-calendar-eligibility.md). Shared release work belongs to VAC-8 W-2; not added as duplicate time. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded.

## History

- H-1 · 2026-10-24 · Codex: Created In progress; accepted catalogue/persona outputs inspected, policy conflict recorded and clarification requested.
- H-2 · 2026-10-24 · Codex: In progress → QA after founder clarification was applied, independent policy/source review, schema/fixture checks, request/privacy/browser acceptance and packaging regressions passed. No production backend rule or release claimed.

- H-3 · 2026-10-25 · Codex: QA → Released for Azure dev application revision `0ca66c9`, after hosted CI, frontend-only deployment, exact revision check, complete live browser acceptance and visual review passed. [Release evidence](../release-2026-10-25-calendar-eligibility.md).

## Verification and release

[Shared local acceptance](media/VAC-8/verification.md) records all 12 profiles, 360 schema-validated decisions, missing facts/unsupported country, identity binding, independently expected default choices, disabled/forged/stale-session requests, personal/shared privacy, exact asset packaging and nine smoke-helper regressions. CI now runs the schema validator using existing locked Angular AJV tooling. No new dependency or real endpoint is introduced. [Hosted release evidence](../release-2026-10-25-calendar-eligibility.md) records the exact Azure dev revision, successful CI/frontend-only deployment and complete live browser acceptance. Country-law interpretation, later company overrides and real server tenant-isolation/submit validation remain open.

## Open questions

See the [five-item policy review list](../product/leave-eligibility-review.md#open-questions-for-revision), including the founder/source conflict, applicable policy scope, unavailable-type presentation, override permissions and evidence/retention. Production unknown-case handling and decision expiry/request-context rules remain proposed in the contract.
