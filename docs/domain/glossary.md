# Domain glossary

**Status:** PROPOSED — replaces ambiguous uses of “user”, “organisation”, and “team”.

| Term | Definition |
|---|---|
| Tenant | The isolated SaaS workspace and billing boundary. |
| Legal employer | The entity whose employment policy and obligations apply. A tenant may later contain more than one. |
| Person | A human identity that may have memberships in one or more tenants. |
| Organisation membership | A person’s access relationship to a tenant. |
| Employment | A person’s work relationship with a legal employer, including work schedule and policy assignment. |
| Organisation unit | A node in a hierarchy used for reporting, visibility, or policy scope. |
| Team membership | A person’s membership of a team, with dates and optional role. |
| Leave policy | A versioned configurable rule set that determines request and approval behaviour. |
| Entitlement ledger | Append-only balance movements, not a mutable number alone. |
| Approval policy | Rules that determine required approvers and escalation. |
| Visibility grant | An explicit, auditable permission to view defined information about a scope or person. |

## Decision required

For MVP, confirm whether a tenant has exactly one legal employer and whether a person may be in multiple teams. The original domain document says “one team”; its later additions say “multiple teams.”

