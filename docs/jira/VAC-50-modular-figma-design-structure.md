---
id: VAC-50
type: task
summary: Design focused Figma areas and clean workspace navigation
status: in-progress
created: 2026-11-15
updated: 2026-11-15
parent: null
depends_on: []
---

# VAC-50 — Design focused Figma areas and clean workspace navigation

![Task](badges/task.svg) **🔨 In progress** · Owner: Product Designer

## Description

Replace the existing Figma concept with a modular, high-level representation of the current Angular application. Establish pages/routes, shared shell, feature sections and lower-level reusable patterns before a separately requested detailed pass. The owner explicitly invited alternative hierarchies; alternatives remain PROPOSED.

Owner follow-up, 2026-11-15: make product areas easier to navigate in Figma; define clean URLs, auth/workspace hostnames, GUID-based resource links, a person/membership detail page and Help & feedback. The owner selected design/specification first and subsequently deferred Home, retaining Calendar as the landing screen.

## Scope

Initial three-page snapshot plus a focused reorganisation target using Start here, Product areas and Components, with top-level area Sections. Record current implementation and target designs separately, following accepted ADR-0005 ownership. New product direction is specified only; no Angular refactor, API change, DNS/auth provisioning, commit, push or deployment. Figma access currently rejects reads/writes due to the Starter MCP limit.

## Dependencies

None. Existing routes, templates, styles and accepted ADR-0005 are available. VAC-42 and VAC-46 are coordination references, not prerequisites.

## Acceptance scenarios

- [x] Given the current Angular application, when reviewing the route map, then login, calendar landing, leave, balances, people, assigned approvals and all five settings sections have explicit mappings and compatibility notes.
- [ ] Given a screen composition, when inspecting its layers, then shell and repeated feature/presentation elements are editable component instances with clear ownership.
- [x] Given alternative navigation hierarchies, when reviewing the overview, then current behavior and PROPOSED alternatives are visibly distinguished.
- [x] Given the first-pass scope, when reviewing the file, then detailed responsive/state work is explicitly deferred rather than claimed complete.
- [x] Given the privacy boundary, then only structural labels and fictional examples are used; personal leave and colleague availability remain separate. No runtime data/access path changes, so tenant-isolation execution is not applicable.
- [x] Given the owner-confirmed hosts and deferred Home clarification, then the specification uses auth.vacate.gr / vacate.gr, keeps Calendar as the landing screen and distinguishes proposed paths from implemented routes.
- [x] Given GUID-based resource links, then person/membership/request identities, route-state ownership, legacy URL migration and future foreign-company/assignment checks are specified without claiming runtime verification.
- [ ] Given restored Figma access, then focused area Sections and a Start index are applied; person/help anatomy and route labels are updated; instance links, bounds and rendered navigation pass inspection.

## Subtasks and responsibilities

- Product Designer: inventory, hierarchy, component composition and visual review.
- Frontend/architecture: trace actual sources and accepted ownership; do not claim target migration is implemented.
- Backend/database/infrastructure: Not applicable; design documentation only.

## Attachments and sources

