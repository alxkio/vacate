# VAC-39 sign-in recovery · 2026-11-05

## Root cause

The deployed API setting ConnectionStrings__Vacate used `Server=tcp:vacate-dev-srv..database.windows.net,1433`. `infra/modules/functions-backend.bicep` inserted a dot before `environment().suffixes.sqlServerHostname`, whose AzureCloud value already starts with `.database.windows.net`.

The invalid DNS name prevented the API from reaching SQL. A paused database was an additional observed state, not evidence of free-allowance exhaustion. Direct read-only SQL inspection returned transient 40613 and triggered ordinary serverless resume; SQL subsequently reported Online, but API sign-in still timed out until its hostname was corrected. Empty allowance metrics could not establish remaining/exhausted quota.

Source: [Microsoft Bicep environment suffix documentation](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-deployment#environment), checked 2026-11-05.

## Target and changes

- Site: `https://lemon-beach-02f7a7103.4.azurestaticapps.net`.
- API: `https://vacate-dev-sc-wv5pdctnrzamu-api.azurewebsites.net/api`.
- Public frontend revision: `f955b2a322926b1101e48d1fb528e0529108c207`; API liveness version: `1.0.0+578a387f0636892a244387ac12972469b40f2421`. No application binary was redeployed by this repair.
- After validating the local fix, updated only ConnectionStrings__Vacate through Azure CLI, changing the double-dot hostname to `tcp:vacate-dev-srv.database.windows.net,1433`. Readback matched the requested string exactly; reverse substitution matched the previous string exactly. This preserves database, managed identity client ID/authentication, TLS validation, timeout and retry options. Connection strings/session tokens were not printed or committed.
- Database/server data, schema, firewall and price settings were not changed. Normal SQL auto-resume preserves useFreeLimit=true and freeLimitExhaustionBehavior=AutoPause; no paid resume or overage mode was enabled.
- Repository Bicep now defines the hostname once without an extra separator. `scripts/verify-functions-template.py` validates compiled hostname construction for public, US Government and China suffixes, the persistence switch, managed identity and encrypted/certificate-validated connection options. The infrastructure workflow invokes it after main template compilation and watches its path for PR validation.

## Before repair

HTTP session creation for public fictional Maya and Nora timed out at 35 seconds, including after SQL resumed. In an isolated real Chrome session, sign-in remained on /login.html with a disabled button and no displayed error at 60 seconds. API health remained healthy because it is liveness-only, not a database-readiness check.

## After repair

| Check                                                | Observed                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Maya and Nora session creation                       | 200; approximately 0.47 and 0.46 seconds                                                |
| Current-session restoration and organization summary | 200 for both                                                                            |
| Nora initial organization, membership and role data  | 200 for all                                                                             |
| Employee administrator-resource access               | 404 Organization unavailable                                                            |
| Foreign organization summary for each account        | 404 Organization unavailable                                                            |
| Revoke diagnostic sessions                           | 204                                                                                     |
| Use revoked session                                  | 401                                                                                     |
| Incorrect credentials                                | 401                                                                                     |
| CORS for the actual frontend origin                  | Expected origin returned on all diagnostic responses                                    |
| Browser sign-in                                      | /index.html with vacate-workspace present within the first 10-second observation window |

The browser also restored the session and fetched its organization summary after the navigation. Its diagnostic session was explicitly revoked. HTTP diagnostic sessions were also revoked. No employee, organization, membership or leave resources were created/edited; only fictional sessions were issued/revoked.

## Local regression verification

- Bicep compiled successfully using the installed binary. Older local Bicep emitted existing BCP081 resource-type schema warnings; no compilation errors. Azure CLI's attempted Bicep download hit this host's CA trust limitation, so compilation used the already installed binary with its extraction cache under /private/tmp; TLS verification was not disabled.
- Compiled-template validator passed across three Azure suffixes.
- Negative variants introducing the double dot, bypassing the validated hostname or disabling certificate validation were rejected.
- Python syntax, workflow YAML/embedded scripts, the existing 192-case preview/apply condition harness, formatting and diff whitespace checks passed. New issue/backlog and local documentation links checked.

This is focused sign-in/authorization smoke evidence, not a full default/native browser acceptance or independent release review. Frontend/API source and contracts are unaffected; no application rebuild/unit-test rerun is needed for this infrastructure hostname correction. The source fix and new CI guard remain local until committed/pushed. Broader readiness/timeout UX and process-local development-session limitations are unchanged.
