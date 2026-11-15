# Workspace navigation and route design

Date: 2026-11-15. Status: **Owner-confirmed direction; local Angular implementation in QA.** [VAC-50](../jira/VAC-50-modular-figma-design-structure.md) records the design pass; [VAC-52](../jira/VAC-52-angular-clean-navigation.md) tracks implementation and [VAC-51](../jira/VAC-51-focused-figma-follow-up.md) retains future Figma work. [Focused Figma plan](../design/figma-focused-areas.md).

## Confirmed direction and scope

Source: owner instructions and clarification replies in the design session, 2026-11-15.

- Organise the Figma design into focused product areas with reusable shell, feature and shared presentation parts.
- **Current login is `baseUrl/login` on the same application origin until the custom domain is available.** Future targets are `auth.vacate.gr` for sign-in and `vacate.gr` for the workspace. The owner corrected `vacate.ht` to `vacate.gr`.
- **Calendar remains the signed-in landing screen.** The owner's subsequent clarification defers Home/workspace landing to an idea until designed. Do not add Home to the current menu or make `/home` the default.
- Provide clean path-based destinations for Calendar, My leave & balances, People, Settings, Approval Requests when applicable, and Help & feedback.
- Use server-issued public GUIDs for resource navigation and requests; never numeric database keys, email addresses, usernames or fictional persona keys as resource identity.
- Add an administrator person detail page, including person and membership editing. Exact account-field editing permissions still need definition; existing company membership editing remains the baseline.
- Initial scope was Figma/specification first. The owner subsequently authorised feasible local implementation, starting with Angular, and deferred blocked Figma to Todo. Cross-host authentication, DNS/custom-domain provisioning, deployment and publication remain outside this pass.

The [route registration](../../frontend/src/app/app.routes.ts) and [route-state interpretation](../../frontend/src/app/features/workspace/workspace-route-state.ts) now implement clean feature paths locally. [ADR-0005](../adr/0005-frontend-capability-architecture.md) governs capability ownership. The existing Workspace composes the features; this pass does not complete the broader capability-service migration.

## Recommended route hierarchy

The host names are confirmed design targets, not evidence that DNS, certificates or authentication between hosts are configured. The relative feature paths below are implemented locally; the separate auth host remains a future target. Local sign-in uses `/login`. A path prefix is not a company authorization boundary.

| Area / destination | Proposed canonical URL | Ownership / access |
|---|---|---|
| Sign in (current) | `baseUrl/login` | Same-origin Auth; public entry, existing recovery states |
| Sign in (future custom domain) | `https://auth.vacate.gr/` — deferred | Requires custom-domain and cross-host session configuration |
| Signed-in root | `https://vacate.gr/` → `/calendar` | Workspace composition; Calendar stays the landing screen |
| Calendar | `/calendar` | Calendar projection; authorised scopes only |
| My leave & balances | `/leave` | Leave; balances collapsed above saved request history |
| Balance focus | `/leave/balances` | Leave; deep link into the same feature, not a second top-level menu item |
| Saved request | `/leave/requests/{requestGuid}` | Leave; authorised request detail/management; direct link can open the existing dialog/context |
| People | `/people` | People; directory, with additional administrator controls |
| Person overview | `/people/{personGuid}` | People; administrator detail first; colleague access must use a separate approved projection |
| Person membership | `/people/{personGuid}/memberships/{membershipGuid}` | People; same-company administrator editing; one active membership remains the MVP boundary |
| Person recorded leave | `/people/{personGuid}/leave?year=2026` | People composes authorised leave projection; administrator only |
| Settings entry | `/settings` → `/settings/profile` | Composition; preserves a safe permitted personal entry |
| Personal profile | `/settings/profile` | Profile; own account |
| Display preferences | `/settings/system` | Profile; own preferences |
| Organization settings | `/settings/organization` | Organization and Leave configuration panels; API-permitted scope |
| Department settings | `/settings/departments/{departmentGuid}` | Scoped settings; API-permitted department |
| Team settings | `/settings/teams/{teamGuid}` | Scoped settings; API-permitted team |
| Approval inbox | `/approvals` | Leave approvals; enabled/permitted capability and assigned work |
| Assigned request review | `/approvals/{requestGuid}` | Leave approvals; actor must be the assigned authorised approver |
| Help & feedback | `/help` | Help content and feedback entry; feedback submission mechanism undecided |
| Future Home / workspace idea | `/home` — **DEFERRED IDEA** | No current menu item, default redirect or implementation requirement |

