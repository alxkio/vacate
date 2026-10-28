---
id: VAC-11
type: task
summary: Draft the user object and JSON Schema for product review
status: specification
created: 2026-10-26
updated: 2026-10-26
parent: null
depends_on: []
---

# VAC-11 — Draft the user object and JSON Schema for product review

![Task](badges/task.svg) **📝 Specification** · Owner: Unassigned

## Description

Founder request, 2026-10-26: make defining the user object the next step and create a draft schema. Provide a reviewable JSON Schema, fictional example, mapping from current mock fields and explicit open decisions.

## Scope

Draft documentation only. Preserve accepted unique company-email usernames and one-company mock/MVP scope. The founder's 2026-10-26 revisions confirm flat account facts with unknown false/zero defaults, married/sole-care exclusion, a nested company membership with GUID role references, retained employment fields, employer-recorded prior years and policy-minimum allocation/customization. Self-profile edits, target-company admin-only membership configuration and invitation-based membership assignment are confirmed. Membership is null before assignment; MVP permits at most one assigned company membership. Balance shape/period and remaining operational permissions remain proposals. No UI, migration, real employee data, legal rules or production permissions are introduced.

## Dependencies

None. Existing source files are available. Related context: [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) supplies the roster, [VAC-9](VAC-9-eligibility-contract-and-mock-decisions.md) the eligibility boundary, and [VAC-10](VAC-10-consolidate-angular-frontend.md) the current Angular location; these are coordination/source links, not new implementation blockers.

## Acceptance scenarios

- [x] Given existing mock fields and accepted account constraints, the draft documents mapping, required/unknown values and unaccepted choices.
- [x] Given a synthetic account with nested membership, the example and valid defaulted family values validate; malformed GUIDs/formats, legacy root company fields, extra fields, negative/fractional child counts and married/sole-care combinations are rejected.
- [x] Given employer prior service and balance customization, document years and policy-floor invariants with backend acceptance scenarios; distinguish structural validation from unimplemented policy comparisons.
- [x] Given a colleague profile, only username, email, names, gender, job title and company system role are allowed; family facts, membership/account status, employment details and balances are rejected. A synthetic colleague example validates.
- [x] Given a documentation-only scope, explain that schema validation cannot prove tenant isolation and specify future cross-company read/write/reference checks.
- [x] Given the founder's edit permissions, document the self-profile allowlist, target-company admin-only membership configuration, immutable derived balances, and unauthorized/mixed-payload acceptance scenarios.
- [x] Given an unassigned account, membership null validates without fabricated company fields; invitation-based assignment, same-company/team checks and no self/second-company assignment are documented. Precise invitation activation lifecycle remains open.
- [ ] Product lead reviews balance type/period, fractional-year precision, lifecycle, remaining privileged-read/account-management permissions and policy-update handling; independent privacy/security review remains pending. Confirmed membership/default/retained-field decisions are recorded below.

## Subtasks and responsibilities

- UX: Field grouping and unknown semantics documented; profile page implementation not applicable.
- UI: Not applicable; fixtures and application are unchanged.
- Backend: Document server invariants and future acceptance gates; no endpoint implementation.
- Database: Not applicable; persistence and migrations deferred.
- QA: Compile draft and validate positive/negative synthetic cases; check issue/backlog and links.
- Privacy/security: Review pending; author has documented boundaries without approving a production design.
- Infrastructure: Not applicable.

## Attachments and sources

- [Draft rationale, sources, questions and acceptance gates](../contracts/user.md).
- [JSON Schema](../contracts/user.schema.json), [assigned-user example](../contracts/user.example.json) and [unassigned-user example](../contracts/user-unassigned.example.json).
- [ADR-0001](../adr/0001-company-first-web-api.md) and [charter](../product/product-charter.md), 2026-10-20.

## Comments

- C-1 · 2026-10-26 · Codex: Delivered the requested draft; kept Specification while proposed fields and permissions await review. Synthetic profile values are not production policy.
- C-2 · 2026-10-26 · Codex: Revised draft 0.2 following founder feedback. C-1's nested aggregate proposal is superseded; no runtime fixture/evaluator migration is included. Suggested employment/calendar/policy fields and form-validation scenarios are documented for review.

