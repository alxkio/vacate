# Technology choices

**Updated:** 2026-10-20. Angular and .NET 10 reflect founder direction; other choices below are **PROPOSED** unless stated. Original material is retained in [the archive](docs/archive/technology-original.md) and is superseded as implementation guidance.

## Small starting architecture

Angular web app -> ASP.NET Core .NET 10 REST API -> one relational database.

- Angular: standalone components, routing, reactive forms, local signals/services. Choose a supported Angular release and its compatible Node/TypeScript versions when scaffolding; pin them then. No global NgRx store unless a demonstrated need appears.
- API: one deployable application, organised by feature: people, leave, approvals and availability. Keep business rules testable without adding separate services, a mediator or event sourcing.
- Database: SQL Server family preferred; evaluate Azure SQL Database with EF Core 10 and its SQL Server provider. Database selection is still open.
- Ordinary relational transactions for requests, reservations, balance movements and audit records. Handle concurrency and repeated submissions/decisions explicitly.
- REST and OpenAPI only. Start with one API contract, without a speculative multi-version compatibility promise.
- Identity: manually managed application accounts initially. Personnel records and sign-in accounts are separate: adding an employee need not create a login. Optional company directory/Entra integration is later scope; no Microsoft tenant is required to use Vacate. The authentication implementation remains OPEN QUESTION. Do not build an identity provider. Choose the browser session/token approach together with hosting; cookie sessions need CSRF protection, and separate origins need deliberate CORS configuration.

.NET 10 is an LTS release supported through November 2028: [Microsoft support policy](https://dotnet.microsoft.com/en-us/platform/support/policy), checked 2026-10-20.

## Subscription readiness

**CONFIRMED:** Vacate must support many customer companies, with manually created accounts and personnel initially. A customer company is a Vacate business boundary, not a Microsoft Entra tenant. Directory integration is optional later.

**PROPOSED:** One shared application and database, with CompanyId on company-owned data. Physical deployment/database isolation remains an architecture choice, not a founder decision. Initial accounts belong to one company, with company email as a globally unique username; duplicate usernames are rejected. Multi-company owner/employee membership and company switching are deferred. Confirm legal-employer boundaries before defining the schema. Username normalisation and email-change/recovery handling remain implementation questions; enforce the agreed uniqueness rule in the database as well as the API.

Resolve company access from authenticated membership, authorise on the server, scope every data path, and use company-consistent relationships/constraints. A client-supplied company identifier is not proof of access. Verify two-company isolation for reads, writes, calendars, exports and administration. Query filters alone are not the complete boundary.

Keep commercial billing separate from leave entitlement. Manual customer onboarding and subscription administration can precede a payment integration.

## Azure starting options

These are hosting candidates, not a deployment plan or a promise of zero cost. Official sources checked 2026-10-20; actual subscription/region availability remains UNVERIFIED.

| Component | Candidate | Practical limit |
|---|---|---|
| Angular assets | Azure Static Web Apps Free | No SLA; Microsoft positions Free for personal projects and Standard for production. A separate ASP.NET API still needs hosting. |
| .NET API | Azure App Service Free for development/evaluation | Shared compute, quota constraints and no scale-out. Verify .NET 10 runtime availability on the selected platform before deployment. |
| Database | Azure SQL Database free offer | Monthly compute/storage allowance; configure pause at the limit to prevent database overage charges, accepting downtime. |

Azure SQL's allowance is 100,000 vCore-seconds, 32 GB data and 32 GB backup storage per database per month. It can pause until the next calendar month when exhausted, or continue with paid usage. The paid-overage option cannot be reverted to the pause-until-next-month option under the documented offer. Open connections can prevent idle auto-pause. These limits suit evaluation only if observed workload fits; employee count alone cannot establish suitability.

For the simplest deployment, also evaluate serving Angular's built assets from the API in one App Service app. This avoids a separate frontend origin, but couples releases. Split hosting remains an option; Static Web Apps does not itself host an ordinary ASP.NET Core API.

Before relying on this for company operations, agree acceptable outages and restore requirements, measure usage, verify backups/restores, and budget for paid hosting if necessary. Email, monitoring, domains and other services may add charges; a budget alert does not cap all Azure spending.

Sources: [Azure SQL free offer](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer?view=azuresql), [Static Web Apps plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans), [App Service plans](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans).

## Keep out until justified

Redis, RabbitMQ/Service Bus, GraphQL, event sourcing, mandatory CQRS, Hangfire, Kubernetes, Front Door, native mobile apps, LaunchDarkly and a dedicated analytics platform. Use an audit table rather than assuming audit needs require event sourcing. Add durable job delivery only when notifications or scheduled work enter scope; an in-memory queue cannot guarantee delivery after restart.

## Verification and operations

- Unit tests for agreed date/balance rules; SQL Server integration tests for isolation, constraints, transactions and concurrency.
- Browser tests for sign-in, submission, decision and permitted calendar visibility.
- Server-side authorisation, validation, safe error responses, protected secrets and logs without request bodies or sensitive leave details.
- Review migrations before applying them; define backup/restore and rollback procedures rather than promising automatic migration rollback.
- CI should build and run relevant checks. No arbitrary coverage, performance or availability promises before requirements exist.
