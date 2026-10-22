---
id: VAC-1
type: story
summary: Deliver the Azure-hosted Vacate foundation and interactive leave mock
status: released
created: 2026-10-22
updated: 2026-10-23
parent: null
depends_on: []
---

# VAC-1 — Deliver the Azure-hosted Vacate foundation and interactive leave mock

![Story](badges/story.svg) **🚀 Released** · Azure dev · Retrospective record

## Description

As the product lead, I want a working cloud-hosted Vacate foundation and an interactive absence-calendar mock so that I can review the user experience before choosing a design and building real employee workflows.

This single retrospective story summarizes work already delivered, including discovery/context preparation, the Angular/.NET foundation, Azure infrastructure and the released synthetic UI. It is deliberately broad to seed the requested one-story backlog; future stories should describe smaller outcomes. This record was created on 22 October, not at the start of the historical work.

## Delivered scope and boundaries

The Angular shell and .NET 10 Functions health endpoint are built in CI and deployed with Bicep environment configuration and GitHub Actions. The dev site opens a mock login (`user / user`, `admin / admin`), then the root calendar, while retaining Angular deep links. It includes a teal v favicon and three UI alternatives with own/team/organization scopes and year/month/week/day views.

The approved catalogue contains 29 entries and 28 requestable choices, with allowance/rule previews, fictional examples and expandable per-type balances. The mock uses a five-day, Monday–Friday workweek. Units and periods remain separate; disability supplements explain an annual-allocation adjustment. Shared calendars show generic availability. Requests preview without saving or changing balances.

Real authentication, a database, employee APIs, approvals, statutory entitlement calculations and production company isolation are outside the released mock scope. UI direction and company policy decisions remain open.

## Dependencies

None. This retrospective story records the released foundation. Later stories build on it; they are not prerequisites for this release.

## Acceptance scenarios and evidence

