# ADR-0003: Domain model and application services

Status: ACCEPTED  
Date: 2026-10-27  
Owner: Product lead / founder

## Context and source

The founder explicitly requested DDD, the final application structure rather than demo folders, and user/membership services during VAC-13. This corrects the first implementation approach of putting JSON state and business behavior in a Functions router. The earlier implementation checks are historical evidence, not acceptance of that structure.

## Decision

Keep one deployable API with the existing dependency direction:

- `Vacate.Domain`: typed `User`, `Membership` and `Organization` aggregate roots, optional department/team entities, names/family/configuration/balance value objects, business invariants and lifecycle transitions. No HTTP, serialization, EF or Infrastructure dependency.
- `Vacate.Application`: `UserService`, `MembershipService`, `OrganizationService`, access policy, typed commands/read projections and repository/unit-of-work ports. Services authorize and coordinate cross-aggregate rules; they do not store JSON or own transport bindings.
- `Vacate.Infrastructure`: repository/session/credential adapters and opt-in fictional development seed data. The founder-confirmed in-memory store is an adapter behind the final ports; it resets on process restart. SQL infrastructure and production OIDC are still undecided.
- `Vacate.Api`: HTTP parsing, DTO allowlists, status/response mapping, thin feature Functions, and composition/DI. Public resource routes use `/api/users` and `/api/organizations`; memberships belong under their organization. Temporary seeded-account sign-in lives under `/api/auth/sessions` and is separately enabled through a development credential adapter. No `/demo` API or application folders.
- Angular layout paragraph superseded by accepted [ADR-0005](0005-frontend-capability-architecture.md), 2026-11-05. Historical layout: `features` for screens, `core/http` for resource API services, `core/state` for UI/session read state and `testing` for local write doubles. User, membership, organization and session API clients make the real HTTP calls. Existing reference leave catalogue/calendar data remains a separate reference-data adapter; this decision does not approve leave-policy rules or implement leave transactions.

User and membership are separate aggregate roots even when the account read DTO composes one membership. MVP at-most-one active membership and global email uniqueness are enforced in the application/repository transaction boundary. Organization owns optional departments/teams. Entity changes are encapsulated; balance equations and family exclusivity are domain rules. Company authorization and cross-aggregate reference integrity are application rules. API and frontend update together and must have paired verification.

## Identity and use-case naming · founder clarifications, 2026-10-27

Every entity has a numeric `Id` and a separate immutable `Guid`, including users, memberships, organizations, departments and teams. Numeric IDs are storage keys and internal foreign keys; there is no `InternalId` alias. Public API routes and relationship references use GUIDs. Application services resolve GUIDs to entities and authorize their numeric relationships before mutation. A GUID does not replace authorization. Username identifies a sign-in name, never an update target.

Use-case records are named `CreateUser`, `UpdateUser`, `CreateMembership`, etc., without a `Command` suffix. The `Commands` feature folder groups them. Code uses one statement per line, consistent spacing/braces and one blank line between method declarations; comments explain non-obvious rules.

## Consequences

No separate microservices, mediator framework, event sourcing or identity provider is introduced. Application services are in-process use-case services. Moving to a durable repository or OIDC integration must preserve domain/service contracts and access tests. Development sign-in and test data default off; they do not provide production authentication. Timestamp transitions are per aggregate, not a substitute for an immutable audit trail or erasure policy.

## Verification

Domain tests run independently of HTTP/storage and enforce layer dependency boundaries. Integration tests exercise application services through HTTP adapters with real in-memory repositories, including tenant isolation. Paired acceptance starts the actual Functions host and drives the built Angular app.

[VAC-13](../jira/VAC-13-api-backed-settings.md) records implementation and verification. [ADR-0002](0002-azure-static-web-app-and-functions.md) continues to own hosting; database and production identity choices remain open.