- C-3 · 2026-10-26 · Codex: Revised to draft 0.3 after founder confirmation. Company=organization, single nested membership, GUID role references, false/zero family defaults, employer-entered priorService years and allocation floor replace earlier draft choices. Defaults are normalization requirements, not schema mutation. Existing evaluator and runtime remain unchanged.

- C-4 · 2026-10-26 · Codex: Recorded founder-confirmed self-profile updates and admin-only company membership configuration. JSON Schema descriptions document this boundary but do not claim to enforce authenticated permissions.

- C-5 · 2026-10-26 · Codex: Replaced the proposed directory projection with the founder's colleague-profile allowlist and added a fictional example. Email is derived from username; company role/title labels are resolved separately. Server authorization remains unimplemented.

- C-6 · 2026-10-26 · Codex: Recorded invitation-based membership assignment and added membership-null example. Invitation issuance/acceptance/activation semantics and initial admin bootstrap remain open; no delivery or onboarding implementation.

- C-7 · 2026-10-26 · Codex: Founder authorized the bounded settings implementation, tracked separately in [VAC-12](VAC-12-profile-and-membership-settings.md). Confirmed contract outputs are consumed; production invitation/authentication/policy decisions remain open. Implementation time/evidence belongs to VAC-12, not this drafting issue.

## Decisions

- D-1 · 2026-10-26 · Founder request: Draft the user schema as the next step. No approval of proposed fields or implementation is inferred.
- D-2 · 2026-10-26 · Codex proposal: Group account/employee/private mock profile and define a restricted directory projection; see the draft for assumptions and open choices.
- D-3 · 2026-10-26 · Founder instruction, supersedes D-2's nested shape: Flat account fields including dependent-child integer and married/sole-care exclusion. Per-company employee/admin system role is separate from job role. One membership per account for mock/MVP; future several-company membership and multiple job roles are deferred. Canonical direction recorded in [charter](../product/product-charter.md#founder-clarification--user-model-2026-10-26) and [ADR-0001](../adr/0001-company-first-web-api.md#founder-clarification--account-and-company-roles-2026-10-26).

- D-4 · 2026-10-26 · Founder instruction, supersedes earlier unknown-value and flat-company proposals: retain identity fields, default unknown family inputs to false/zero, move company/employment fields to membership, use GUID company/system/job-role IDs, retain suggested fields and add priorService years registered by employer at hire. Company and organization are the same. Default allocation follows qualifying policies; custom employer allocation cannot be lower. Canonical sources: charter and ADR-0001 membership/default/allocation clarifications. Annual-days balance representation remains an assumption.

