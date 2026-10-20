# Domain glossary

**Status:** PROPOSED — replaces ambiguous uses of “user”, “organisation”, and “team”.

| Term | Definition |
|---|---|
| Customer company | A customer organisation using Vacate, with its own personnel, configuration and access boundary. This does not require a Microsoft tenant. |
| Microsoft Entra tenant | A customer identity directory that may optionally be integrated later; not the Vacate company boundary. |
| Application account | A manually managed sign-in identity with one company in the initial scope. Its username is the company email, unique across Vacate. Duplicate usernames are rejected. |
| Personnel record | An employee record belonging to a company; it need not have a sign-in account. |
| Legal employer | The entity whose employment policy and obligations apply. A customer company may later contain more than one. |
| Person | A human being. Owners and employees may in reality belong to several companies; shared identity and multi-company membership workflows are deferred. |
| Organisation membership | A person’s access relationship to a customer company. |
| Employment | A person’s work relationship with a legal employer, including work schedule and policy assignment. |
| Organisation unit | A node in a hierarchy used for reporting, visibility, or policy scope. |
| Team membership | A person’s membership of a team, with dates and optional role. |
| Leave policy | A versioned configurable rule set that determines request and approval behaviour. |
| Entitlement ledger | Append-only balance movements, not a mutable number alone. |
| Approval policy | Rules that determine required approvers and escalation. |
| Visibility grant | An explicit, auditable permission to view defined information about a scope or person. |

## Decision required

For MVP, confirm whether a customer company has exactly one legal employer and whether a person may be in multiple teams. The original domain document says “one team”; its later additions say “multiple teams.”