Use short stable paths and human-readable area names. Display labels can be “My leave & balances” and “Help & feedback” without making the paths verbose. GUIDs identify records; static areas such as Calendar and Settings do not need arbitrary GUIDs.

No trailing slash is recommended for canonical routes; accept a trailing slash as a compatibility form and normalise it without losing valid state. Angular accepts trailing-slash navigation; no HTTP canonical redirect has been deployed.

## Query state and the supplied example

Start query parameters with `?`, followed by `&` between parameters. `/people/&scope=org` makes the ampersand part of the path rather than starting a query.

```text
Current:
https://lemon-beach-02f7a7103.4.azurestaticapps.net/index.html?page=people&scope=org&view=month&date=2026-11-14

Syntax-correct transition form:
https://lemon-beach-02f7a7103.4.azurestaticapps.net/people?scope=org&view=month&date=2026-11-14

Recommended canonical People link:
https://lemon-beach-02f7a7103.4.azurestaticapps.net/people?scope=org

Calendar link retaining calendar state:
https://lemon-beach-02f7a7103.4.azurestaticapps.net/calendar?scope=org&view=month&date=2026-11-14
```

The Azure-host examples describe the same proposed relative paths during development; they do not provision a custom domain. Development sign-in stays same-origin at `/login`; it does not send users to production authentication.

| Owner | Proposed state in the URL | Rules |
|---|---|---|
| Calendar | `scope=self|team|department|org`, `view=year|month|week|day`, `date=YYYY-MM-DD`, `group={groupGuid}` | `group` is relevant only to a permitted team/department. Resolve current API GUIDs rather than copying fixture IDs. |
| People | `scope=org|team|department`, optional `q`, `year` for administrator balances | Current People uses local `all` state for the organisation scope; map that deliberately. Search text may contain personal data, so persisting `q` is optional pending privacy review. |
| Leave | Optional `status`, `type={leaveTypeId}`, `from`, `to` | Existing leave-type identifiers may be stable catalogue keys rather than GUIDs. Do not fabricate GUIDs or change catalogue contracts as part of URL cleanup. |
| Person leave | `year` | Preserve the selected year and return-list context; do not invent dated records from opening totals. |
| Settings | Resource GUID in scoped path; optional section/panel state only when necessary | Do not retain irrelevant Calendar date/view parameters. |

Route state is owned by its feature. Moving from People to Calendar restores Calendar's own last view/date, without propagating unrelated query parameters through every destination. Canonicalise valid values; invalid dates/views/scopes must produce safe defaults or an explicit unavailable state, without widening access.

## Person detail design

The person page is a durable destination rather than an anonymous editor below a long directory table.

1. **Header:** breadcrumb “People / [display name]”, authorised identity summary, company context and a clear return to People preserving filters/year.
2. **Overview:** permitted account identity and employment summary. The owner requested editing; proposed initial account edits are names only, subject to explicit field-permission confirmation. Username/email, account status, family facts and lifecycle operations are not silently made editable.
3. **Membership:** current membership GUID; system/job roles, optional department/team, manager, work schedule, employment dates, prior service and allowed custom allocation, based on existing membership controls. Derived used/pending/available balances remain read-only and server-owned. Do not imply that currently unconfigured policy/calendar selectors are available.
4. **Recorded leave:** annual balance summary and saved per-date history for the selected year, without private notes, medical evidence or family/eligibility facts.
5. **States and exits:** loading, person absent/foreign-company, permission denied, unsaved edits, validation, saving, failed save/retry, success and safe back navigation. Preserve drafts after a recoverable error; do not claim a save before the API responds.

Keep the person GUID, membership GUID and request GUID distinct. A membership detail link must resolve a membership belonging both to that person and the authorised company. The new page does not grant ordinary directory users administrative records. Any future member-facing person view needs its own public-field projection and explicit access decision.

## Approval Requests: enabled does not mean all work vanished

