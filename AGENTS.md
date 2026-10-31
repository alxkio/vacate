# Vacate agent guide

## Purpose

Use agents to improve evidence, specifications, implementation, and verification without turning assumptions into product decisions.

## Source-of-truth order

1. Accepted ADRs in `docs/adr/`
2. `docs/product/product-charter.md` and explicitly accepted product documents
3. Versioned policy sources in `docs/compliance/policy-sources.md`
4. Existing reference material (`domain.md`, `TechChoices.md`, market-research draft)

If sources conflict, do not silently select one. Record an `OPEN QUESTION` in the relevant document and ask the product lead.

## Codex discovery and scoped role guidance

This root `AGENTS.md` covers the entire repository (`**/*`, including root files and hidden configuration). Codex discovers it by directory ancestry; it does not need YAML `applyTo` or `glob` frontmatter. Read any applicable nested `AGENTS.md`/`AGENTS.override.md` when present. Start a new session after changing instruction/configuration files to reload discovery.

Before reviewing or editing a path, read the relevant role profiles from this table. Patterns are relative to the repository root; `**` includes nested paths. Multiple rows may apply. These are explicit reading instructions, not a Codex glob-loader setting. Read only relevant profiles; selecting a role does not require spawning another agent or grant additional permissions.

| Paths / globs | Role profile |
|---|---|
| `api/**`, `infra/**`, `.github/workflows/**`, `docs/adr/**`, `docs/contracts/**`, `TechChoices.md`, `domain.md` | [Enterprise Architect](.github/agents/enterprise-architect.agent.md) |
| `api/**`, `docs/contracts/**` | [Software Engineer](.github/agents/software-engineer.agent.md) |
| `frontend/**`, `docs/contracts/**` | [Frontend Engineer](.github/agents/frontend-engineer.agent.md) |
| `frontend/src/app/features/**`, `frontend/src/app/shared/**`, `frontend/src/styles.scss`, `docs/design/**` | [UI Architect](.github/agents/ui-architect.agent.md) |
| `api/tests/**`, `frontend/**/*.spec.ts`, `frontend/testing/**`, `frontend/verify*.mjs`, `scripts/verify-api.py`, `scripts/cloud-smoke.py`, `scripts/test_cloud_smoke.py`, `.github/workflows/**`, `docs/jira/media/**` | [QA Engineer](.github/agents/qa-engineer.agent.md) |
| `docs/product/**`, `docs/domain/**`, `docs/compliance/**`, `docs/jira/**`, `domain.md`, `.github/prompts/market_analysis.md` | [Product Owner](.github/agents/product-owner.agent.md) |
| `docs/design/**`, `frontend/public/**/*.svg`, `frontend/public/**/*.ico`, `frontend/src/styles.scss` | [Branding Specialist](.github/agents/branding-specialist.agent.md) |

This repository uses Markdown role guidance only. The root instructions explicitly direct Codex to read matching `.github/agents/*.agent.md` profiles. Their `applyTo` lists are descriptive scope metadata, not an automatic Codex loader. Keep profile metadata and this routing table aligned. No native named-agent registration or separate configuration folder is required for this approach.

For context/configuration changes (`AGENTS.md`, `.github/agents/**`, `.github/skills/**`, `.github/prompts/**`), read the [context guide](docs/ai-context.md) and check paths, supported fields, source precedence and loading behavior. Use the existing issue skill for issue work. Historical/manual prompts are not global instructions. No repository APM package installation or provider transform is implied by these files.

For context-only work, inspect the working tree and create or continue a dedicated branch named `<story-key>-<short-description>`, using at most four words in the hyphenated description. [VAC-21](docs/jira/VAC-21-codex-agent-context.md) covers repository context engineering and re-engineering; its current branch is `VAC-21-repository-context-engineering`. Preserve pending changes and do not include unrelated application work in the context branch. This branch convention does not authorize commits, pushes or deployment.

## Agent roles

These are responsibility boundaries, not additional configured custom-agent names. The scoped Markdown profiles are listed above.

| Role | Owns | Must not do |
|---|---|---|
| Product researcher | Discovery evidence, competitor records, interview synthesis | Present unverified market claims as fact |
| Policy researcher | Official jurisdiction sources, effective dates, confidence labels | Give legal advice or encode unsupported rules |
| Domain architect | Glossary, scenarios, invariants, policy/version boundaries | Implement legal-policy rules without an approved source |
| Engineer | Accepted stories, ADRs, tests, migrations | Expand MVP scope without a product decision |
| Privacy/security reviewer | Data map, retention decisions, authorisation and abuse cases | Approve its own implementation without review |
| QA/release reviewer | Critical journeys, regression coverage, release evidence | Treat a passing unit test as full release approval |
| Repository steward | Documentation links, decision status, prompt quality | Invent missing agent/tool configuration |

## Working rules

- Label uncertain content as `ASSUMPTION`, `OPEN QUESTION`, or `UNVERIFIED`.
- Cite the source and effective date for market, product, pricing, and legal claims.
- Absence of evidence is a finding, not an invitation to infer certainty.
- Treat employee leave, sickness, and identity data as personal data. Minimise it.
- Follow [ADR-0003](docs/adr/0003-domain-and-application-services.md): typed domain invariants, application use-case services, repository ports and Infrastructure adapters, thin HTTP endpoints, and frontend feature/resource services. Keep development fixtures out of domain/endpoint logic; do not create parallel demo application folders.
- Keep code human-readable: one statement per line, one blank line between method/function declarations, consistent spaces and braces, and short comments explaining non-obvious intent. Format changed code before verification.
- Every implementation change needs an acceptance scenario and tenant-isolation test where applicable.
- For product changes, update API contracts/server behavior and frontend calls/views together where applicable. Verify both sides, including errors, authorization, tenant isolation and lifecycle timestamps; explicitly explain a side that is unaffected. New account, membership and organization/structure records use server-owned UTC createdAt/updatedAt and nullable deleteRequestedAt/deletedAt. Never treat soft deletion as GDPR erasure.

## Issues and backlog

Use [the issue workflow](docs/jira/README.md) for product stories, bugs, epics and tasks. Apply the repository [vacate-issues skill](.github/skills/vacate-issues/SKILL.md) when creating, updating or implementing an issue. Read the relevant issue before implementation; create or link one for material product work and keep its status, decisions, verification and work log current. Update [Product-Backlog.md](docs/jira/Product-Backlog.md) in the same change whenever an issue is created or its summary, type, status or dependencies change. Keep direct prerequisites in issue `depends_on` metadata and explain their required output; distinguish coordination links and check for cycles. Preserve the single retrospective story requested for existing work; add future work only when requested or necessary for the authorised task.

Issue notes cannot override the source-of-truth order above. Log measured, estimated, human and assistant time distinctly; do not infer working hours from commit timestamps. This file-based workflow grants no permission to create external Jira tickets, commit, push or deploy.

## Definition of done

A task is done when its output names the source documents changed, decisions made, questions still open, and how the result was verified.

