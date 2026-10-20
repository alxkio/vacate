# Vacate

Vacate is an absence-management system, initially for the founder's company, with the intention of offering it as a subscription product for many customer companies. Accounts and personnel will be created manually initially; optional company directory integration can follow. A Microsoft tenant is not required.

**Confirmed direction (2026-10-20):** Angular web app and an ASP.NET Core .NET 10 API. SQL Server / Azure SQL is the preferred database candidate; Azure hosting should start as cheaply as practical. Database and hosting selection remain open.

## Start here

1. [Product charter](docs/product/product-charter.md) — confirmed intent and remaining questions.
2. [MVP scope](docs/product/mvp-scope.md) — proposed smallest useful company pilot.
3. [Technology choices](TechChoices.md) — small architecture and Azure hosting options.
4. [Repository review](docs/review-2026-10-20.md) — findings, simplifications, and next steps.
5. [Documentation map](docs/README.md) — domain, evidence, privacy, and decisions.

There is only a walking skeleton (health endpoint, empty feature folders, placeholder pages) and no business logic. Validate the company workflow before building features. Existing market research and the original domain material are exploratory references, not implementation requirements.

## Repository layout

**PROPOSED** structure, informed by [reference codebase conventions](docs/reference/reference-codebase-conventions.md); open points are listed there.

```text
api/                          .NET 10 solution (Vacate.slnx), central package management
  src/Vacate.Domain/          business rules, by feature: People, Leave, Approvals, Availability
  src/Vacate.Application/     use cases, by the same features
  src/Vacate.Infrastructure/  EF Core / SQL Server persistence
  src/Vacate.Api/             ASP.NET Core host: controllers, error handling, health, OpenAPI
  tests/Vacate.UnitTests/     business-rule tests
  tests/Vacate.IntegrationTests/  API and SQL Server tests
web/                          Angular app (standalone, signals, lazy feature routes)
  src/app/core/              app-wide singletons: layout/ (shell and navigation), http/, guards/
  src/app/shared/            reusable UI: components/, pipes/, models/, utils/
  src/app/<feature>/         people, leave, approvals, availability: routes, components/, models/, services/
docs/                         product, domain, compliance, decisions, reference
```

Run the API with `dotnet run --project api/src/Vacate.Api` (http://localhost:5126, `/health`) and the web app with `npm start` in `web/` (proxies `/api` to the API). The development connection string targets LocalDB.

## Tests (TODO)

Only smoke tests exist: the API `/health` integration test and the generated Angular app spec. Everything below is planned, not implemented. Run what exists with `dotnet test api/Vacate.slnx` and `npm test` in `web/`.

- **Unit (`api/tests/Vacate.UnitTests`):** leave rules once the company rules are confirmed: non-working days excluded, unsupported ranges rejected without changing balance, reserved balance becomes used exactly once on approval and is released exactly once on rejection or allowed cancellation ([MVP scenarios 2-3](docs/product/mvp-scope.md)).
- **Integration, SQL Server (`api/tests/Vacate.IntegrationTests`):** two-company isolation for reads, writes, calendars, exports, administration and audit, including guessed identifiers; simultaneous requests cannot overspend a balance; only the assigned approver can decide; duplicate username rejected without disclosing the other company (scenarios 4, 6, 7). Also constraints and transactions.
- **Frontend (`web`):** component tests for each feature page once it has behaviour; keep the generated app spec.
- **Browser:** sign-in, submission, decision and permitted calendar visibility ([TechChoices](TechChoices.md)). The tool is an **OPEN QUESTION**.
- **ASSUMPTION:** test style follows the reference conventions (behaviour-named tests, Arrange-Act-Assert, real collaborators, mocks only at external boundaries). Confirm before writing the first test.
