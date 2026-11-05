---
id: VAC-37
type: task
summary: Review frontend architecture and remove unused scaffolding
status: done
created: 2026-11-05
updated: 2026-11-05
parent: null
depends_on: []
---

# VAC-37 — Review frontend architecture and remove unused scaffolding

![Task](badges/task.svg) **✅ Done** · Owner: Assistant review; product lead accepted 2026-11-05

## Description

Review the actual Angular working tree for expansion into leave, time sheets, attendance/presence and work locations. Produce a dedicated frontend ADR with evidence, ownership/dependency rules and an incremental migration/verification plan, without using ADR-0003 as a frontend layout constraint.

## Scope

Static architecture review, concise accepted ADR with three reproducible architecture diagrams, and the product-lead-authorized removal of nine unused placeholder route/component/shell files and eight empty directory markers. Active application behavior, API, database, dependencies, deployment and future feature implementation are excluded. Existing pending application/tooling changes are inspected and preserved. The related role correction is recorded under VAC-21.

## Dependencies

None. Related coordination: [VAC-21](VAC-21-codex-agent-context.md) supplies the corrected frontend role, explicitly read during this session; it is not a blocking implementation prerequisite. Product lead's 2026-11-05 direction authorizes the review independently of story-wide VAC-21 completion.

## Acceptance scenarios

- [x] Given the current working tree, active route/import/state/transport evidence identifies prioritized structural findings and distinguishes unused scaffolding from implemented features.
- [x] Given a frontend-specific ADR, it separates proposed architecture from accepted backend decisions and does not claim refactoring is already approved.
- [x] Given future time/presence/location features, proposed boundaries preserve their distinct meanings and expose unresolved product questions.
- [x] Given migration recommendations, they specify ownership, allowed dependencies, state/reset lifetimes, legacy navigation and appropriate verification.
- [x] Tenant isolation is addressed in future implementation scenarios. Placeholder removal changes no runtime access/data paths; no new isolation test is applicable.
- [x] Given the unused placeholders are removed, active routes and feature implementations remain unchanged, reference checks find no remaining imports/selectors, both TypeScript projects compile, existing frontend tests and production build pass.

## Subtasks and responsibilities

- Frontend/architecture: inspect active implementation, compare ownership options and draft the frontend ADR.
- Repository steward: register the ADR and maintain issue/backlog links and status.
- QA: documentation/reference and issue consistency checks plus both TypeScript projects, existing frontend tests and production build for placeholder removal; product lead architecture review accepted 2026-11-05.
- UX/UI behavior changes, backend, database and infrastructure: Not applicable.

## Attachments and sources

- Product lead's 2026-11-05 instructions in this session.
- [ADR-0005 and architecture findings](../adr/0005-frontend-capability-architecture.md).
- [Frontend role](../../.github/agents/frontend-engineer.agent.md), [frontend README](../../frontend/README.md), [product charter](../product/product-charter.md).
- Official Angular references and dated source-inspection links are recorded in ADR-0005.

## Comments

C1 · 2026-11-05 · Assistant: reviewed the pending working tree, not only HEAD. Main findings are shared workspace state/refresh ownership, one workspace routing boundary, mixed DTO/read/view models, cross-feature editor reuse, fixture-coupled calendar selection, duplicate scaffold and global styling/import coupling. Detailed evidence and tradeoffs are in ADR-0005.

C2 · 2026-11-05 · Assistant: shortened ADR-0005, retained current evidence and ownership/reset/navigation constraints, and added a separate PrimeNG evaluation proposal. Removed nine unreferenced heading/route/shell files and eight empty directory markers; active feature code and route registrations are preserved.

C3 · 2026-11-05 · Assistant: created three original architecture pictures (domain/subdomain map, capability matrix, Angular folder/dependency structure), with editable SVGs, PNG exports and a dependency-free generator in [the visual companion](../design/architecture/README.md). Future capabilities, unavailable leave transactions and proposed architecture are labelled explicitly. The article informs diagram vocabulary, not new tooling or accepted product boundaries.

C4 · 2026-11-05 · Product lead / assistant: embedded the three existing editable SVGs directly in ADR-0005 as requested, with descriptive alternatives and relative paths. Verified that each embedded SVG target exists and parses; architecture status and application behavior are unchanged.

## Decisions

D1 · 2026-11-05 · Product lead: frontend architecture needs its own ADR; disregard ADR-0003 as frontend design authority. Assistant proposal: capability modules with owned data access/state/models, a small core and a routed composition shell. ADR-0005 remains PROPOSED; no application migration is authorized by this record.

D2 · 2026-11-05 · Product lead: remove the identified unused scaffolding and update/shorten the ADR. This extends D1 with bounded source cleanup, not acceptance of the full architecture or authorization to install PrimeNG.

D3 · 2026-11-05 · Product lead: requested pictures like the Angular Architects strategic-design article for Vacate domains/subdomains and Angular architecture. Documentation-only visual scope; no acceptance of candidate bounded contexts or dependency installations.

