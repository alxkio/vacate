# Data map

**Status:** PROPOSED

| Data category | Example | Purpose | Access | Minimisation note |
|---|---|---|---|---|
| Account identity | Name, work email, login identifier | Authentication and access | Person, tenant admin, system operators as necessary | Do not require personal email or date of birth for MVP. |
| Employment configuration | Work schedule, manager, team membership | Calculate requests and route approval | Person, authorised manager/HR/admin | Store effective dates; avoid unrelated HR profile fields. |
| Leave record | Type, dates/units, status, decision reason | Operate leave workflow | Person and authorised viewers | Avoid free-text health detail. |
| Audit record | Actor, action, timestamp, object reference | Security, accountability, dispute resolution | Restricted HR/admin/security role | Pseudonymise where feasible; define retention by purpose. |
| Integration data | Calendar/Teams identifiers and tokens | Requested integration | Limited service account and tenant admin | Encrypt secrets; request minimum scopes. |

## Open questions

- Which data categories are mandatory for the Greek MVP?
- Will HR upload employee records, SCIM-sync them, or invite them manually? --> Manual invitation (email). A user that accepts it becomes member of the organization. 

- Does any workflow require special-category personal data? The default answer should be no.

