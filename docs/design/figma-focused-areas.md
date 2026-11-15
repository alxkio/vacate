# Focused Figma areas — reorganisation plan

Date: 2026-11-15. **Prepared; not applied to Figma. Future Todo: [VAC-51](../jira/VAC-51-focused-figma-follow-up.md).** [VAC-50](../jira/VAC-50-modular-figma-design-structure.md). [Canonical navigation and route design](../product/workspace-navigation.md). [Existing file](https://www.figma.com/design/TORfMp9HPtio6OCOIkIRIQ/Vacate).

## Goal and constraints

Make one product area easy to find, inspect and discuss without navigating an enormous all-screen frame. Retain the original source/component distinctions and existing reusable instances. Home is a **deferred idea**; Calendar stays the signed-in landing screen, as clarified by the owner on 2026-11-15.

Figma returned its Starter MCP tool-limit error on the first read attempt in this follow-up; `whoami` confirmed Starter. No Figma mutation was attempted after that rejection. The existing file state has not been re-read in this follow-up.

Use the existing three pages with focused, top-level **Figma Sections**, a compact index and direct links to each area. Avoid another page-sized Auto Layout frame containing all areas. The Starter team currently permits three pages per Design file: [official page guidance](https://help.figma.com/hc/en-us/articles/360038511293-Create-and-manage-pages), checked 2026-11-15. If the file later supports more pages, each product section can become its own page without changing the hierarchy.

## Target structure

```text
00 Start here
   Navigation map and proposed clean URLs
   Area index → direct links to each section
   Status legend, ownership and open decisions
   Ideas → Home / workspace [DEFERRED; not current navigation]

01 Product areas
   Auth → Sign in / recovery
   Calendar [LANDING] → calendar / planner / views
   My leave & balances → balances / requests / request management
   People → directory / person detail / membership / recorded leave
   Settings → personal / system / organization / department / team
   Approval Requests → assigned inbox / selected-request review
   Help & feedback → help content / feedback entry

02 Components
   Foundations → colour / typography / spacing
   Workspace shell → top bar / left navigation / heading / account menu
   Shared presentation → controls / tables / feedback / dialogs
   Feature-owned → Calendar / Leave / People / Settings / Approvals / Auth
```

Within each product-area section, keep consistent named lanes:

- **Overview:** purpose, entry route, intended actor, ownership and source pointers.
- **Screens:** primary view and purposeful role variants. Put proposed screens in a visibly separate group.
- **Contextual surfaces:** feature dialogs or inline panels, labelled with their actual interaction type.
- **States:** loading, empty, denied, error, validation and save outcomes; clearly identify stage-two placeholders.
- **Decisions:** accepted direction, unresolved details and direct links to component/source/specification.

Use a modest grid of top-level Sections separated by generous space, not nested cards or a continuous scrolling board. Set section bounds to contain content. Number pages for the workflow sequence only; use meaningful names for product areas. Set the initial viewport to the Start index; provide return-to-index links. Frame and section names include purpose, not a copied directory path.

## Placement of existing designs

The IDs below come from the earlier successful write responses, not a fresh read. Re-read them when Figma access is restored before moving anything. Preserve IDs and component instances where possible; never recreate or detach them solely to organise the canvas.

| Focused section | Existing nodes / source |
|---|---|
| Auth | Login `24:9`; existing Auth group `24:5` |
| Calendar — landing | Calendar composition `24:36`; group `24:32` |
| My leave & balances | My Leave `24:132`, Balances `24:187`; group `24:128` |
| People | People composition `24:223`; group `24:219`. Split directory/contextual examples into focused views without inventing additional implemented Angular classes. |
| Settings | Organization `24:358`, Department `24:426`, Team `24:470`, Profile `24:512`, System `24:556`; group `24:354` |
| Approval Requests | Inbox/review composition `24:304`; group `24:300` |
| Components | Catalogue `23:2`; 31 main components on page `2:45`; preserve existing instance links |
| Start here | Overview `25:2` on page `0:1`; update route map rather than leaving conflicting old/new guidance |

Existing page IDs: overview `0:1`, component catalogue `2:45`, feature screens `2:46`. Rename/reorder them to Start here / Product areas / Components when live inspection confirms the mapping. Move whole coherent area groups, then reorganise within each group. Page switches must be handled according to the Figma skill; API retry safety and font loading remain required.

## New design content to prepare

| Item | First-pass anatomy | Status |
|---|---|---|
| Person detail | People breadcrumb; identity summary; Overview / Membership / Recorded leave navigation; permitted edit actions; scoped save/recovery | Owner-requested destination; exact account edit fields still open; not implemented |
| Membership focus | Person and membership GUID context; existing membership fields; read-only derived balances; save/cancel and validation | Existing controls reused in a proposed routed detail context |
| Help & feedback | Help topics and useful navigation; feedback entry with explicit delivery availability | Owner-requested area; delivery channel/form behavior undecided |
| Home / workspace | Idea note only, explaining that Calendar remains the landing screen | DEFERRED; no current screen, primary-nav item or default route |

The shared shell should include Calendar, My leave & balances, People, permitted Approval Requests, Settings and Help & feedback. Include active navigation state appropriate to the current area; do not render every entry as selected. The brand/Home action returns to Calendar under the confirmed temporary landing decision. Public sign-in is outside the authenticated shell.

The person page keeps administrator editing distinct from a future member directory profile. Its GUID links follow the product route design. No private family/medical fields or new account lifecycle actions are introduced by visual organisation.

## Current versus target labels

Use **CURRENT** for existing application behavior and sources; **TARGET DESIGN** for the owner-requested new navigation/person/help destinations; **PROPOSED DETAIL** for unresolved choices; **DEFERRED IDEA** for Home; and **UNVERIFIED** where rendered or runtime evidence is missing. A clean URL printed on a Figma frame does not prove the application serves that URL.

## Acceptance and remaining work

Pending Figma access, verify that each area can be reached from the Start index and the layers panel without scanning unrelated screens; components remain linked; all screens have correct route/actor labels; Home is excluded from current navigation; section bounds contain their children; and no duplicate obsolete overview competes with the new one. Validate catalogue, navigation and person/help compositions visually after mutation.

The existing first-pass file's final layout check remains open. This follow-up does not supersede that limitation. No screenshot, component-link readback or mutation succeeded in this follow-up. Local specification and link checks do not constitute Figma delivery.
