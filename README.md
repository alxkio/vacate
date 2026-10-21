# Vacate

Vacate is an absence-management system, initially for the founder's company, with the intention of offering it as a subscription product for many customer companies. Accounts and personnel will be created manually initially; optional company directory integration can follow. A Microsoft tenant is not required.

**Confirmed direction (2026-10-20):** Angular web app and a .NET 10 API. [ADR-0002](docs/adr/0002-azure-static-web-app-and-functions.md) confirms Azure Static Web Apps and Azure Functions hosting. SQL Server / Azure SQL is the preferred database candidate; Azure hosting should start as cheaply as practical. Database selection remains open.

## Start here

1. [Product charter](docs/product/product-charter.md) — confirmed intent and remaining questions.
2. [MVP scope](docs/product/mvp-scope.md) — proposed smallest useful company pilot.
3. [Technology choices](TechChoices.md) — small architecture and Azure hosting options.
4. [Repository review](docs/review-2026-10-20.md) — findings, simplifications, and next steps.
5. [Cloud deployment](infra/README.md) — first release configuration, publishing and verification.
6. [Documentation map](docs/README.md) — domain, evidence, privacy, and decisions.

There is only a walking skeleton (health endpoint, empty feature folders, placeholder pages) and no business logic. Validate the company workflow before building features. Existing market research and the original domain material are exploratory references, not implementation requirements.

## Repository layout

**PROPOSED** structure, informed by [reference codebase conventions](docs/reference/reference-codebase-conventions.md); open points are listed there.

```text
api/                          .NET 10 solution (Vacate.slnx), central package management
  src/Vacate.Domain/          business rules, by feature: People, Leave, Approvals, Availability
  src/Vacate.Application/     use cases, by the same features
  src/Vacate.Infrastructure/  EF Core / SQL Server persistence
  src/Vacate.Api/             Azure Functions isolated host: HTTP functions and liveness
  tests/Vacate.UnitTests/     business-rule tests
  tests/Vacate.IntegrationTests/  API and SQL Server tests
web/                          Angular app (standalone, signals, lazy feature routes)
  src/app/core/              app-wide singletons: layout/ (shell and navigation), http/, guards/
  src/app/shared/            reusable UI: components/, pipes/, models/, utils/
  src/app/<feature>/         people, leave, approvals, availability: routes, components/, models/, services/
docs/                         product, domain, compliance, decisions, reference
```

Run the API with Azure Functions Core Tools (`func start --port 7071` from `api/src/Vacate.Api`; see [API setup](api/README.md)) and `npm start` in `web/`. Angular proxies `/api` to the local Functions host. The first cloud release needs no database. See [cloud deployment setup](infra/README.md) for the GitHub repository-secret setup and first deployment procedure.

## Tests (TODO)

Existing checks cover the health function contract, a real Functions HTTP host in CI, Angular shell and runtime API configuration. Deployment smoke checks verify public HTTP endpoints, release revisions, SPA routes and CORS. Everything below is planned, not implemented. Run what exists with `dotnet test api/Vacate.slnx` and `npm test` in `web/`.

- **Unit (`api/tests/Vacate.UnitTests`):** leave rules once the company rules are confirmed: non-working days excluded, unsupported ranges rejected without changing balance, reserved balance becomes used exactly once on approval and is released exactly once on rejection or allowed cancellation ([MVP scenarios 2-3](docs/product/mvp-scope.md)).
- **Integration, SQL Server (`api/tests/Vacate.IntegrationTests`):** two-company isolation for reads, writes, calendars, exports, administration and audit, including guessed identifiers; simultaneous requests cannot overspend a balance; only the assigned approver can decide; duplicate username rejected without disclosing the other company (scenarios 4, 6, 7). Also constraints and transactions.
- **Frontend (`web`):** add feature component tests once behavior exists; current tests cover the shell, runtime settings and API request origin.
- **Browser:** sign-in, submission, decision and permitted calendar visibility ([TechChoices](TechChoices.md)). The tool is an **OPEN QUESTION**.
- **ASSUMPTION:** test style follows the reference conventions (behaviour-named tests, Arrange-Act-Assert, real collaborators, mocks only at external boundaries). Confirm before writing the first test.
