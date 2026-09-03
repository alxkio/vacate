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
- Every implementation change needs an acceptance scenario and tenant-isolation test where applicable.

## Definition of done

A task is done when its output names the source documents changed, decisions made, questions still open, and how the result was verified.