- D-5 · 2026-10-26 · Founder instruction: Users can update their own name, gender, marital fact, dependent children and sole care; only target-company admins add/update membership attributes. Existing derived-balance and validation constraints continue to apply. Canonical decision: [charter](../product/product-charter.md#founder-clarification--profile-and-membership-editing-2026-10-26); details in [user contract](../contracts/user.md#confirmed-editing-permissions).

- D-6 · 2026-10-26 · Founder instruction: Other users' profiles expose only username, email, names, gender, job titles and company user role. No marital/children/sole-care data. This supersedes D-2's directory-field proposal. Canonical source: [charter](../product/product-charter.md#founder-clarification--colleague-profile-visibility-2026-10-26); [projection details and example](../contracts/user.md#identity-projection-and-migration-boundaries).

- D-7 · 2026-10-26 · Founder instruction: Membership follows an admin invitation to company/organization/team. Company=organization and one-company MVP scope remain. Canonical records: charter and ADR-0001 invitation clarifications; [assignment boundary](../contracts/user.md#invitation-based-membership-assignment).

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-10-26 | Codex / assistant recorded | Inspect sources, draft schema/example/rationale and verify | Unknown | Issue-specific duration not measured; artifacts linked above. |
| W-2 | 2026-10-26 | Codex / assistant recorded | Revise flat schema/example, record founder direction and proposed request-validation facts, verify | Unknown | Duration not measured; draft 0.2 artifacts and canonical clarifications linked above. |

| W-3 | 2026-10-26 | Codex / assistant recorded | Revise membership/default/service/balance draft, record founder decisions and verify structural cases | Unknown | Duration not measured; draft 0.3 artifacts and canonical clarifications. |

| W-4 | 2026-10-26 | Codex / assistant recorded | Document profile/membership editing decisions and authorization scenarios; verify references and schema | Unknown | Duration not measured; permission contract and charter clarification. |

| W-5 | 2026-10-26 | Codex / assistant recorded | Revise colleague projection/example, document visibility and verify leakage cases | Unknown | Duration not measured; projection schema, example and canonical sources. |

| W-6 | 2026-10-26 | Codex / assistant recorded | Document invitation assignment, nullable membership and unassigned example; verify schema/links | Unknown | Duration not measured; user contract, schema and canonical clarifications. |

Human actual: Unknown. Assistant duration: Unknown. Automation elapsed: not recorded. No estimate recorded.

## History

- H-1 · 2026-10-26 · Codex: Created in Specification for the founder-requested draft; product and privacy decisions remain open.
- H-2 · 2026-10-26 · Codex: Remains Specification after founder's shape/role revision; optional business columns and field-level permissions remain open.

- H-3 · 2026-10-26 · Codex: Remains Specification after membership/default/retained-field decisions; balance policy mechanics, authentication and permissions remain open.

- H-4 · 2026-10-26 · Codex: Remains Specification after editing permissions are confirmed; remaining policy/authentication/read-access questions are unchanged.

- H-5 · 2026-10-26 · Codex: Remains Specification after colleague visibility confirmation; backend enforcement and other open decisions remain pending.

- H-6 · 2026-10-26 · Codex: Remains Specification after invitation-assignment confirmation; activation/onboarding and prior open policy questions remain.

## Verification and release

Initial draft 0.1: schema compiled and synthetic aggregate/projection cases passed. Superseded by draft 0.2 verification: flat schema compiles with existing AJV/formats tooling; synthetic example and valid unknown/sole-care/zero-child cases pass. Married/sole-care combinations, malformed UUID/email/date, negative/fractional children/service, invalid system roles, nested legacy profile and extra secrets fail. Directory projection rejects account/family fields. Local links and backlog metadata/dependencies checked. Documentation only; no runtime isolation test, release or production approval.

Draft 0.3 supersedes the above 0.2 structural evidence. Full-record schema and single-membership example compile/validate with strict AJV/formats. Family defaults are annotations requiring backend normalization; missing full-record fields fail validation rather than silently filling. Invalid role/company GUIDs, root-level company aliases, old profile/marital fields, married+soleCare, negative/fractional children, negative service and invalid date/email fail. A policy minimum of null requires allocation/available null. Cross-field allocation minimum/equations and tenant isolation remain future backend gates, not claimed as schema checks. Local links and issue/backlog metadata checked.

Permission revision: schema descriptions, charter and contract reviewed for matching self-profile allowlist and company-scoped admin restriction. Existing structural validation cases rerun; local links and VAC-11/backlog metadata checked. Backend authorization scenarios are specified but unexecuted; no runtime permission enforcement is claimed.

Colleague projection revision supersedes earlier directory-case evidence: strict AJV compilation and synthetic colleague example pass; prohibited fields/aliases, malformed email, missing required name and unsupported role fail. Full-user structural cases remain valid. Local links, whitespace and unchanged issue/backlog metadata checked. Profile access/cache/company-isolation scenarios remain specifications, not executed backend authorization tests.

Invitation revision: strict AJV validates assigned/unassigned examples; omitted membership, empty membership, arrays/multiple memberships and invalid team/company/role references fail structural validation. Existing full-record and colleague leakage cases pass. Local links, issue/backlog metadata and whitespace checked. Invitation delivery/acceptance, account binding, authorization and concurrent assignment tests remain unimplemented.

## Open questions and follow-up

See the six [product review questions](../contracts/user.md#open-questions-for-product-review): balance shape/period/recalculation, prior-service precision, permissions, account lifecycle/authentication, policy-specific facts and deferred multi-company details. No further issues created.
