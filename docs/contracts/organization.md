# Organization administration — fictional API boundary

**2026-10-27 · bounded fictional implementation, not production identity/storage.** [VAC-2](../jira/VAC-2-organization-settings-mock.md) implements the founder's admin organization page/rename request. [Charter](../product/product-charter.md) and [ADR-0001](../adr/0001-company-first-web-api.md) record the later broader/flexible organization direction.

## Current fields and editing

An authorized company administrator may read the existing company-shaped workspace, rename the organization, select 5 or 6 working days, and rename its departments/teams. Changes use HTTP and single-process server memory, scoped to the authenticated company/account and reset on API restart. Reload/sign-out retain edits. Cancel restores the last saved mock values. Reject blank/whitespace names, invalid day counts, extra company fields, missing/foreign node IDs, stale actors and forged/non-admin contexts atomically.

The read model exposes companyId, name, workWeekDays, independent departments, independent teams with nullable departmentId, and organization members. Teams contain a member projection for browsing: ID, name, job title and company system-role label only. It excludes family facts, private leave categories/reasons, balances, documents and account security data.

VAC-13 adds API-only create/delete and an admin membership editor for roles, assignment, employment details and provisional allocation. Generic group editing and invitation delivery/acceptance remain open. The employee's own membership remains read-only on Settings. Names are display values, not permissions or identity keys. Renaming does not move members, change immutable fixture IDs, change roles, or recalculate ledgers.

## Optional structure

No department/team/group layer is required. Flat organizations with direct members are valid. Teams can belong directly to the organization with departmentId null; departments can exist without teams. Counts use all organization members, not a sum that would lose ungrouped people or double-count multiple team memberships. The current model does not implement multiple-team membership or arbitrary graph relationships, but does not make team membership a condition of organization membership.

Northstar's two departments/four teams are one synthetic example. The later generic organization concept includes standalone-team workspaces and potentially cross-company teams; their identifiers, employer relationships and authorization/privacy model are explicitly deferred. Current company isolation remains enforced in the mock boundary. Company is the current organization representation, not the universal definition of organization.

## Workweek boundary

The saved setting is 5 or 6 working days, without inferring which dates a six-day schedule uses. The existing leave catalogue, request-day examples and ledgers continue to use their labelled five-day reference conventions. Changing company configuration is not approval of six-day statutory allowances, effective-dated schedules, holidays, historical recomputation or a different entitlement engine. The UI says so next to the working-week setting. The current membership schedule summary reflects the chosen day count, while leave policy reference text remains distinct.

## Authorization and acceptance

Only canonical company administrators may browse/edit organization administration. Employees and non-admin team leads have neither the navigation nor direct page/form/data access. Direct/guessed foreign company IDs fail closed. Caller permissions come from the server session and current stored membership/provisioning grant, rather than submitted role/company fields. Existing shared calendar availability visibility is a separate confirmed feature; this page does not remove it.

Test same-company admin success, employee/lead/foreign-company/forged-role denial, stale forms after another admin signs in, invalid changes without partial mutation, node renaming, private-field exclusion, detached snapshots and unchanged ledgers. Verify no-department/no-team organizations, direct teams and direct members as separate fixtures. Browser coverage includes keyboard, mobile, save/cancel, drill-down, consistent labels, direct-entry denial, retained edits after reload/sign-out and API restart reset.

The demo API now tests target-company authorization, reference integrity, field projection, atomic updates and revocation alongside the web. Production identity/storage, independent security review, organization bootstrap and later cross-company policy remain open. Public demo credentials do not protect real personal data.

## Sources

- Founder instructions, 2026-10-26: admin-only organization structure/pages; company name and five-/six-day week; explicitly confirmed department/team renaming; organizations can be company-shaped or standalone/cross-company teams (later design); internal departments/groups/teams optional and flexible.
- [Charter](../product/product-charter.md#founder-request--admin-organization-pages-2026-10-26), [broader organization direction](../product/product-charter.md#founder-clarification--organizations-beyond-companies-2026-10-26) and [optional structure clarification](../product/product-charter.md#founder-clarification--optional-organization-structure-2026-10-26).
- [VAC-6 fixtures](../jira/VAC-6-company-personas-and-visibility-fixtures.md), [user/membership contract](user.md) and [policy register](../compliance/policy-sources.md). No new statutory rule is adopted.


## Verification status — 2026-10-27

Production build, 18 unit/component tests, shared-factory negative/flat-layout checks and organization-only functional Chrome checks passed. Desktop/mobile settings and team screenshots are linked in VAC-2. The isolated organization native-keyboard diagnostic is still open on the current macOS host because the page received no CDP key/pointer events in headless or visible-window mode; independent manual/alternate-host keyboard review is required before treating that gate as passed. Full default browser regression results are recorded in the issue. No server authorization, persistence or release approval is claimed.

## API integration · 2026-10-27

The [API contract](api.md) now owns HTTP CRUD, server-owned lifecycle timestamps and admin web updates for organizations and optional departments/teams. Browser reload/sign-out retain edits; API restart resets fictional state. Production persistence, generic/cross-company organization graphs and OpenID authorization remain open.

Organization, department and team entities each have numeric Id and immutable Guid. Domain relationships use numeric keys; HTTP item routes and relationship fields use GUIDs, including team.departmentId. There is no InternalId alias. Services resolve public GUIDs before checking company scope. [ADR-0003](../adr/0003-domain-and-application-services.md) defines the layered implementation.