- [Design structure and source map](../design/figma-structure.md).
- [Focused Figma reorganisation plan](../design/figma-focused-areas.md).
- [Workspace navigation and route specification](../product/workspace-navigation.md).
- [Figma file](https://www.figma.com/design/TORfMp9HPtio6OCOIkIRIQ/Vacate).
- [ADR-0005](../adr/0005-frontend-capability-architecture.md).
- [Routes](../../frontend/src/app/app.routes.ts), [workspace composition](../../frontend/src/app/features/workspace/workspace.html), [settings navigation](../../frontend/src/app/features/settings/settings-navigation.ts).
- [Product charter](../product/product-charter.md).

## Comments

- C1 · 2026-11-15 · Assistant / Product Designer: Owner authorised replacing the prior Figma content, starting high level, and proposing better structures. Detail work is a second step.
- C2 · 2026-11-15 · Assistant / Product Designer: Owner clarified that the organisation request concerns Figma, not a repository-folder restructure; selected specification/design before implementation and corrected the workspace hostname to vacate.gr. A later reply keeps Calendar as landing and defers Home.

## Decisions

- D1 · 2026-11-15 · Assistant / Product Designer: Figma organisation follows overview → reusable components → feature screens; code ownership is annotated rather than mirrored mechanically.
- D2 · 2026-11-15 · Current source evidence: Calendar is the signed-in landing screen; Profile/System live within Settings. A separate Home dashboard is PROPOSED only.
- D3 · 2026-11-15 · Owner-confirmed direction: focused product areas, auth.vacate.gr / vacate.gr, clean paths and GUID resource links, administrator person/membership detail and Help & feedback. Canonical direction is recorded in the product charter and linked navigation specification.
- D4 · 2026-11-15 · Owner's latest clarification: Home is a DEFERRED IDEA; Calendar remains the landing screen. This supersedes any intermediate plan to make Home the default.
- D5 · 2026-11-15 · Assistant recommendation: use three Figma pages with top-level focused Sections and index links within the current plan's page limit. Exact path spellings and open permissions/auth/feedback choices remain proposed details.

## Work log

- W1 · 2026-11-15 · Assistant recorded: source inspection, Figma discovery and structural design; duration unmeasured. Human actual: Unknown. Automation elapsed: not separately totalled.
- W2 · 2026-11-15 · Assistant recorded: created the modular file, inspected initial screenshots, corrected layout defects, recorded the Figma tool limit and checked local documentation; duration unmeasured. No time totals inferred.
- W3 · 2026-11-15 · Assistant recorded: refreshed source/permission evidence, checked Figma access, prepared focused Sections and clean-route/person-page specifications, and incorporated Calendar-first steering. Duration unmeasured; human actual Unknown. No overlapping totals inferred.

## History

- H1 · 2026-11-15 · Assistant / Product Designer: Created In progress for the authorised Figma structure task.
- H2 · 2026-11-15 · Assistant / Product Designer: In progress → QA after creation of the overview, 31 reusable components and 11 screen compositions. Final visual checks blocked by Starter-plan tool limit; not Done.
- H3 · 2026-11-15 · Assistant / Product Designer: QA → In progress for the owner's expanded focused-area/navigation design request. Specification work progresses; applying/verifying Figma changes requires restored external allowance. No implementation or release claim.

## Verification and release

Creation responses establish editable frames/text/instances, component/screen IDs and source mappings. Initial screenshots exposed sizing defects; targeted layout fixes and feature-action corrections were accepted. Final screenshots were rejected by Figma's Starter-plan MCP limit, confirmed with whoami. Post-correction visual inspection and full instance-link readback remain UNVERIFIED. See the design structure document for exact evidence and first-pass boundaries. Application builds/tests are not applicable to design-only changes. No release claim.

Local validation passed for new document/source links, unique issue IDs, QA/backlog metadata and inline dependency references/cycles. Scoped whitespace validation passed. A repository-wide whitespace check reported an existing trailing space in the unrelated modified docs/next-up.md; that edit was preserved.

Follow-up evidence: the first file-read attempt again returned the Starter MCP limit; whoami confirmed Starter. No Figma mutation was performed in this follow-up and no alternate access path bypassed the limit. The focused-area plan and route specification are local deliverables; the existing Figma snapshot and runtime remain unchanged by this follow-up. Local consistency/link/URL checks are recorded after validation; earlier QA metadata above describes the initial pass only.

Follow-up validation passed: local links across the charter/navigation/design/issue/backlog documents; new-document whitespace and scoped diff whitespace; unique issue IDs; current In progress summary/status matching the backlog; URL examples parsed without ampersands in path segments; GUID placeholder coverage; Calendar-first and deferred-Home assertions. These are documentation checks, not application or Figma acceptance tests.

## Open questions and follow-up

Pending: restore Figma access to apply/verify focused Sections and person/help views; confirm exact path spellings, administrator-editable account fields, approval visibility semantics, feedback delivery and cross-host auth/session design. Home is deferred rather than an immediate landing-page decision. Detailed states, mobile layouts and interactive prototype behavior remain second-step work.


### Owner-directed split · 2026-11-15

The focused Figma application and outstanding rendered/link verification now remain future Todo in [VAC-51](VAC-51-focused-figma-follow-up.md). Locally feasible Angular implementation is tracked separately in [VAC-52](VAC-52-angular-clean-navigation.md). This historical design record does not claim Figma verification or deployed behavior.
