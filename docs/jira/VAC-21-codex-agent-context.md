---
id: VAC-21
type: story
summary: Engineer and maintain repository AI context
status: in-progress
created: 2026-10-30
updated: 2026-10-31
parent: null
depends_on: []
---

# VAC-21 — Engineer and maintain repository AI context

![Story](badges/story.svg) **🔨 In progress** · Owner: Assistant implementation; product lead review pending

## Description

As the repository maintainer, I want the repository's AI context reviewed, corrected and extended as needed, so that agents receive accurate, discoverable guidance consistent with accepted decisions, current code and the authorized task.

This covers context engineering and re-engineering across repository instructions, role profiles, skills, manual prompts and supporting documentation. The initial iteration normalized the role profiles and Codex routing; those changes and their evidence remain part of this story. Preserve the Markdown-only setup and the source-of-truth order in root AGENTS.md.

## Scope

- Review repository AI context for correctness, conflicting instructions, stale assumptions, missing guidance, unnecessary duplication and discovery/routing gaps.
- Fix or restructure existing instructions, role profiles, skills and prompts; add context needed for authorized work, with clear scope and references to canonical decisions.
- Keep context maps, links, prerequisites and verification evidence aligned with the repository and the supported client behavior. Distinguish static validation from observed session behavior.
- For context-only work, inspect the working tree and create or continue a dedicated branch using the story key and a hyphenated description of at most four words. Current branch: `VAC-21-repository-context-engineering`.
- Bound each iteration by recorded review findings and requested additions. Move to QA when those items are resolved or explicitly deferred by the product lead and the applicable checks pass; future context work does not make completion an indefinite maintenance obligation.

Application behavior, product permissions, API/schema changes, runtime dependencies, tool installation, external operations and deployment are outside this story's scope. No commits, pushes or agent spawning are authorized by the story.

## Dependencies

None. ADR-0002/0003, current code/manifests/workflows and official Codex documentation supply evidence; related VAC-20 is not an implementation prerequisite.

## Acceptance scenarios

- [x] Given context-only pending work, a dedicated branch uses the story key and a description of at most four words, preserving the existing working tree.
- [ ] Given a context review, findings identify affected sources and fixes or proposed additions; unresolved items are explicit and dispositioned before the iteration reaches QA.
- [ ] Given context that is fixed or added, its scope, prerequisites, source precedence and loading route agree with the repository; relevant links, metadata and examples are validated.
- [ ] Given the completed iteration, a final review records checks, limitations and any product-lead deferrals without claiming unobserved client behavior.

Completed initial work and testing-skill adaptation:

- [x] Given any role profile, its YAML header closes before a normal Markdown body and uses the same fields as the reference; no hidden `instructions` body or unsupported `mode` remains.
- [x] Given the product lead's Markdown-only preference, no `.codex` directory/TOML definitions remain; root instructions direct Codex to the existing role profiles without claiming native custom-agent registration.
- [x] Given backend, frontend, test, infra or product paths, root routing points to matching actual scopes and shared source precedence remains intact.
- [x] Given the review, actual runtime layers/frameworks and historical/unimplemented material are distinguished, with missing APM/provider infrastructure reported as absent rather than assumed.
- [x] Links, profile/root scope consistency and issue/backlog metadata pass static verification; client runtime discovery is explicitly labelled unverified until reload/use.
- [x] Tenant isolation: not exercised by this context-only task; no runtime authorization, employee data, transport contract or lifecycle behavior changes.
- [x] Given the product lead's 2026-10-31 request, the local .NET testing skill uses repository prerequisites, NUnit examples, existing adapter/Functions-host checks and acceptance/isolation standards without unavailable companion skills.

## Subtasks and responsibilities

- Repository steward: review, fix and add instructions, Markdown profiles, skills, prompts, routing and documentation; maintain branch/issue evidence.
- Architecture/QA: compare context with existing layers, manifests, tests and workflows; validate references, consistency and discovery limits.
- UI/backend/database: Not applicable; application files and dependencies unchanged.

## Attachments and sources

- Product lead instruction in this session, 2026-10-30.
- Product lead direction in this session, 2026-10-31: adapt the testing skill, broaden VAC-21 to repository context engineering/re-engineering, and use a dedicated story branch for context-only work.
- [AI context review](../ai-context.md), [profile catalog](../../.github/agents/README.md), [root instructions](../../AGENTS.md).
- [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md), [ADR-0003](../adr/0003-domain-and-application-services.md), [charter](../product/product-charter.md).
- Official Codex documentation linked and dated in the context review.

## Comments

C1 · 2026-10-30 · Assistant: inspection found YAML-wrapped instructions, nonexistent scope paths, old stack/test assumptions, an empty branding profile and an audit prompt assuming absent APM infrastructure. Root AGENTS.md requires no frontmatter; Codex named custom agents use standalone TOML in `.codex/agents/`. Installed client discovery after reload has not been verified.

C2 · 2026-10-30 · Assistant: all seven headers parse with the installed Prettier YAML parser; native files parse with Python tomllib and contain only the three required fields. Scope/root parity, six representative path mappings, links, source precedence, instruction size and the full issue/backlog dependency audit pass. Role Markdown formatting and git diff whitespace checks pass. Application sources and build inputs are unchanged.

C3 · 2026-10-30 · Assistant: the product lead prefers Markdown and asked to avoid the .codex folder/TOML files. Removed the seven newly created native definitions, retained root-to-profile routing and updated all active documentation. Earlier native-format verification in C2/H2 records the superseded intermediate approach, not the final setup.

