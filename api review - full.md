# Vacate API code review

Scope: `api/src` (Api, Application, Domain, Infrastructure). Read-only review; build and tests were not run. Migrations, SQL row mapping, `tools/Vacate.Database` and the tests were not reviewed.

The layering matches ADR-0003: functions are thin, tenant checks go through `AccessPolicy`, and request bodies are allow-listed. Leave ranges are capped at 3660 days, so there is no unbounded loop.

## 1. Correctness, security and performance

### High

1. **Internal integer IDs are exposed in public responses.**
   - `Contracts.cs` returns `Id` on `UserRecord`, `MembershipRecord`, `DepartmentRecord`, `TeamRecord`, `OrganizationRecord`, `ReferenceRecord`, `AccountCreated`, `AccountState` and `DeletionRequest`.
   - This breaks the public-GUID rule and exposes sequential identifiers across tenants.
   - Fix: drop `Id` from the API projections, or confirm against `docs/contracts` that each one is intended. This also needs frontend and contract updates.
2. **One global exclusive SQL lock per request.**
   - `SqlSession.Execute` takes `Lock("vacate:resource-use-cases")`, including for token validation and plain GETs.
   - All traffic is serialized across tenants, and waiters time out after 15 s with a 409 "busy".
   - Fix: record it as a tracked limitation, and skip the lock for session lookup and read-only work.
3. **N+1 queries and cross-tenant scans.**
   - `AdminLeaveService.Inbox`, `Decide` and `SetApprover` call `leaves.Requests(...)` once per active member. `SetApprover` also updates every pending request.
   - `SqlLeaves.Find` loads all of a member's requests to return one.
   - `AccessPolicy.EnsureNotManager` runs `users.All()` over every tenant.
   - Fix: add repository queries scoped by company, request GUID and approver.

### Medium

4. **Server faults are reported as client errors.**
   - `Endpoint.Execute` maps `InvalidOperationException` and `ArgumentException` to a 400 "Invalid JSON field type or value".
   - Bugs such as `.Single()` failures in `SqlLeaves` and `SqlSession.Next` look like bad input and are never logged as 500s.
   - Fix: catch only `JsonException` and `FormatException`, and let the rest surface as 500.
5. **JSON `null` on non-nullable reference fields may reach the domain.**
   - `Field<string>` returns `default!` with `IsSpecified: true`, and only value types are rejected.
   - It is safe only if the domain constructors reject null; this is unconfirmed.
   - Fix: reject null in `Field` for non-nullable types, and add a test.
6. **Existence oracle on user GUIDs.** `AssignmentScope` returns 403 for a real user with no company and 404 for an unknown one. The rest of the code deliberately returns 404 for both.
7. **Strict content-type check.** `ContentType.Split(';')[0] != "application/json"` is case-sensitive and not trimmed. Use `MediaTypeHeaderValue.TryParse`.

### Low

- The "today in the company time zone" calculation is copied about five times. Extract one helper. An unresolvable time zone ID throws uncaught.
- `SqlSession.Company()` writes (expires pending leave) on first access, so plain GETs can write.
- `LeaveFunctions.Delete` is named `DeletePersonalLeaveRequest` but requires an administrator and hard-deletes approved or past leave. Rename it and decide whether that is allowed.
- A `Submit` replay returns a freshly calculated preview, so it can differ from the first response.
- Development credentials are `password == username`, with no rate limiting, and `/auth/development-accounts` is anonymous. It is gated by `IsDemo` and `DevelopmentAuthentication:Enabled`. Make sure it cannot be enabled in production.
- Sessions have a fixed 30-minute lifetime, and expired tokens are only reclaimed at sign-in.

## 2. Structure

Dependency direction is correct (Domain ← Application ← Infrastructure, Api as composition root).

- **Production defaults to in-memory storage.**
  - `Persistence:Provider` is read as `?? "InMemory"`, so a missing setting silently runs on an empty process-local store.
  - The in-memory classes are `public`, while the SQL classes are `internal`.
  - Fix: fail fast when the provider is unset, and make the in-memory classes `internal` with `InternalsVisibleTo`.
- **Inconsistent organisation.**
  - `InMemoryLeaves` lives in `LeaveRepositories.cs`, away from the other in-memory repositories.
  - `Sql/Repositories.cs` holds several classes.
  - Commands are one file per record, but leave contracts are bundled into `Contracts.cs` and `AdminContracts.cs`.
  - `Commands.cs` actually holds `Change<T>`.
- **Large methods.** `LeaveService.Calculate` is about 110 lines and `AdminLeaveService.Plan` about 70. Both mix date selection, carryover, balance maths and approver checks.
- **Dual `int Id` plus `Guid` on every entity.** `RecordMapper` does repeated `Single()` lookups per record.

