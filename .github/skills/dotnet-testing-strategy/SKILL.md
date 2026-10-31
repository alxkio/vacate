---
name: dotnet-testing-strategy
description: Choose and implement tests for Vacate's .NET domain, application services and Azure Functions API using existing NUnit projects and real-host acceptance checks.
---

# Vacate .NET testing strategy

Select tests from the accepted behavior and affected layers. Reuse the repository's test stack and fixtures; keep test selection proportional to the change and its authorization, tenant and lifecycle risks.

## Prerequisites

Read these repository sources before choosing a strategy:

- [Root AGENTS.md](../../../AGENTS.md) for source precedence, acceptance, privacy and coding rules.
- [Software Engineer](../../agents/software-engineer.agent.md) and [QA Engineer](../../agents/qa-engineer.agent.md) for backend and verification responsibilities.
- [ADR-0003](../../../docs/adr/0003-domain-and-application-services.md) for domain invariants, application authorization, adapter boundaries and paired acceptance.
- [API README](../../../api/README.md) for the current SDK, build/test commands and Functions host setup.
- The relevant accepted issue and affected [API contract](../../../docs/contracts/api.md). Apply [vacate-issues](../vacate-issues/SKILL.md) when updating or implementing an issue.

Inspect the affected code, nearby tests, project references and package manifests before editing. These local sources replace the imported companion-skill prerequisites; no additional skill installation is required. Follow root routing for other affected paths. Accepted decisions take precedence over examples in this skill.

## Choose checks by boundary

| Affected behavior                                                                  | Existing entry point                                                                                                                                          | Evidence and limits                                                                                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typed invariants, value objects, aggregate transitions and dependency direction    | [DomainRulesTests.cs](../../../api/tests/Vacate.UnitTests/DomainRulesTests.cs)                                                                                | NUnit tests without an HTTP host or storage dependency; cover valid, invalid and atomic rejection cases                                                     |
| Use-case authorization, repository coordination, HTTP parsing and response mapping | [ResourceEndpointTests.cs](../../../api/tests/Vacate.IntegrationTests/ResourceEndpointTests.cs)                                                               | Functions invoked with HTTP objects and real in-memory adapters; covers application/adapter integration, without proving real host indexing or SQL behavior |
| Health result and trigger binding                                                  | [HealthEndpointTests.cs](../../../api/tests/Vacate.IntegrationTests/HealthEndpointTests.cs)                                                                   | Direct function and binding checks; health is liveness, not database readiness                                                                              |
| HTTP routing, indexing, startup and resource contracts                             | [scripts/verify-api.py](../../../scripts/verify-api.py) against the running Functions host                                                                    | Exercises actual HTTP; use the README and current [CI](../../../.github/workflows/ci.yml) for setup and environment flags                                   |
| API changes affecting frontend calls or views                                      | [frontend/verify-api-contract.mjs](../../../frontend/verify-api-contract.mjs), [frontend/verify.mjs](../../../frontend/verify.mjs) and relevant Angular tests | Read the [frontend README](../../../frontend/README.md); pair the built UI with the real API and shared schemas                                             |

Extend the existing `api/tests/Vacate.UnitTests` and `api/tests/Vacate.IntegrationTests` projects. Keep their NUnit framework and established descriptive test names; do not create a parallel project layout or introduce a mocking, browser or container framework for this workflow. The current isolated Functions host uses the documented launch path, rather than an ASP.NET Core `WebApplicationFactory` harness.

If an authorized persistence change introduces a durable adapter, test its real storage semantics separately. In-memory tests do not establish SQL translation, database constraints, durability or production identity behavior. Read the accepted persistence/identity decision before planning those checks.

## Acceptance and isolation

Map each implementation change to an acceptance scenario: actor, trigger, expected outcome and relevant denial/error behavior. Select the applicable cases below rather than adding unrelated tests:

