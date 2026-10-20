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