## 3. Unused code and imports

Found with IDE0005, IDE0051, IDE0052 and IDE0060 enabled. The build passed, and the temporary `.editorconfig` was removed afterwards.

**Unused `using` directives (IDE0005):**

- `Vacate.Api/Functions/OrganizationFunctions.cs`: lines 5 and 12
- `Vacate.Api/Functions/SessionFunctions.cs`: line 4
- `Vacate.Api/Functions/UserFunctions.cs`: line 4
- `Vacate.Api/Http/Endpoint.cs`: line 7
- `Vacate.Api/Program.cs`: line 2
- `Vacate.Infrastructure/Persistence/Sql/SqlLeaves.cs`: line 1
- Line 1 of `CreateOrganization`, `CreateStructure`, `DeleteOrganization`, `DeleteStructure`, `RequestOrganizationDeletion` and `RequestStructureDeletion` in `Vacate.Application/Organizations/Commands`
- Tests: `AdminLeaveTests.cs` (lines 3 and 12), `LeaveRequestTests.cs` (line 3), `SqlPersistenceTests.cs` (lines 3, 12 and 15)

`dotnet format style --diagnostics IDE0005` removes them safely.

**Unused members:**

- `IMembershipRepository.History(int)` is never called, only declared and implemented.
- `HealthFunction.cs:13` (IDE0060, unused `request`) is almost certainly a false positive, because the HTTP trigger binding needs the parameter. Suppress it rather than remove it.
- No IDE0051 or IDE0052 findings. The analyzers do not check public members, so a full dead-code sweep would need a separate tool.

## 4. DDD

**Done well**

- `Organization` is a proper aggregate. Departments and teams are exposed read-only and child mutators are `internal`.
- Aggregates are rebuilt through `Restore(...)` factories, and lifecycle invariants sit in the `Entity` base class.
- Value objects are immutable and self-validating: `AnnualBalance`, `MembershipConfiguration`, `VacationSettings` and `PersonName`.
- Repository ports live in Application and are implemented in Infrastructure.
- Aggregates reference each other by ID.

**Gaps**

1. **No Leave aggregate.**
   - Request creation, cancellation, approval, balance checks and idempotency live in `LeaveService` and `AdminLeaveService`.
   - `LeaveRequestRecord`, `LeaveDateRecord` and `StoredLeaveRequest` are Application DTOs, not domain entities.
   - A `LeaveRequest` aggregate should own date statuses and transitions such as `Cancel(...)` and `Decide(...)`.
2. **Magic strings instead of types.**
   - Statuses: `"Approved"`, `"Pending"`, `"Declined"`, `"Cancelled"`, `"Expired"`.
   - Sources: `"EmployeeRequest"` and `"CompanyClosure"`.
   - Other values: `"approve"`, `"days"`, `"range"` and the approver scopes.
   - SQL also renames them: `Approved`→`Used`, `Declined`→`Cancelled`, `Cancelled`→`Withdrawn`.
   - Use enums or value objects.
3. **Two sources of truth for balances.** `AnnualBalance` carries `Used` and `Pending` totals, while real consumption comes from leave records. Make the leave ledger the single source and derive balances from it.
4. **Domain invariants in `AccessPolicy`.** `EnsureMayRemoveAdmin` and `EnsureNotManager` are business rules that belong in the domain or a domain service.
5. **Persistence leaks into ports.**
   - `NextId()`, `NextDepartmentId()` and `NextTeamId()` expose ID generation.
   - `All()` allows whole-table scans.
   - `StoredLeaveRequest` carries `CompanyId`, `MembershipId` and `Fingerprint`.
   - `IUnitOfWork.Execute(Func<T>)` hides the transaction scope.
6. **Application services map to response records.** `RecordMapper` builds HTTP-shaped DTOs and leaks `int Id`.
7. **No domain events.** Cross-aggregate effects (revoking sessions, re-resolving approvers) are done by hand in services.
8. **Three exception families**, all mapped in one catch block: `DomainValidationException`, `DomainConflictException` and `ServiceException`.

## 5. Suggested order

1. Remove unused usings and `IMembershipRepository.History`.
2. Make `Persistence:Provider` fail fast.
3. Fix `Endpoint` exception mapping and null handling (items 4 and 5 above).
4. Introduce a `LeaveRequest` aggregate with status enums and ledger-derived balances. This touches the SQL schema and the contracts, so it needs a design note first.
5. Move `EnsureMayRemoveAdmin` and `EnsureNotManager` into the domain, with scoped repository queries.
6. Drop `Id` from the public projections, with matching contract and frontend updates.