C4 · 2026-10-31 · Assistant: following the context review, the product lead authorized adapting the [local .NET testing skill](../../.github/skills/dotnet-testing-strategy/SKILL.md) to Vacate standards. Replaced unavailable companion-skill prerequisites with repository references; adapted examples to NUnit, existing test projects and Functions adapters; clarified real-host/paired acceptance, tenant isolation, lifecycle and evidence boundaries. No application or dependency changes.

C5 · 2026-10-31 · Assistant: the product lead broadened VAC-21 from the initial profile-alignment task to a story covering reviewing, fixing and adding repository context. Inspection found only context changes and supporting documentation in the working tree. Created `VAC-21-repository-context-engineering` from local `master`, preserving pending files. Existing review findings about API-skill validation guidance and skill loading routes remain unresolved; this scope update does not claim they are fixed.

## Decisions

D1 · 2026-10-30 · Assistant implementation choice within requested scope: canonical Markdown role bodies plus thin native TOML definitions; explicit root path routing rather than unsupported metadata. Keep inherited session settings and existing issue skill location.

D2 · 2026-10-30 · Assistant: accepted ADRs and actual code replace historical active role prescriptions; product/security behavior is not changed by this cleanup. No independent review/release claim.

D3 · 2026-10-30 · Product lead / assistant implementation: supersede D1's native TOML addition. Use root AGENTS.md and seven Markdown profiles only; no native named-agent registration is required or claimed.

D4 · 2026-10-31 · Product lead authorization / assistant implementation: specialize the existing .NET testing skill in place using accepted ADR-0003 and backend/QA standards. No companion-skill installation, test-framework change or discovery/configuration change is included.

D5 · 2026-10-31 · Product lead: broaden VAC-21 to repository context engineering/re-engineering, including reviewing, fixing and adding context. Context-only work uses a dedicated branch named with its story key and a short description (at most four words). This supersedes the original narrow task scope; the stable issue key/file and prior history are retained. The canonical branch convention is recorded in root AGENTS.md.

## Work log

W1 · 2026-10-30 · Assistant recorded · Inspect official discovery rules and repository context/code, normalize profiles, add native definitions/root routing and document findings · Duration: Unknown (not measured); human actual: Unknown. Evidence: linked context review and source changes.

W2 · 2026-10-30 · Assistant recorded · Simplify to the requested Markdown-only setup, remove optional native definitions and revalidate routing/docs · Duration: Unknown (not measured); human actual: Unknown.

W3 · 2026-10-31 · Assistant recorded · Adapt .NET testing skill prerequisites, examples and verification guidance; validate formatting, YAML and local references · Duration: Unknown (not measured); human actual: Unknown. Evidence: C4 and verification below.

W4 · 2026-10-31 · Assistant recorded · Broaden story scope and acceptance, align backlog/context guide/root branch convention, create context branch and verify metadata/links · Duration: Unknown (not measured); human actual: Unknown. Evidence: C5, D5 and branch/verification records.

## History

H1 · 2026-10-30 · Assistant · Created In progress for the authorized repository context cleanup.

H2 · 2026-10-30 · Assistant · Moved to QA after static configuration/format, path mapping, link and issue audits passed; installed-client discovery after reload and user review remain pending.

H3 · 2026-10-30 · Assistant · Remains QA after the requested Markdown-only simplification; shared source precedence and code/role scopes are unchanged.

H4 · 2026-10-31 · Assistant · Remains QA after the authorized testing-skill adaptation; product lead review and fresh-session behavior remain pending. Backlog summary, type, status and dependencies are unchanged.

H5 · 2026-10-31 · Assistant · Changed Task to Story and moved QA back to In progress for the product lead's broader context-engineering scope and unresolved review findings. Updated backlog type, summary and status in the same change; direct dependencies remain empty.

## Verification and release

Final Markdown-only validation passed: all seven YAML headers parse; normal Markdown bodies, root/profile scope parity, existing path matches, links and issue/backlog status agree. The .codex directory and all generated TOML files are absent. Role/prompt formatting and whitespace checks pass. Application, infrastructure, dependency and test sources are unchanged; builds/tests are not required for instruction-only changes. A fresh session's instruction loading is not verified; no release/deployment or native named-agent registration is claimed.

2026-10-31 testing-skill validation: Prettier formatting and its YAML parser passed; all 15 skill-relative references resolve. Static inspection confirms missing companion-skill references and xUnit/mock-library examples were removed, and the NUnit example follows existing domain APIs. The bundled skill-creator validator could not run because PyYAML is unavailable; no dependency was installed. No application tests, real-host/browser checks or tenant-isolation tests ran for these instruction-only changes. Automatic skill discovery and independent behavioral evaluation remain UNVERIFIED.

2026-10-31 story/branch update validation: story YAML parses; summary/type/status agree across metadata, heading/badge and backlog. All 90 relative links in the four edited documents resolve; 20 real issue IDs are unique and their dependency graph has no missing targets or cycles. Git confirms the current branch is `VAC-21-repository-context-engineering` (three description words); `git diff --check` passes. Pending context work is preserved and uncommitted. Application/API/frontend behavior and build inputs are unaffected, so no application or tenant-isolation tests ran. These static checks do not complete the broader story's pending acceptance review.

## Open questions and follow-up

Current iteration still needs a disposition for the review findings on API-skill validation guidance versus ADR-0003 and the loading routes for the three added skills. These are recorded findings, not completed fixes. Fresh-session routing and automatic skill discovery remain UNVERIFIED; after reloading, check the applicable Markdown profiles for representative backend/frontend paths. No follow-up issue created and no additional product decision is made by this story rewrite.
