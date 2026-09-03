# Documentation map

This directory separates decisions from exploratory material.

| Area | Purpose | Status |
|---|---|---|
| `product/` | Product decisions, customer evidence, scope, and measures | Draft |
| `domain/` | Ubiquitous language, business scenarios, and rule boundaries | Draft |
| `compliance/` | Data inventory, retention, and legal-policy evidence | Draft — requires counsel |
| `adr/` | Short records of accepted, durable decisions | Empty by design |

## Decision statuses

- `PROPOSED` — useful draft; not approved.
- `ACCEPTED` — a decision that implementation may rely on.
- `OPEN QUESTION` — needs founder/customer/legal input.
- `UNVERIFIED` — copied from existing material without sufficient evidence.

## How to use it

Start work from the product charter. Create an ADR only for a decision that is expensive to reverse, such as the initial market, tenancy model, identity provider, or database. Keep exploratory research out of ADRs.

