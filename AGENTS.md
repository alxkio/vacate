# Vacate agent guide

## Purpose

Use agents to improve evidence, specifications, implementation, and verification without turning assumptions into product decisions.

## Source-of-truth order

1. Accepted ADRs in `docs/adr/`
2. `docs/product/product-charter.md` and explicitly accepted product documents
3. Versioned policy sources in `docs/compliance/policy-sources.md`
4. Existing reference material (`domain.md`, `TechChoices.md`, market-research draft)

If sources conflict, do not silently select one. Record an `OPEN QUESTION` in the relevant document and ask the product lead.

## Agent roles

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

