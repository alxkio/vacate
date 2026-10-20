# Reference codebase conventions

**Status:** REFERENCE, not a decision. Observed 2026-10-20 in a local checkout of a larger, non-public .NET and Angular monorepo to inform the [Vacate repository layout](../../README.md#repository-layout). Nothing here is ACCEPTED for Vacate; where Vacate diverges, see [Parts to rethink](#parts-to-rethink).

**Handling note:** This file records structure and conventions only. No code was copied, and project, package and vendor names are deliberately generalised (`<Service>`, `<Module>`, `<Feature>`).

## What was examined

| Area | Why |
|---|---|
| Older API, single project | Example named by the founder |
| Newer service, layered projects | Current .NET 10 service shape |
| Vertical-slice feature module | Current module shape |
| Angular app | Frontend conventions |
| Repo-level instructions and architecture notes | Written conventions |

Not examined: authentication/identity code, tenant/company isolation, CI workflow contents, runtime behaviour, and the business logic of any project. **UNVERIFIED** whether the written conventions are followed consistently.

## Repository-level conventions

- One large monorepo with separate areas for web apps, feature modules, services, shared domain/infrastructure libraries and shared packages, plus documentation, infrastructure and deployment-script folders.
- .NET: `net10.0` mandated for new projects; `Nullable` and `ImplicitUsings` on; `RestorePackagesWithLockFile` on; Central Package Management (`Directory.Packages.props`, `ManagePackageVersionsCentrally`); package-source mapping per feed; an automated dependency-update bot. Modules add `Directory.Build.props` with `TreatWarningsAsErrors`.
- Solutions use the `.slnx` format, one per service/module, with solution folders (for example `/Tests/`, `/Tools/`).
- Per-service database project in a SQL source-control layout: `Migrations/`, `Schema-Model/`, `Programmable Objects/`, `Pre-Deployment/`, `Post-Deployment/`.
- Governance files at the root: `.editorconfig`, pre-commit config, code owners, PR template, version config, dependency-bot config. Commits are signed off (`git commit -s`); PRs stay single-scope.
- ADRs exist both centrally and per service (`<Service>/Documentation/adr`).

## .NET project shapes

### A. Older API (single project)

One project with layer folders inside it:

```text
Application/      services, DTOs, use-case folders (CreateUser/...)
Domain/           Entities, ValueObjects, Contracts/Enums
Infrastructure/   Repositories, DataModels, UnitOfWork, Extensions, Contracts/ApiResult
Presentation/     Controllers, Models (requests), Middleware, Filters, Factory, Configuration
```

Notable: `ApiResult` wrapper plus ProblemDetails factory, repository and unit-of-work abstractions, auth/IP middleware.

### B. Layered service (projects per layer, use-case folders)

```text
<Service>.Domain/
<Service>.Application/      ~40 folders, one per use case (CancelOrder/, GetOrders/, ...)
                            each may contain DTO/, Messaging/, Services/, Notifications/
<Service>.Infrastructure/   (+ provider-specific projects, for example <Service>.Infrastructure.<Provider>)
<Service>.Presentation/     Program.cs, Controllers/, Extensions/, Health/, Interceptors/GlobalExceptionHandler, Filters/
Tests/                      <Service>.UnitTests, <Service>.IntegrationTests, <Service>.TestFramework
<Service>/                  database project, Documentation/adr
```

Notable: layers are projects; inside `Application` the organisation is by use case, not by technical type.

### C. Feature module (vertical slice per feature)

```text
<Module>/<Module>/<Feature>/Application/<UseCase>/   Command, CommandHandler, AccessControl, Response, DTO
                  <Feature>/Domain/
                  <Feature>/Persistence/              DbContext, repositories, EntityConfigurations/
                  <Feature>/PublicAPI/                the only surface other modules may call
                  SPI/                                interfaces the module needs from others
<Module>/<Module>.Adapters/                           implements the SPI against other modules
```

Notable: MediatR commands/queries; an explicit `AccessControl` class per use case; EF Core + SQL Server; module boundaries enforced at build time with NsDepCop (`WarningsAsErrors=NSDEPCOP01`); repositories split into read/write (`IReadOnly...Repository`).

## Written code and test conventions

- C#: PascalCase public, `_camelCase` private readonly DI fields, `I` prefix, `Async` suffix, file-scoped namespaces, `is null`, `nameof`, XML docs on public APIs; no inline SQL in C#; repositories for data access; global exception handler for consistent error responses; structured logging; never log secrets or PII; validate at boundaries.
- Architecture notes: vertical slice (organise by use case, rule of three, share domain models but not slice code), functional over categorical cohesion, domain-centric/DDD, clean architecture, CQRS alignment.
- Testing guidelines: test behaviour not implementation; one Arrange-Act-Assert per test; behaviour-named tests; prefer real collaborators and mock only at architectural boundaries; inject time; per-role tests for access-controlled operations; flag untested security-critical changes first.
- Test stack seen in central package versions: NUnit (dominant), xunit, Moq, Shouldly, `Microsoft.AspNetCore.Mvc.Testing`, `Testcontainers.MsSql`.

## Angular app

- Angular 21.2.x with standalone components; Zone-based change detection (`provideZoneChangeDetection`); a component library and an icon library; NgRx store/effects; Karma tests.
- Angular workspace with extra projects under `projects/` (a design system and a second app) beside the main app in `src/`.
- Source layout: `src/app/{core,shared,state,store,<feature>...}`; features sit at the app root next to `core` and `shared`.
- Feature shape: `<feature>/{components,models,shared,store/{actions,effects,reducers,selectors}}` plus `<feature>.routes.ts`; route-level `providers` register `provideState`/`provideEffects`; features are lazy routes.
- `shared/` is split by kind: components, directives, pipes, guards, interceptors, services, models, enums, constants, utils.
- `tsconfig`: path alias `src/*`; `strict: false`, but `strictTemplates` on and `unusedStandaloneImports` as error.
- Tooling: ESLint with custom rules, stylelint, Prettier, `proxy.conf.js` for local API calls, and in-repo docs (`documentation/{getting-started,build,automated-testing,decision}`).

## Parts to rethink

| Topic | Reference codebase | Vacate scaffold | Reason / question |
|---|---|---|---|
| Mediator | MediatR commands/queries | Plain handler classes called by controllers | [TechChoices](../../TechChoices.md) says no mediator. **ASSUMPTION:** revisit if cross-cutting behaviour accumulates. |
| Deployables | Many services and modules | One deployable API | One small architecture per TechChoices. |
| Module boundaries | Separate projects, PublicAPI/SPI, NsDepCop | Four projects (Domain, Application, Infrastructure, Api), feature folders inside | **OPEN QUESTION:** enforce feature boundaries with NsDepCop or architecture tests, or keep convention only? |
| Layer vs slice | Both: layered projects with use-case folders | Same, copied from the layered-service shape | Confirm this suits a small team. |
| Database change control | SQL project with migrations | None yet | **OPEN QUESTION:** EF Core migrations vs a SQL project; TechChoices requires reviewed migrations and restore procedures. |
| Company isolation | Not examined | Not scaffolded | **OPEN QUESTION:** Vacate needs `CompanyId` on every data path and two-company tests; the reference approach is **UNVERIFIED**. |
| Identity | Internal security packages, a commercial identity server | None | Authentication is an **OPEN QUESTION**; do not build an identity provider. |
| Internal packages | Private NuGet feed (observability, context, feature toggles, security) | Not available | Use framework equivalents; do not assume parity. |
| Access control | An `AccessControl` class per use case | Not scaffolded | Strong fit for Vacate's server-side authorisation; decide the pattern before the first slice. |
| API versioning | Guidelines ask for it | Single contract, no versioning promise | TechChoices decision. |
| Controllers | Controllers | Controllers | Minimal APIs are an alternative; no reason to switch yet. |
| Frontend state | NgRx everywhere | Signals and services | TechChoices: no global NgRx until a demonstrated need. |
| Change detection | Zone-based | Use the Angular default of the chosen release | New app; no legacy constraint. |
| TypeScript strictness | `strict: false` | `strict: true` | New app; cheaper to start strict. |
| Feature folder location | At app root | At app root (same) | Alternative is a `features/` folder. Cosmetic; decide once. |
| Angular version | 21.2.x | Latest stable at scaffold time | TechChoices: pin the supported release when scaffolding. |
| Tests | NUnit and Moq dominant | NUnit; real collaborators, mocks only at boundaries | Matches the reference testing guidelines; SQL Server integration tests required by TechChoices. |
| Delivery tooling | Deployment orchestration, SQL source control, security scanning, version tooling, dependency bot | Not adopted | Choose with the hosting decision. |
| NuGet sources | Private feed mapped beside nuget.org | `api/nuget.config` clears user-level feeds and maps nuget.org only | The user-level config on this machine includes a private company feed, which broke central package management (NU1507) and should not leak into Vacate. |

## Source and date

All observations come from the local checkout on 2026-10-20; the commit was not recorded, so treat details as a snapshot.
