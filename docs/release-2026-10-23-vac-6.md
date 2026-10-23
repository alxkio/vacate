# VAC-6 release — 2026-10-23

## Scope and decisions

The founder authorized committing the issue/backlog work, implementing [VAC-6](jira/VAC-6-company-personas-and-visibility-fixtures.md), reviewing, pushing and deploying to Azure dev. Documentation checkpoint: `70d3e82`.

The mock now uses 12 canonical fictional identities in Northstar Example, two departments and four teams. Employee, non-admin lead, HR admin and owner personas use the PO's prototype scope matrix. HR/owner share explicit admin capability. Each person uses lowercase firstname/firstname following the founder's implementation-time instruction. Canonical identities and public login instructions are in the [mock README](design/calendar-mock/README.md); legacy shortcuts remain aliases. All fixture assets remain public and no backend authentication or employee APIs are added.

The optional second company is omitted. VAC-2 settings, VAC-3 dashboard refinements, VAC-4 decisions and VAC-5 shortlist remain separate. Admin Approvals/Settings destinations are labelled Planned and do not perform decisions or writes. Real policy, authority and self-approval remain unresolved.

## Review and verification

Independent source review found no release-blocking correctness/privacy issues and independently passed fixture/session checks. It requested a real browser-history test for stale personal state; the added Back/Forward regression passed. Native keyboard checks use trusted pointer/key input on a fresh document, independently of history traversal, because headless Chrome retained a hidden document after traversal during initial harness attempts. No application assertions were waived.

Node fixture tests pass for the independently expected roster/capabilities, exact scope membership, denied foreign IDs, sanitized shared projections, per-person request/balance reconciliation, missing/zero balances and invalid session/logout handling. Full local Chrome acceptance passed for all 12 firstname/firstname accounts, compatibility aliases, all permitted scopes/group rosters, own records, negative identifiers, shared-detail privacy, account resets, actual Back/Forward traversal, catalogue/unit/date regressions, trusted Escape/focus return, 16 mobile overflow checks and eight screenshots. Fresh packaging, fixture script load order, Angular entry preservation, revision marker, no-store routing, syntax and whitespace checks passed. Hosted checks and deployment remain pending at this checkpoint.

## Deployment

Not yet deployed at this checkpoint. Target remains subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, resource group `rg-vacate-dev`, existing Azure dev site/API. Infrastructure parameters are unchanged. Hosted Angular/API builds, Functions-host checks, Bicep validation, publishing and deployed smoke checks are required before marking Released.

## Evidence and limits

Sources changed: mock fixtures/session/login/calendar assets, fixture/browser acceptance, packaging, CI, no-store routing, cloud smoke, [VAC-6](jira/VAC-6-company-personas-and-visibility-fixtures.md), [backlog](jira/Product-Backlog.md) and [mock README](design/calendar-mock/README.md). This is synthetic presentation verification; company/person filtering in downloadable JavaScript cannot prove server tenant isolation.

UI direction, real accounts/permissions, production data model, approval/settings behavior, company policy and statutory eligibility remain open. No real employee data or credentials are introduced. Time logs distinguish the tracked elapsed window from human effort and active assistant duration.
