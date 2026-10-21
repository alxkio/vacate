# ADR-0002: Azure Static Web Apps and Functions hosting

Status: ACCEPTED  
Date: 2026-10-21  
Owner: Product lead / founder

## Context

The founder requested Azure Bicep infrastructure, environment configuration and GitHub deployment to a designated subscription/resource group, using the local `alcalc` project as a reference.

## Decision

Host Angular as a static app in Azure Static Web Apps and the .NET 10 API in Azure Functions. Keep infrastructure versioned in Bicep, with environment parameter files and GitHub Actions deployment.

## Consequences

This supersedes the hosting candidates in TechChoices.md. The implementation starts with Flex Consumption and repository-secret service-principal login, matching the requested `alcalc` deployment setup; these are configurable engineering choices. The API host was migrated to the isolated Functions worker on 2026-10-21 for the first cloud release. Infrastructure deployment alone does not deploy or validate the application. Database, application authentication and customer isolation decisions remain open; this decision does not identify an Azure tenant with a customer company.

## Alternatives considered

Ordinary ASP.NET hosting on App Service remains outside the requested hosting direction.

## Evidence and links

- Founder instruction in this session, 2026-10-21: static Angular app, cloud-function API, Bicep environment configuration and GitHub workflow; use `alcalc` as reference.
- [Deployment configuration, acceptance scenarios and open questions](../../infra/README.md).
