# VAC-13 verification · 2026-10-27

Scope: layered API implementation and paired Angular profile/membership/organization flows. Only fictional seed accounts were used. No commit, hosted CI run, push or deployment is claimed. Independent privacy/security and release review remain pending.

## Implementation and decisions

[ADR-0003](../../../adr/0003-domain-and-application-services.md) defines typed domain aggregates, application services and use-case records without a Command suffix, repository ports and Infrastructure adapters. [API contract](../../../contracts/api.md), [user contract](../../../contracts/user.md) and [organization contract](../../../contracts/organization.md) define the paired transport behavior.

All entities have numeric Id plus immutable Guid. Public routes and relationship references use GUIDs; domain relationships use numeric keys. Numeric public item identifiers are rejected. No InternalId alias or username-based update targeting remains. Server memory/reset-on-restart is founder-confirmed. Development credentials and fictional seeding are separately opt-in. Production OIDC, durable storage, onboarding and retention remain open.

Code was formatted with one executable statement per line, spaces/braces, concise intent comments and one blank line between method declarations. The current membership implementation was retained while applying those changes.

## Executed checks

| Check | Result |
|---|---|
| .NET 10 Release solution build | Passed; zero warnings/errors |
| Domain/unit tests | 7 passed: defaults/exclusivity, atomic profile validation, synthetic balance floor, employment dates/service, optional structure, lifecycle and layer dependencies |
| Resource/health integration tests | 13 passed: twelve account sign-ins, disabled development sign-in, GUID addressing, privacy, access/tenant isolation, stale/revoked sessions, CRUD/lifecycle and conflicts |
| Angular production build | Passed; organization SCSS remains 438 bytes above its 4 kB warning budget (4.44 kB total), below the error threshold |
| Angular/Vitest component and service tests | 24 passed across 7 files |
| Direct TypeScript app and spec compilation | Both passed with explicit rootDir/outDir; output remains under ignored frontend/out-tsc |
| Schema/static identity checks | Passed separate numeric identities/GUIDs, numeric storage references and normalized public examples |
| Live HTTP JSON Schema checks | All twelve user/membership responses passed the shared schema |
| Actual published Functions host HTTP acceptance | Passed twelve sessions, bearer revocation, colleague allowlist, account/membership/org/department/team CRUD and timestamps/deletion conflicts |
| Complete built Angular browser acceptance against Functions | Passed all twelve account/scope journeys, profile persistence, admin organization/structure and membership save/reload, native keyboard, history navigation and mobile checks |
| Reference fixtures, eligibility, profile and organization doubles | Passed; these supplement real HTTP acceptance and do not establish production policy |
| Cloud smoke helper unit tests | 11 passed |
| Workflow YAML parsing | Both workflows parsed |
| External action references | Every tag resolved upstream; action.yml exists at each verified commit below |

The initial disabled-sign-in test sent no credentials and therefore exercised payload validation (400). It now sends a valid fictional payload and verifies disabled sign-in (404). One component test initially timed out during concurrent checks; the complete isolated rerun passed all 24. No timeout increase or assertion removal was needed.

Useful reproduction commands from the repository root:

```sh
dotnet build api/Vacate.slnx --configuration Release --no-restore
dotnet test api/Vacate.slnx --configuration Release --no-build --no-restore
python3 scripts/verify-api.py --api-base-url http://127.0.0.1:7071/api
```

From frontend, after starting the Functions host with DevelopmentAuthentication__Enabled=true and SeedData__Enabled=true:

```sh
node node_modules/typescript/bin/tsc --project tsconfig.app.json
node node_modules/typescript/bin/tsc --project tsconfig.spec.json
npm run build -- --configuration production
npm test -- --watch=false
API_CONTRACT_URL=http://127.0.0.1:7071/api node verify-api-contract.mjs
node verify.mjs
```

## Reported configuration diagnostics

Reproduced TS5055 with direct TypeScript compilation. allowJs plus missing output directories made emission target source JavaScript. App uses rootDir=src/outDir=out-tsc/app; specs use rootDir=./outDir=out-tsc/spec to include testing fixtures. Both projects compile with ordinary emission, and CI now runs those exact project checks. Temporary files emitted while reproducing were moved out of source; authored reference JavaScript was preserved.

The upstream checkout v7 tag exists as of this verification date ([official release](https://github.com/actions/checkout/releases/tag/v7.0.1)). The editor's reported inability to resolve it is UNVERIFIED; no missing-upstream-tag claim is made. Commit pins were initially applied, then reverted at the founder’s request on 2026-10-27. Both workflows now use the original readable version tags. A hosted workflow run and the user's editor resolver have not been observed.

| Action source | Verified tag | Verified commit (historical evidence) |
|---|---|---|
| [actions/checkout](https://github.com/actions/checkout/tree/3d3c42e5aac5ba805825da76410c181273ba90b1) | v7 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [actions/setup-node](https://github.com/actions/setup-node/tree/949feb2413d6458794dcd2491c4babbbce0c15c1) | v7 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| [actions/setup-dotnet](https://github.com/actions/setup-dotnet/tree/26b0ec14cb23fa6904739307f278c14f94c95bf1) | v5 | `26b0ec14cb23fa6904739307f278c14f94c95bf1` |
| [actions/upload-artifact](https://github.com/actions/upload-artifact/tree/cf430e030ddbb5b0abf93d22962f4752f3646cd9) | v7 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |
| [actions/download-artifact](https://github.com/actions/download-artifact/tree/9000827ccba6bdab643e8b6fd33ac0654aef8333) | v8 | `9000827ccba6bdab643e8b6fd33ac0654aef8333` |
| [Azure/login](https://github.com/Azure/login/tree/a641126d1b8aa4d1fa005f4f92df94a3a4c4c906) | v3 | `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906` |
| [Azure/functions-action](https://github.com/Azure/functions-action/tree/c5060b3b8bb1ebbcb531abd00c822ecbaa8ea656) | v1 | `c5060b3b8bb1ebbcb531abd00c822ecbaa8ea656` |
| [Azure/static-web-apps-deploy](https://github.com/Azure/static-web-apps-deploy/tree/1a947af9992250f3bc2e68ad0754c0b0c11566c9) | v1 | `1a947af9992250f3bc2e68ad0754c0b0c11566c9` |

## Screenshots

[Desktop membership editor](membership-admin-desktop.png) and [mobile membership editor](membership-admin-mobile.png) were regenerated from the layered API browser acceptance run and visually inspected. They show the GUID-backed role/structure selectors and persisted prior-service value. Profile and organization browser journeys also passed.

## Remaining gates

Independent privacy/security and release review; production issuer/subject and OIDC validation; shared durable persistence; invitation/provisioning authority; retention/erasure decisions; approved experience policies. Soft deletion is lifecycle evidence, not GDPR erasure. No production readiness or legal-policy claim follows from these fictional checks.