The owner's “if enabled” requirement needs an explicit visibility rule. **PROPOSED:** show the navigation entry when the actor has approval access and either approval is enabled for a permitted scope or assigned pending work still exists. Do not hide assigned requests merely because the actor's current scope no longer requires approval for new requests. An unauthorised direct link remains denied regardless of menu visibility.

This preserves the [2026-11-14 owner refinement](product-charter.md#owner-refinement--leave-lifecycle-and-unified-people--2026-11-14). No company-wide approver privilege is inferred. Exact enablement/capability semantics remain an OPEN QUESTION for implementation.

## Authentication and GUID request boundary

The accepted auth hostname changes browser origins. The existing [session navigation](../../frontend/src/app/core/http/session-navigation.ts) uses same-origin paths and an explicit return-path allowlist; it must not simply be pointed at a second host and assumed to work.

**OPEN QUESTION before cross-host implementation:** how auth and the workspace establish the session, where the API is hosted, approved cookie/token handling, allowed origins and deployment routing. Preserve the accepted 30-minute absolute expiry/recovery behavior. Return only to approved workspace origins and internal destinations; do not place credentials or bearer tickets into query parameters. Authentication/network recovery must preserve the requested person/request/calendar destination without exposing stale private state.

Resource API requests continue using public GUIDs according to existing contracts. This route design does not rename endpoints, convert every catalogue key to a GUID, or make a GUID proof of authorization. Server-side actor/company/assignment checks remain required.

## Compatibility and implementation acceptance

The following requirements guided VAC-52; its verification record distinguishes local results from deployment gates:

- `/index.html?page=calendar…` and `/availability` → `/calendar` with valid Calendar state.
- `/index.html?page=people…`, `/people/…` and `/admin-balances` → People with relevant scope/year; ignore irrelevant Calendar date/view state.
- `/index.html?page=leave…` and `/leave` → My leave; `/balances` → `/leave/balances`.
- Existing Settings query sections map to clean settings paths. A legacy team/department link without a GUID resolves only to a permitted scope picker/default; do not invent a resource identity.
- `/login.html?returnUrl=…` preserves the approved internal destination through the auth transition. Unknown unsafe return URLs never leave approved origins.
- Preserve existing bookmarks, browser Back/Forward, direct-load and refresh behavior. Deep paths must be served by the application host before Angular routing runs; no redirects are deployed in this pass.
- A malformed GUID is handled consistently; valid foreign-company and foreign-person/membership combinations reveal no private data. Approval request links enforce assignment; public directory projections cannot fetch private membership/leave fields.
- Clear sensitive state on actor/company change, and reject stale responses after sign-out or account changes. A route change is not an authorization check.
- Calendar remains the default after sign-in without a requested destination. `/home` remains an unimplemented idea.

## Open decisions and delivery status

Remaining design decisions: hosting canonical redirects; administrator-editable person account fields; approval capability visibility; Help content and feedback submission; auth/session integration across hosts. Home content/route implementation is deferred and does not block Calendar-first navigation.

Local Angular routing, paired InMemory API journeys and responsive screenshots are verified in [VAC-52 evidence](../jira/media/VAC-52/verification.md). **UNVERIFIED:** focused Figma changes, native keyboard/screen-reader acceptance for new detail screens, actual SQL-provider execution, custom domains/cross-host auth and hosted deep-path behavior. Figma rejects file reads/writes because the Starter MCP allowance is exhausted; its focused update stays Todo under VAC-51.

## Local implementation boundaries

- Calendar is the default; `/home` has no page or menu entry. `/login.html` and earlier query-based bookmarks resolve to clean paths while preserving applicable state.
- Administrator person identity is read-only. Membership edits reuse the existing server-authorised API and editor. Person/membership GUID mismatches and other-company records are unavailable; directory projections exclude family and medical facts.
- Own saved requests and assigned approvals have GUID routes. Approval navigation retains existing administrator access and saved assignment semantics; broader enablement visibility remains open.
- Help provides useful navigation guidance and explicitly says feedback submission is unavailable.
- Calendar view/date/scope/group context is stored per actor/company in tab session storage and cleared at logout. People search remains in memory, scoped to the session owner, rather than entering URLs. No business records or authentication tickets enter navigation URLs.
- Existing API contracts and backend/database code are unchanged. SPA deep-path rewrite configuration is included in the local build, with no deployment claim.
