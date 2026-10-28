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

The frontend is an interactive Angular prototype with fictional logins, calendar alternatives, personal balances and provisional leave eligibility. The API now supports fictional account, membership and organization CRUD through typed domain/application services and in-memory repositories. Production OpenID identity, durable persistence and leave submission remain open. Validate the company workflow before implementing those features. Existing market research and the original domain material are exploratory references, not implementation requirements.

## Repository layout

The agreed application roots are `frontend/` for Angular and `api/` for the .NET/Azure Functions backend (confirmed 2026-10-25).

Current application folders follow the accepted Angular/API direction, informed by [reference codebase conventions](docs/reference/reference-codebase-conventions.md); open points are listed there.

```text
api/                          .NET 10 solution (Vacate.slnx), central package management
  src/Vacate.Domain/          user, membership and organization aggregates/value objects
  src/Vacate.Application/     feature services, use-case records and repository ports
  src/Vacate.Infrastructure/  in-memory adapters and optional fictional seed data; SQL scaffold
  src/Vacate.Api/             Azure Functions isolated host: HTTP functions and liveness
  tests/Vacate.UnitTests/     business-rule tests
  tests/Vacate.IntegrationTests/  HTTP adapter and authorization/lifecycle tests
frontend/                     Angular app (standalone, signals, lazy feature routes)
  src/app/features/          auth, profile, organizations, workspace, calendar and leave views
  src/app/core/              resource HTTP clients, UI state/models and reference leave data
  src/app/shared/            reusable UI: components/, pipes/, models/, utils/
  testing/                  explicit component fixtures and write doubles
docs/                         product, domain, compliance, decisions, reference
```

Run the API with Azure Functions Core Tools (`func start --port 7071` from `api/src/Vacate.Api`; see [API setup](api/README.md)) and `npm start` in `frontend/`. Angular proxies `/api` to the local Functions host. The first cloud release needs no database. See [cloud deployment setup](infra/README.md) for the GitHub repository-secret setup and first deployment procedure.

## Verification and future tests

Existing checks cover domain invariants/layering, health/resource HTTP contracts, tenant isolation, CRUD/lifecycle, all 12 fictional profiles, Angular services/components and complete browser acceptance against a real Functions host. [VAC-13 evidence](docs/jira/media/VAC-13/verification.md) records the paired implementation. See [frontend commands](frontend/README.md#acceptance). Deployment smoke checks verify the Angular entry/bundles, configuration, revisions and routes; full API releases also verify liveness/CORS. Leave transactions and SQL-backed acceptance below remain planned. Run `dotnet test api/Vacate.slnx` and `npm test` in `frontend/` for the existing unit/integration checks.

- **Unit (`api/tests/Vacate.UnitTests`):** leave rules once the company rules are confirmed: non-working days excluded, unsupported ranges rejected without changing balance, reserved balance becomes used exactly once on approval and is released exactly once on rejection or allowed cancellation ([MVP scenarios 2-3](docs/product/mvp-scope.md)).
- **Integration, SQL Server (`api/tests/Vacate.IntegrationTests`):** two-company isolation for reads, writes, calendars, exports, administration and audit, including guessed identifiers; simultaneous requests cannot overspend a balance; only the assigned approver can decide; duplicate username rejected without disclosing the other company (scenarios 4, 6, 7). Also constraints and transactions.
- **Frontend (`frontend`):** add feature component tests once behavior exists; current tests cover runtime settings, HTTP clients/state, profile, membership and organization editing.
- **Browser:** the committed Chrome DevTools acceptance suite verifies fictional sign-in, calendar visibility, balances and guarded previews. Real submission/approval and production permissions still need their own end-to-end acceptance.
- **ASSUMPTION:** test style follows the reference conventions (behaviour-named tests, Arrange-Act-Assert, real collaborators, mocks only at external boundaries). Confirm before writing the first test.