D4 · 2026-11-05 · Product lead: approved ADR-0005. On verified migration completion, treat baseline findings and transition instructions as stale: remove them from the ADR and update diagrams to describe the standing architecture, preserving history/evidence in issues. Architecture acceptance does not select PrimeNG or approve future product workflows. This supersedes earlier pending-acceptance statements.

## Work log

W1 · 2026-11-05 · Assistant recorded · Review frontend sources and Angular primary documentation, draft ADR/findings and migration checks, register issue and validate documentation · Duration: Unknown (not measured); human actual: Unknown. Role-guidance work is recorded only in VAC-21. No time totals inferred.

W2 · 2026-11-05 · Assistant recorded · Confirm placeholder references, delete nine unused source files and eight empty directory markers, shorten ADR and record UI-library evaluation and cleanup verification · Duration: Unknown (not measured); human actual: Unknown. Automation timings are reported separately where available.

W3 · 2026-11-05 · Assistant recorded · Read the referenced article, create SVG diagrams and generator, export PNGs, link the ADR and inspect visual/document consistency · Duration: Unknown (not measured); human actual: Unknown. No time totals inferred.

W4 · 2026-11-05 · Assistant recorded · Embed existing SVG diagrams in ADR-0005 and verify image references/formatting · Duration: Unknown (not measured); human actual: Unknown.

W5 · 2026-11-05 · Assistant recorded · Record ADR acceptance, mark the Angular paragraph in ADR-0003 superseded, synchronize index/issue/backlog and diagram status, and add the post-migration documentation cleanup requirement · Duration: Unknown (not measured); human actual: Unknown.

## History

H1 · 2026-11-05 · Assistant · Created in QA for the completed static review/draft delivery; product lead architecture acceptance is pending. This is not a Done/release claim.

H2 · 2026-11-05 · Assistant · Scope extended with explicitly authorized unused-scaffold cleanup; remains QA pending verification and architecture review.

H3 · 2026-11-05 · Assistant · Done after product lead architecture approval, completed bounded cleanup and recorded verification. Broader migration is separate work; no release/deployment claim.

## Verification and release

Static inspection traced route loading, feature imports, state/refresh methods, shared types, resource clients, reference adapters and styles. Documentation formatting, local references, issue/backlog metadata and dependency consistency checked. The initial review changed no application sources and ran no build/tests. The subsequent authorized cleanup removes unused sources only; verification results follow below. No browser/API tests or bundle measurements ran for this cleanup. No deployment or fresh-session instruction-discovery claim.

Cleanup verification · 2026-11-05:

- All five unused directory trees removed: nine TypeScript files and eight empty `.gitkeep` markers. No remaining source imports/selectors; active route registrations and feature implementations unchanged by this cleanup.
- App and spec TypeScript projects compiled successfully.
- Production Angular build passed (reported build duration: 21.513 seconds).
- Existing Vitest suite passed: 13 files, 57 tests (reported test duration: 7.93 seconds; test build: 6.872 seconds). These are separate automation measurements, not assistant/human time totals.
- The initial test attempt hit the documented older-macOS embedded Sass incompatibility and was stopped; the successful rerun used `NG_BUILD_SASS_EMBEDDED=0`, with build worker limits also applied.
- Changed-document relative links, issue/backlog summary/status/dependencies, removal/reference assertions, Markdown formatting and `git diff --check` passed.
- No API/server/contracts, UI behavior or dependencies changed. No new tenant test is applicable to unreachable-file deletion. Browser/API acceptance and deployment were not run; broader architecture acceptance remains pending.

Diagram verification · 2026-11-05: three SVGs parsed successfully with titles/descriptions; Python generator syntax checked; all image/document links and expected PNG dimensions passed. Visually inspected all PNGs, corrected directory indentation in the structure SVG and re-exported it. PNGs are 3120 pixels wide (domain map: 2440 high; matrix: 2300; structure: 2520). Markdown formatting and diff whitespace checks passed. Local Chrome export uses bounded shutdown because this host can leave Chrome running after writing its screenshot. Documentation-only scope; no application/API/tenant-data changes or new runtime tests.

Acceptance verification · 2026-11-05: ADR-0005 and ADR index record ACCEPTED; ADR-0003 identifies only its Angular layout paragraph as superseded. VAC-37 metadata/display and backlog record Done. Diagram sources/SVGs use accepted-target labels; future candidates remain explicit. Relative links, SVG XML and diff whitespace checks passed. No application code changed in the acceptance update.

## Open questions and follow-up

ADR-0005 is accepted. Prioritization and execution of the broader refactor remain open. Its completion must remove stale baseline/transition content from the ADR and update the diagrams; retain migration evidence in issue history. Presence semantics, capability enablement/permissions and concrete time-sheet/location workflows remain product questions, listed in the ADR. No future implementation issues are created here.
