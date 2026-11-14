# Disposable API fixtures

These files are test tooling, not SQL provisioning. `requests.http` contains manual sample requests and is not part of application runtime. `fixtures/fictional-users.json`, `InMemoryFixture.cs` and `FixtureCredentials.cs` compile into the integration-test assembly. Normal API/Infrastructure builds contain no fixture classes or embedded roster, ignore the retired SeedData setting and start InMemory storage empty.

CI/local HTTP and browser acceptance can explicitly compile the same fixture sources into the existing API host. No parallel application or endpoints are introduced. Both the test build and runtime opt-in are required:

```sh
# Run from the repository root; requires the normal .NET SDK and Functions Core Tools.
dotnet restore api/src/Vacate.Api/Vacate.Api.csproj --locked-mode
DevelopmentAuthentication__Enabled=true TestFixtures__Enabled=true Persistence__Provider=InMemory FUNCTIONS_WORKER_RUNTIME=dotnet-isolated AzureWebJobsStorage='' dotnet run --project api/src/Vacate.Api --no-restore -p:VacateTestFixtures=true -- --port 7071
```

The fixture host refuses SqlServer persistence. Edits and sessions exist only in its process and disappear on restart. Twelve firstname aliases plus legacy `user`/`admin` aliases remain test credentials; they are not created in a real database. The ordinary published API gets any public development accounts exclusively from saved SQL allowlist records.

`dotnet publish` refuses `-p:VacateTestFixtures=true`. Publish without that property; the default build excludes the linked fixture sources and JSON. Stop the host before building/testing into the same output directory, and do not publish its build output by hand. CI uses a separate production build/artifact before the paired test host.

For persistent test organizations use separately reviewed [database data scripts](../../docs/database/test-data.md#explicit-data-scripts). There is no SQL seeder or bootstrap command.