- Domain: invariant enforcement, unknown versus zero values, optional organization structure, and unchanged state after rejected mutations.
- Authorization: an authenticated actor in company A attempts reads and writes against real company B resources. Exercise guessed/foreign GUIDs, own/shared projections, privilege/delegation revocation and stale or removed memberships where affected. Missing authentication alone is not tenant-isolation evidence.
- Transport: public GUID addressing, payload/field allowlists, validation status and error shape, atomic rejection and deletion conflicts according to the existing contract.
- Lifecycle: server-owned UTC `createdAt`/`updatedAt`, nullable `deleteRequestedAt`/`deletedAt`, and rejected client timestamp overrides where affected. Soft deletion is not erasure.
- Cross-layer behavior: API contract/server behavior and frontend resource calls/views stay aligned. Verify errors and authorized rendering; explain an unaffected side explicitly.

Use fictional data and fresh mutable state per test. Keep seeds in Infrastructure and test fixtures in testing code. Do not introduce fixtures into domain rules or endpoint authorization. Approval and carryover configuration tests must not imply implemented leave transactions or legal-policy processing.

## Test style and collaborators

Use NUnit `[Test]` / `[TestCase]`, `Assert.That`, `Assert.Throws` and `Assert.Multiple` as in nearby tests. Keep arrange, act and assert readable, one statement per line, and a blank line between method declarations. Group assertions that describe one observable outcome; avoid assertions on private calls or incidental implementation order.

This example follows the existing domain API and verifies that a rejected change preserves both account state and its update timestamp:

```csharp
using NUnit.Framework;
using Vacate.Domain.Common;
using Vacate.Domain.Users;

namespace Vacate.UnitTests;

public sealed class ProfileRejectionTests
{
    [Test]
    public void invalid_profile_change_preserves_name_and_updated_at()
    {
        var createdAt = new DateTimeOffset(2026, 10, 22, 0, 0, 0, TimeSpan.Zero);
        var originalName = new PersonName("First", null, "Last");
        var user = new User(1, Guid.NewGuid(), "person@example.invalid", originalName, "unspecified", new(), createdAt);

        Assert.Throws<DomainValidationException>(() =>
            user.UpdateProfile(new("Changed", null, "Name"), "invalid", new(), createdAt.AddDays(1)));

        Assert.Multiple(() =>
        {
            Assert.That(user.Name, Is.EqualTo(originalName));
            Assert.That(user.UpdatedAt, Is.EqualTo(createdAt));
        });
    }
}
```

The example illustrates an existing acceptance case; do not add a duplicate test merely to copy it.

Choose collaborators by what the test must prove:

- Use real domain objects for invariants and existing in-memory repositories for application/adapter behavior.
- Use a small local stub for a controlled response, or a spy when an externally observable side effect requires interaction evidence. Reuse existing helpers before adding a new double.
- Do not mock a `DbContext` to claim database correctness or assume an in-memory adapter reproduces every database constraint.
- Pass explicit times to domain transitions. For time-dependent application services, use the existing injected `TimeProvider` and a controlled test implementation; do not add a clock package just for an example.
- Await observable completion for asynchronous checks. Avoid sleeps, dependence on test ordering and assertions on random IDs' exact values. Never weaken a failing assertion to obtain a pass.

## Run and report

Format changed code before verification. Run the relevant checks using the current README/CI configuration. The solution-level baseline, from the repository root, is:

```sh
dotnet restore api/Vacate.slnx --locked-mode
dotnet build api/Vacate.slnx --configuration Release --no-restore
dotnet test api/Vacate.slnx --configuration Release --no-build --no-restore
```

Build before using `--no-build`; do not use stale artifacts as evidence. For transport or UI behavior, also run the relevant real-host and paired browser/schema checks from the table. Read current script arguments and mode flags before execution. `frontend/verify.mjs` functional-only mode omits native input checks and cannot be reported as a complete default pass. Do not infer deployment permission from a testing task.

For instruction-only edits, validate the skill and referenced paths; application builds and tenant-isolation execution are unnecessary when runtime behavior and build inputs are unchanged. State that boundary explicitly.

Report scenarios covered, commands and outcomes, environment/revision, passed/failed/skipped checks, and remaining limitations. Distinguish direct adapter tests, real-host acceptance and deployed smoke evidence. Keep issue status and verification current under the issue workflow; a passing unit test does not establish release approval or independent review.
