# Vacate Figma structure — first pass

Date: 2026-11-15. [VAC-50](../jira/VAC-50-modular-figma-design-structure.md) tracks delivery and verification. [Figma file](https://www.figma.com/design/TORfMp9HPtio6OCOIkIRIQ/Vacate).

This document describes the **existing first-pass snapshot**. The owner's subsequent [focused-area reorganisation plan](figma-focused-areas.md) and [navigation specification](../product/workspace-navigation.md) define the next target. They have not been applied to Figma because its MCP allowance is exhausted. Calendar remains the landing screen; Home is a deferred idea under the latest owner clarification.

## Scope and source authority

The owner requested replacing the previous Figma concept with a modular representation of the current application, starting with routes, screens, shared shell, feature sections and reusable presentation. The owner also invited alternative structures. Detailed component states, exact visual fidelity, responsive designs and interactive prototypes are the second step.

[ADR-0005](../adr/0005-frontend-capability-architecture.md) is ACCEPTED and owns target capability boundaries. [Current routes](../../frontend/src/app/app.routes.ts), [Workspace composition](../../frontend/src/app/features/workspace/workspace.html), [route interpretation](../../frontend/src/app/features/workspace/workspace-route-state.ts) and [Settings navigation](../../frontend/src/app/features/settings/settings-navigation.ts) establish current behavior. The target architecture is not claimed as an implemented migration. No Angular, API, policy or access changes were made.

## File hierarchy

| Figma page | Purpose | Entry frame |
|---|---|---|
| 00 Overview & routes | Route map, composition hierarchy, ownership, navigation alternatives and second-pass boundary | [Design architecture](https://www.figma.com/design/TORfMp9HPtio6OCOIkIRIQ/Vacate?node-id=25-2) |
| 01 Components & patterns | Shared shell, presentation patterns and feature-owned structural components, with source annotations | [Catalogue](https://www.figma.com/design/TORfMp9HPtio6OCOIkIRIQ/Vacate?node-id=23-2) |
| 02 Feature screens | Eleven route/section compositions and contextual dialog inventory | [Feature compositions](https://www.figma.com/design/TORfMp9HPtio6OCOIkIRIQ/Vacate?node-id=24-2) |

Design hierarchy: screen → shell → feature sections → shared presentation. The catalogue displays instances; main components live separately to its right. This is a navigable design organisation, not a mechanical folder copy or a new Angular class for every Figma component.

The previous on-canvas concept, its four main components and its four token collections were removed. The replacement uses Inter and current default colour values from [styles.scss](../../frontend/src/styles.scss). Source anchors: accent `#12675e`, ink `#1d3038`, muted `#586872`, canvas `#f4f7f7`, line `#dce4e6`. One collection contains 21 structural colour/spacing/radius variables; three shared text styles cover body, caption and section headings. The existing alternative colour scheme and layout preferences are inventoried, not fully designed in this first pass.

## Screens and routes

| Screen | Current URL / state | Screen node |
|---|---|---|
| Login | `/login.html` | `24:9` |
| Calendar, signed-in landing | `/` redirects to `/index.html`; default or `?page=calendar` | `24:36` |
| My Leave | `/leave` or `/index.html?page=leave` | `24:132` |
| Balances | `/balances` or `/index.html?page=balances` | `24:187` |
| People | `/people` or `/index.html?page=people` | `24:223` |
| Approval Requests | `/approvals` or `/index.html?page=approvals` | `24:304` |
| Settings / Organization | `/settings?section=organization` | `24:358` |
| Settings / Department | `/settings?section=department` | `24:426` |
| Settings / Team | `/settings?section=team` | `24:470` |
| Settings / Profile | `/settings?section=profile` | `24:512` |
| Settings / System | `/settings?section=system` | `24:556` |

Settings also supports `/index.html?page=settings&section=…`. `/availability` resolves to Calendar; `/admin-balances` resolves to People. Legacy `organization` / `organization-settings` page query values resolve to Settings / Organization. `/home`, `/calendar` and `/profile` are not registered standalone routes. Calendar date, scope, group and view remain state rather than new destinations. All signed-in routes currently load Workspace; independently loaded capability routes remain a migration target.

## Reusable structure and source mapping

The file contains **31 main components**: nine shell/shared patterns and 22 feature blocks. Components labelled EXISTING correspond to actual Angular classes or explicitly identified existing template regions. Native controls and reusable markup are labelled design abstractions; no existing standalone Angular class is invented.

| Design family | Current source and represented parts |
|---|---|
| Workspace shell | [workspace.html](../../frontend/src/app/features/workspace/workspace.html): top bar, left navigation, page heading. These are currently template regions in Workspace. |
| Shared presentation | [DataTable](../../frontend/src/app/shared/data-table/data-table.ts) is a real Angular shared component. Navigation item, action, labelled field, feedback region and dialog frame are design abstractions over existing markup/native controls. |
| Auth | [Login](../../frontend/src/app/features/auth/login.html): demo persona, credentials, session recovery and errors. No new SSO behavior. |
| Calendar | [Calendar](../../frontend/src/app/features/calendar/calendar.ts) renders the projection. Scope/period controls and insights still reside in Workspace. Personal details remain separate from shared availability. |
| Leave | [MyLeave](../../frontend/src/app/features/leave/my-leave.ts), [Balances](../../frontend/src/app/features/leave/balances.ts), [Request](../../frontend/src/app/features/leave/request.ts), [CancelRequest](../../frontend/src/app/features/leave/cancel-request.ts), BalanceBar and Allowance: balances, history, request form and management. |
| People | [People](../../frontend/src/app/features/people/people.ts): directory, administrator balances and recorded leave. Current membership editor reuses OrganizationSettings in membersOnly mode; the accepted target gives People deliberate ownership/public APIs. |
| Leave approvals | [Approvals](../../frontend/src/app/features/administration/approvals.ts): assigned inbox and inline review. Current folder is administration; accepted capability ownership is Leave. |
| Settings composition | [UnifiedSettings](../../frontend/src/app/features/settings/settings.ts): permitted section navigation and panel composition. This surface does not own every composed capability. |
| Organization | [OrganizationSettings](../../frontend/src/app/features/organizations/organization-settings.html): workspace, policy, optional structure and creation dialog. [ScopeSettings](../../frontend/src/app/features/settings/scope-settings.ts): permitted department/team configuration. |
| Leave configuration | [ApproverSettings](../../frontend/src/app/features/administration/approver-settings.ts): assigned approvers/inheritance. Current administration source, accepted Leave ownership. |
| Company calendar configuration | [CompanyCalendar](../../frontend/src/app/features/administration/company-calendar.html): closures, recurring holidays, results and entry editor. Current administration folder; Organization settings composes this configuration. It produces inputs for leave/calendar workflows rather than owning their transactions. |
| Profile | [ProfileSettings](../../frontend/src/app/features/profile/profile-settings.html): personal profile/membership/allocation and separate display-preferences section. |

Buttons and navigation items expose text properties; feature forms override the action label. Shared DataTable provides presentation; feature owners supply columns, filters, records and actions. Figma descriptions record source and ownership; no Code Connect mappings or Angular refactors were created. Repository discovery found no `*.figma.*` mappings. Figma library discovery/search found no matching Vacate assets, so source-based local components were created rather than importing an unrelated UI kit.

## Contextual surfaces

- Existing dialogs: WorkspaceDialog for request/date/event details; OrganizationSettings for structure creation; CompanyCalendar for calendar-entry editing.
- Existing inline sections: saved-request management, approval review, recorded leave and membership editing. Their appearance in a composition is an anatomy inventory, not an assertion that all are open by default.
- Shell-owned surfaces: account dropdown and mobile navigation, inventoried for the second pass.
- Feature-owned states: loading, empty, denied, error, validation, busy and server-confirmed save. Only structural treatment is represented at this stage.

Permission notes preserve administrator-only assigned approvals, API-permitted settings scopes, member directory versus administrator personnel data, and personal versus shared availability. No employee data or API records were exported. The underlying application remains authoritative for permissions and saves.

## Proposed structures

**A — Current baseline:** Calendar landing, My Leave, People, administrator Approval Requests, Settings. Existing behavior and URLs.

**B — Task grouping, recommended proposal:** Plan / Calendar; My leave / requests and balances; Administration / People and Approval Requests; Settings / personal and organisation groups. Preserve existing URLs and ordinary-member directory access. Groups improve scanning; they do not grant authorization. This is PROPOSED, not an accepted navigation change.

**C — Home-led workspace, optional proposal:** add Home before existing destinations. This requires a distinct validated summary task and explicit product acceptance; otherwise it duplicates Calendar insights. No Home route or dashboard is claimed to exist.

OPEN QUESTION: retain A or adopt B? A separate Home requires a further product decision. Detailed design is intentionally deferred to the owner's second step.

## Verification and limitations

Figma writes returned IDs for all created/modified nodes. Initial structure evidence reported 31 main components, 11 screens, editable text/frames/instances, Inter throughout, and no image-filled nodes in review frames. Catalogue and screen compositions had 59 and 139 instances respectively, including nested instances. These counts precede layout fixes; no new components/screens were added by those fixes.

Initial screenshots were inspected for the overview, catalogue and Organization settings composition. They exposed collapsed text, horizontal container sizing and instance height problems. Targeted corrections changed text to content-height sizing, restored vertical/horizontal Auto Layout sizing, corrected feature action labels, fitted tables and arranged main components separately. Correction responses reported expanded overview/catalogue/screen root heights of 2583 / 5092 / 9435 pixels. This is structural evidence of the correction, not a visual pass.

**UNVERIFIED:** post-correction screenshots. All four requested final screenshot calls were rejected by Figma's Starter-plan MCP tool limit. `whoami` subsequently confirmed the Starter plan. No alternative access path was used to bypass the restriction. Final visual inspection, editability/instance-link readback after corrections, responsive layouts, prototype interaction, keyboard and assistive-technology validation remain open. The task is QA, not Done.

Local checks cover issue/backlog consistency, source links and preservation of unrelated working-tree changes. Application builds, API tests and tenant-isolation execution are not applicable to documentation/Figma-only changes. No commit, push, deployment or production-readiness claim.