- [x] Given an anonymous visitor, opening the site shows the mock login; both exact demo credential pairs land on the root calendar, invalid credentials fail, and sign-out clears the tab session. [Browser evidence](../design/calendar-mock/README.md).
- [x] Given a signed-in demo account, switching scopes and four granularities renders the selected view across the A/B/C study; mobile layouts fit at 375 px. [Acceptance checks and previews](../design/calendar-mock/README.md).
- [x] Given a leave type selection, its allowance/rule panel updates; configured allocations show exact Used/Pending/Available quantities and percentages; unknown or mismatched units do not invent a balance. Previews do not persist requests. [Release verification](../release-2026-10-22-leave-mock.md).
- [x] Given shared calendar views/details, colleague fixtures expose availability without private leave types or approval status. Real cross-company authorization remains untested because no employee API/data exists. [Review](../release-2026-10-22-leave-mock.md).
- [x] Given the designated dev deployment, hosted frontend/backend checks, Bicep compilation, publishing and deployed revision/configuration/CORS/route checks succeed. [Deployment run](https://github.com/alxkio/vacate/actions/runs/39841444632).
- [x] Given reversed request dates, correcting either date clears the old validation error and permits a valid preview. [Independent review and regression](../release-2026-10-22-leave-mock.md).

## Subtasks and responsibilities

### Product and UX

- [x] Product-1: Record company-first direction and Azure hosting in accepted ADRs.
- [x] UX-1: Present A/B/C alternatives and defer final direction selection.
- [x] Product-2: Review the leave catalogue/rules before applying the approved mock changes.

### UI

- [x] UI-1: Deliver the calendar views, scope switching, fictional fixtures and request preview.
- [x] UI-2: Add mock login/root landing, logout and favicon.
- [x] UI-3: Add catalogue choices, rule panels and expandable balance bars with distinct units.

### Backend

- [x] API-1: Establish the .NET 10 isolated Functions host and health/build-revision contract.
- [x] API-2: Package and verify the actual Functions host in hosted CI; configure frontend CORS.

### Database

Not applicable to the released mock: no database was provisioned and no request or employee data is stored. Database design remains future work.

### Infrastructure and operations

- [x] Ops-1: Add Bicep/environment targets and repository-secret service-principal deployment.
- [x] Ops-2: Deploy to `rg-vacate-dev` and configure minimal operational diagnostics.
- [x] Ops-3: Package the gallery at the root, preserve Angular deep links, and stamp/check revisions.

### QA and review

- [x] QA-1: Pass hosted Angular/API builds/tests and Functions-host checks.
- [x] QA-2: Pass local browser acceptance, shared-detail privacy, mobile overflow and package checks.
- [x] QA-3: Resolve the independent review's date-validation finding; publish and verify dev endpoints.
- [x] QA-4: Record founder confirmation that the deployed version works. Local interactive Chrome checks were not repeated against the live site in this release.

## Attachments and sources

- [Accepted product direction](../adr/0001-company-first-web-api.md) · [accepted hosting](../adr/0002-azure-static-web-app-and-functions.md).
- [First dev deployment](../cloud-deploy-2026-10-22.md) · [latest release record](../release-2026-10-22-leave-mock.md).
- [Approved mock leave catalogue](../product/leave-types-review.md) · [balance design](../design/leave-balances-proposal.md) · [policy-source register](../compliance/policy-sources.md).
- [Desktop screenshot](../design/calendar-mock/previews/a-desktop.png) · [mobile screenshot](../design/calendar-mock/previews/a-mobile.png). Existing evidence is linked without copying it into another media folder.
- [Time evidence report](../time-spent-evidence.md) · [timestamp evidence CSV](../time-spent-evidence.csv).

## Comments

| Entry | Date | Author / role | Comment / evidence |
|---|---|---|---|
| C-001 | 2026-10-22 | Founder; retrospective paraphrase | Keep UI alternatives open and publish the mock for review. [Release context](../cloud-deploy-2026-10-22.md). |
| C-002 | 2026-10-22 | Independent QA/privacy reviewer; retrospective | Found a stale date-validation error; correction and regression were reviewed, with no remaining synthetic-demo blockers. [Record](../release-2026-10-22-leave-mock.md). |
| C-003 | 2026-10-22 | Founder; retrospective paraphrase | Confirmed the deployed version was working. [Record](../release-2026-10-22-leave-mock.md). |

## Decisions

| Entry | Date | State / source | Decision |
|---|---|---|---|
| D-001 | 2026-10-20 | Accepted; [ADR-0001](../adr/0001-company-first-web-api.md) | Company-first absence product using Angular and .NET 10; broader customer support remains an architectural requirement. |
| D-002 | 2026-10-21 | Accepted; [ADR-0002](../adr/0002-azure-static-web-app-and-functions.md) | Azure Static Web Apps and Functions, versioned Bicep and GitHub deployment. |
| D-003 | 2026-10-22 | Founder-approved mock; [summary](../product/leave-types-review.md) | Apply reviewed type/rule previews and expandable balances using a five-day workweek. This is not approval of statutory defaults. |
| D-004 | 2026-10-22 | Founder choice; [mock boundaries](../design/calendar-mock/README.md) | Use the teal v favicon; leave A/B/C selection open. |

## Work log

Retrospective reconstruction from the existing timestamp audit, not a human timesheet. The two disjoint entries below own this historical measurement; future issues must not import the same session durations as additional time.

| Entry | Date / range, Athens | Actor / category | Activity | Duration | Basis / evidence |
|---|---|---|---|---|---|
| WL-001 | 2026-09-03–2026-09-05 | Codex / assistant recorded | Discovery, design and setup in included project sessions | 0h 47m 24s | Logged root-turn `duration_ms`; [audit and scope](../time-spent-evidence.md), [rows](../time-spent-evidence.csv) |
| WL-002 | 2026-10-20–2026-10-22 | Codex / assistant recorded | Foundation checks/planning, cloud preparation, mock implementation and release work | 5h 44m 12s | Logged root-turn `duration_ms`; same audit, separate date range |

**Assistant recorded total: 6h 31m 36s** (rounded to seconds; 23,495,733 ms in the source). **Human actual: Unknown. Estimates: none entered. Automation elapsed: not separately logged here.** The audit's 15h 22m 49s of request start/end windows is a different measurement and is not added. Parallel agents, older unrecorded work and this new issue-process setup are not additional entries in these totals. See the audit's limitations before using the number as project effort.

## History

| Date | Actor | Status / change |
|---|---|---|
| 2026-10-22 | Codex | Retrospectively created VAC-1 directly as Released, based on existing review, acceptance, deployment and founder-confirmation evidence. No historical transition timestamps were invented. |

- 2026-10-23 · Codex: Recorded direct dependency metadata and prerequisite outputs; kept coordination links non-blocking. Status unchanged.

## Verification and release

Released to **Azure dev**, not declared production-ready. Application revision: `775e54ae447f4334ba5e47e566238c76480f309d`; follow-up evidence commit: `591a523`.

- [Live site](https://lemon-beach-02f7a7103.4.azurestaticapps.net).
- [Successful CI](https://github.com/alxkio/vacate/actions/runs/39840561066).
- [Successful deployment and cloud smoke](https://github.com/alxkio/vacate/actions/runs/39841444632).

## Open questions and follow-up

UI direction, real identities/permissions, employee data model, company isolation, policy eligibility, accrual, carryover, rounding and holiday calendars remain open. They do not reopen this synthetic release's bounded scope. Ideas in [next-up.md](../next-up.md) remain notes until explicitly turned into new issues; none were added to this initial backlog.
