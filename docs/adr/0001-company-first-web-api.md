# ADR-0001: Company-first absence product and web/API direction

Status: ACCEPTED  
Date: 2026-10-20  
Owner: Product lead / founder

## Context

Earlier drafts describe a market-first European SaaS and a much larger delivery stack. The founder clarified the intended starting point in the repository review on 2026-10-20.

## Decision

Build an absence-management system for use in the founder's company, with the intention of selling subscriptions. Use an Angular web app and a .NET 10 backend API.

SQL Server is a tentative database preference. Azure free or inexpensive hosting is a goal, not an accepted provider configuration or availability commitment.

## Consequences

Prioritise the company workflow and company-isolation requirements. Confirm detailed scope and authentication before implementation. Earlier market sequencing and broad architecture drafts do not define the first release.

## Alternatives considered

The previous market-first, multi-country and multi-client direction remains exploratory reference material; the founder's current direction takes precedence.

## Evidence and links

- Founder instruction, 2026-10-20: company use, later subscription sales, Angular, .NET 10, probable MSSQL and low-cost Azure hosting.
- [Product charter](../product/product-charter.md)
- [Proposed MVP](../product/mvp-scope.md)
- [Technology proposal](../../TechChoices.md)

## Founder clarification — 2026-10-20

Vacate must support many customer companies, not only the founder's company. Accounts and personnel are manually managed initially. Some customers may later integrate their own identity directory; others can continue using application accounts. A Vacate customer company does not require or correspond directly to a Microsoft Entra tenant. Shared versus separate databases/deployments and cross-company account membership remain unapproved architecture details.

## Founder clarification — 2026-10-20

Vacate must support many customer companies. Accounts and personnel are managed manually initially. Some companies may later integrate their own identity directory; others can continue with application accounts. A customer company in Vacate is not a Microsoft Entra tenant and does not require one. Database/deployment isolation remains an architecture question. The initial account scope is clarified below.

## Founder clarification — initial account scope

Source: founder instruction, 2026-10-20. Owners and employees can in reality belong to more than one customer company, but this scenario is deferred. Initially use company email as the username, unique across Vacate, and reject creation of a new account with the same username. Each account accesses one company in the initial scope. Do not implement shared multi-company accounts or company switching yet. Normalisation and email-change/recovery behaviour remain open implementation details.

## Founder clarification — account and company roles, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. A user can conceptually be a member/employee in several companies. Each company membership owns its system role (`employee` or `admin`) and a distinct job role. Multiple job roles per user/company remain undecided. For the mock/MVP, retain one company membership per user account; a company can have many users. Multi-company operations and company switching remain deferred. This clarifies the future model without expanding initial implementation scope or changing the globally unique company-email username decision. The [user draft](../contracts/user.md) flattens the single membership fields for review; field representations and optional business columns remain proposals.

## Founder clarification — membership and policy floor, 2026-10-26

Source: subsequent founder schema review and company/organization clarification, 2026-10-26. Supersedes the earlier flattened membership representation: keep company and employment data under one `membership` object for mock/MVP. Company and organization are the same entity, so retain only `companyId`. Company, system-role and job-role references are GUIDs. Retain the suggested organization/employment/schedule/calendar/policy fields; employer records `priorService` in years before the current employer at hiring. Account unknown married/child-count/sole-care inputs default to false/zero/false; married and sole care remain mutually exclusive. The draft uses a married boolean instead of a marital-state enum and documents the loss of that distinction. Balance allocation defaults to the experience-policy qualifying amount; an employer custom allocation cannot be below that minimum. Allocation is distinct from remaining balance after use. These are product contract directions, not approved statutory values, a specific identity-provider choice or authorization to implement backend policy. See the [draft 0.3](../contracts/user.md) for unresolved balance period/type, policy updates, fractional years and access decisions. Existing mock fixtures/evaluator remain unchanged.

## Founder clarification — invitation-based membership, 2026-10-26

Source: founder schema-review instruction, 2026-10-26. An administrator invitation to a company/organization/team precedes assignment of the user's company membership. Company and organization remain the same entity; team references must belong to the target company. The MVP draft allows an unassigned account (membership null), then at most one assigned company membership; account existence is not company authorization. This extends the manually administered account/personnel direction without approving public signup, company switching or multi-company membership. Exact assignment/activation timing relative to invitation acceptance and first-admin provisioning remain open in the [contract](../contracts/user.md#invitation-based-membership-assignment). No invitation delivery is implemented or authorized by this documentation revision.

## Founder clarification — broader organization concept, 2026-10-26

Source: founder instruction during organization implementation, 2026-10-26. Organizations may be companies with departments/teams/groups or standalone teams, potentially cross-company. The founder explicitly deferred designing that differentiator. This supersedes earlier company=organization wording as a universal domain rule; it remains only the current company-shaped MVP mapping. Existing company isolation, one assigned company membership per account and company-admin checks are not relaxed. Generic organization types, memberships, role boundaries, employer relationships and cross-company sharing require later accepted design before implementation. [Charter direction](../product/product-charter.md#founder-clarification--organizations-beyond-companies-2026-10-26).

## Founder clarification — optional internal structure, 2026-10-26

Source: founder instruction, 2026-10-26. No department/group/team hierarchy is compulsory. An organization may have none of those structures, and internal structure must adapt to it. The current administration read model keeps departments and teams independent with nullable team.departmentId rather than requiring a department for every team; organization membership does not require a team. This does not establish a generic graph, cross-company permissions or new hierarchy mutations. Existing fixtures remain a single illustrative layout.
