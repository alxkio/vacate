---
id: VAC-52
type: task
summary: Implement clean Angular routes and GUID-based detail navigation
status: qa
created: 2026-11-15
updated: 2026-11-15
parent: null
depends_on: []
---

# VAC-52 — Implement clean Angular routes and GUID-based detail navigation

![Task](badges/task.svg) **🔍 QA** · Owner: Frontend Engineer

## Description and scope

Implement the locally feasible [navigation design](../product/workspace-navigation.md) in Angular using existing API contracts: Calendar landing, clean feature/settings paths, GUID person/membership/request links, Help & feedback content and compatibility navigation. Preserve state, history, session recovery and company/assignment access. Other people's identity fields remain read-only because the current API has no approved admin profile-edit contract; membership uses existing authorised controls. No new backend permissions, API endpoints, DNS/custom-domain/auth-origin deployment or Home page. Commit, branch push and PR creation are authorised by the owner; merge and deployment remain outside scope.

## Dependencies

None. Accepted ADR-0005, the route specification and existing APIs are available. VAC-50 supplies design context; VAC-51 is independently deferred Figma work, not a prerequisite.

## Acceptance scenarios

- [x] Calendar is the root/default; clean routes and old bookmarks preserve appropriate state through reload and browser history.
- [x] Login/session expiry resumes approved clean GUID destinations and rejects unsafe return URLs.
- [x] People links identify records with public GUIDs. Same-company administrators can open person detail and save existing membership fields; foreign/invalid/mismatched records and employees cannot expose private detail.
- [x] Own request and assigned approval detail links retain ownership/assignment checks and actionable recovery.
- [x] Settings paths select only API-permitted scopes; Help has honest feedback availability and usable narrow-screen layouts. Native keyboard/screen-reader verification remains a review gate.
- [x] Focused tests, both TypeScript projects, production build and applicable paired browser acceptance are recorded, with skipped runtime gates named.

## Subtasks and responsibilities

Frontend owns routes/views and tests; Product Designer preserves existing visual language; QA validates navigation, denial, history and responsive behavior. Backend/database are unaffected: existing contracts remain authoritative. Infrastructure/custom domains remain future work.

## Attachments and sources

- [ADR-0005](../adr/0005-frontend-capability-architecture.md), [product charter](../product/product-charter.md), [navigation specification](../product/workspace-navigation.md).
- [VAC-51](VAC-51-focused-figma-follow-up.md), [current API contract](../contracts/api.md).

## Comments

- C1 · 2026-11-15 · Owner: implement what can be done locally, starting with Angular; keep blocked Figma as future Todo.
- C2 · 2026-11-15 · Owner correction: login stays at `baseUrl/login` until the custom domain is available. Confirmed existing route and session-navigation helper already use same-origin `/login`; clarified the canonical specification and charter. No runtime code change required.
- C3 · 2026-11-15 · Owner: commit the ready changes and create a PR. Local acceptance evidence supports review readiness; retain QA status and outstanding gates.
- C4 · 2026-11-15 · Owner reported PR browser failure. Reproduced history-marker lookup failure and then fixed exposed cross-account Calendar scope restoration. See appended [regression evidence](media/VAC-52/verification.md#pr-10-history-regression--2026-11-15).

## Decisions

- D1 · 2026-11-15 · Assistant: reuse existing authorised API controls rather than inventing another-person profile permissions or a nonfunctional feedback submission.

## Work log

- W1 · 2026-11-15 · Assistant recorded: source/contract inspection and implementation; duration unmeasured. Human actual Unknown.
- W2 · 2026-11-15 · Assistant recorded: implementation, browser regression corrections, local verification and evidence documentation; duration unmeasured. Automation measurements are not aggregated.
- W3 · 2026-11-15 · Assistant recorded: PR history diagnosis, browser reproduction, owner-scoped route correction and regression verification; duration unmeasured. Human actual Unknown.
- W4 · 2026-11-15 · Assistant recorded: broader browser regression found discarded balance presentation state; extracted leave-owned actor/company/session state and verified route retention/isolation. Duration unmeasured.

- W5 · 2026-11-15 · Assistant recorded: diagnosed separate Chrome native-input failure from CI logs, retried unchanged job once, isolated browser password UI in a disposable test profile and passed local trusted-input acceptance. Linux CI remains the verification gate; duration unmeasured.

## History

- H1 · 2026-11-15 · Assistant: created In progress for explicitly authorised implementation.
- H2 · 2026-11-15 · Assistant: In progress → QA after local implementation and paired acceptance; owner requested dedicated branch `VAC-52-clean-angular-navigation`. No commit/push/deployment.

## Verification and release

[Local verification](media/VAC-52/verification.md): 112 unit tests, both TypeScript projects, production build, fixture/contract scripts and clean-route, navigation/history and session-recovery browser journeys passed. Responsive screenshots are attached. SQL-provider, deployed/custom-domain, full default and native keyboard/screen-reader checks were not run. QA status indicates review readiness, not release approval.

## Open questions and follow-up

Other-person account editable fields/API permission; feedback delivery; cross-host auth and custom domains; independent Figma verification. None authorises a fake save or deployment.


## Linked owner-feedback subtask · 2026-11-15

Follow the [VAC-42 lean-page refinement](VAC-42-implemented-page-design-review.md#owner-feedback-subtask--lean-page-refinement--2026-11-15). New route acceptance: Calendar URLs contain no selected `date`, while entry-owned history/session state restores the period on reload and Back/Forward; legacy dates are accepted then removed. Default `/people` omits `scope=org`; nondefault scope/group/year state is retained only where relevant. Preserve public-GUID person/membership/leave pages, current `baseUrl/login`, Calendar landing and actor/company/assignment denials. No duplicate issue or runtime SQL write is required.

2026-11-16 local verification: [lean-page evidence and rendered samples](media/VAC-52/lean-pages-verification.md), including the [55-operation Angular/API parameter audit](media/VAC-52/route-parameter-audit.md). Complete browser/trusted-keyboard regression and 123 Angular tests passed with build/types/schema checks. No API, database, deployment or issue-metadata/backlog change.

Owner then explicitly requested local QA, commit and push. Fresh tests/build/types passed. PR #10 is already merged, so the reviewed follow-up is prepared on `VAC-52-lean-page-refinements`; unrelated local notes and separate PR #9 database work are excluded. No merge or deployment is requested. Assistant work unmeasured; human actual Unknown. [Commit preparation and QA scope](media/VAC-52/lean-pages-verification.md#commit-preparation--2026-11-16).
