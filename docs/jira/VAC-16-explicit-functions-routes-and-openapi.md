---
id: VAC-16
type: task
summary: Expose each API path and HTTP method as a separate Azure Function
status: qa
created: 2026-10-28
updated: 2026-10-28
parent: null
depends_on: []
---

# VAC-16 — Expose each API path and HTTP method as a separate Azure Function

![Task](badges/task.svg) **🔍 QA** · Owner: Codex

## Description

The API currently groups several resource paths and HTTP methods into wildcard Functions that parse the request path and method at runtime. The product lead requested each current route/method pair as its own explicitly declared Azure Function, an OpenAPI specification in `docs/`, and a Postman collection with example requests, variables and tests.

Expected: each operation has a concrete route and exactly one trigger method; existing request/response behavior and application authorization remain unchanged. The checked-in OpenAPI specification lists those operations without adding Swagger UI or runtime routes.

## Scope

Split all current Users, Organizations, Memberships, Teams, Departments and Sessions HTTP operations into explicit Azure Functions. Preserve route paths, payload allowlists, response codes, `Location` headers, bearer/session authorization, tenant isolation and lifecycle behavior. Add a documentation-only OpenAPI specification and Postman collection, link them from the API contract and README, and keep both out of runtime endpoints. Do not add a Swagger UI package or expose new runtime endpoints.

## Dependencies

None.

## Acceptance scenarios

- [x] Given the Functions worker indexes the API, when function triggers are inspected, then each current route/method pair is a distinct trigger and no catch-all route remains.
- [x] Given existing callers use the documented routes, when they invoke the API, then response shapes, authorization, tenant isolation and lifecycle behavior remain unchanged.
- [x] Given API documentation readers use the OpenAPI specification, when they inspect operations, then every trigger is documented with its path, method, bearer requirements and request/response media types.
- [x] Given API developers import the Postman collection, when they configure the documented variables and sign in, then they can try example requests and run basic response tests for each operation.
- [x] Tenant isolation is exercised by existing integration tests for organization/member access; tenant ownership and authorization logic remain unchanged.

## Subtasks and responsibilities

### UX

Not applicable; no product interface changes.

### UI

Not applicable; frontend routes and API calls are unchanged.

### Backend

- [x] Split resource/session triggers into explicit path-and-method Functions.
- [x] Preserve application-service authorization and HTTP body/response behavior.

### Database

Not applicable; persistence behavior is unchanged.

### QA and other responsibilities

- [x] Add integration coverage that dispatches against the declared trigger routes and asserts one method per exact route.
- [x] Add and link the documentation-only OpenAPI specification and Postman collection.
- [x] Run the complete API test suite and start the Functions host with supported Core Tools.

## Attachments and sources

- [API contract](../contracts/api.md)
- [OpenAPI specification](../contracts/openapi.yaml)
- [Postman collection](../contracts/vacate-api.postman_collection.json)
- [Accepted API architecture](../adr/0003-domain-and-application-services.md)
- [API integration tests](../../api/tests/Vacate.IntegrationTests/ResourceEndpointTests.cs)

## Comments

C-1 · 2026-10-28 · Codex: Replaced wildcard resource triggers with individual route/method declarations while retaining application services and shared HTTP parsing/error mapping.

C-2 · 2026-10-28 · Codex: All 12 resource endpoint integration tests passed after the trigger split. The new route inventory test confirms 37 single-method, non-wildcard resource/session triggers. Actual Functions-host and OpenAPI validation remain pending.

C-3 · 2026-10-28 · Codex: The complete API suite passed (21 tests). OpenAPI YAML parsed and its 38 operations, unique operation IDs, local references, explicit security declarations, and route/method parity with all Function triggers were validated. Host startup could not be verified in this environment: installed Core Tools is 4.0.4483 and reports that it cannot determine the project language; port 7071 was already occupied and was left untouched.

C-4 · 2026-10-28 · Codex: Added a Postman v2.1 collection generated from the OpenAPI paths. It contains all 38 operations, sample bodies, local/fixture variables, automatic bearer-token and create-ID capture, status/JSON checks, and separated soft-delete/sign-out requests.

C-5 · 2026-10-28 · Codex: With the product lead's approval, installed Core Tools 4.16.0 in a temporary directory, started the Functions host on port 7072 without disturbing the pre-existing listener on 7071, and verified health, sign-in, current session, user listing and seeded organization read. The host logs an AzureWebJobsStorage health warning because storage is intentionally unset for HTTP-only local development. The API smoke checks passed.

## Decisions

D-1 · 2026-10-28 · Product lead: Add a checked-in OpenAPI specification under `docs/`; do not add runtime Swagger UI or OpenAPI endpoints.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis |
|---|---|---|---|---|---|
| W-1 | 2026-10-28 | Codex / assistant recorded | Split Functions and add integration coverage and OpenAPI documentation | Unknown | Session work; no complete issue duration measured |

Human actual: Unknown. Assistant recorded: Unknown. No estimates or overlapping elapsed totals.

## History

H-1 · 2026-10-28 · Codex: Created as In progress for explicit route/method Functions and OpenAPI documentation.

H-2 · 2026-10-28 · Codex: Moved from In progress to QA after Core Tools 4.16.0 successfully indexed and served the API on port 7072, smoke checks passed, and the complete API test suite passed. The pre-existing port-7071 listener was not changed.

## Verification and release

`dotnet test api/Vacate.slnx --configuration Release --no-restore` passed: 7 unit tests and 14 integration tests. Integration tests assert all 37 resource/session trigger declarations use one method and no wildcard; OpenAPI was checked against all 38 triggers, including health. YAML parsing, unique operation IDs, all local references and explicit security declarations passed. The Postman v2.1 JSON collection includes all 38 OpenAPI operations; body JSON and Postman test-script syntax were validated, and each collection method/path matches OpenAPI. Core Tools 4.16.0 started the API on port 7072; HTTP health, fictional development sign-in, current session, user listing and seeded organization read all passed. The host logs an AzureWebJobsStorage health warning because storage is intentionally unset for HTTP-only local development. The previous Core Tools 4.0.4483 failure is resolved by using the supported version. The unrelated pre-existing listener on port 7071 was not disturbed.

## Open questions and follow-up

None.
