# Route and parameter audit · 2026-11-15

Scope: all registered Angular routes, legacy aliases, frontend resource clients, HTTP-trigger API routes, query readers and OpenAPI query parameters. Sources: [Angular routes](../../../../frontend/src/app/app.routes.ts), [navigation helpers](../../../../frontend/src/app/core/navigation/app-paths.ts), [API contract](../../../contracts/api.md), [OpenAPI](../../../contracts/openapi.yaml). This is source/contract inspection plus the verification recorded in the linked issues; it is not a deployed endpoint or SQL audit.

## Angular decisions

| Routes | Useful URL state | Removed / moved |
|---|---|---|
| `/calendar` | `scope`, `view`, applicable public `group` GUID; legacy team/department aliases are still understood | Selected `date` moves to actor/company-owned entry history plus tab session storage; dated legacy links are consumed then normalised. Unknown keys, `page`, report `year` and search text are removed. |
| `/people` | Nondefault `scope=team|department`, selected public `group` GUID, noncurrent admin report `year` | Default org scope and current year omitted; search is in session-owner-scoped memory. Calendar date/view and unrelated keys removed. |
| `/people/{personGuid}`, membership and recorded-leave subroutes | Same nondefault list context/report year for return navigation | Current/default report context omitted; GUID path remains the record identity. |
| `/leave`, `/leave/balances`, `/leave/requests/{requestGuid}` | No supported query parameters | Scope, view, date, year and arbitrary keys removed. Existing in-page filters remain feature-owned. |
| `/approvals`, `/approvals/{requestGuid}` | No supported query parameters | Unrelated Calendar/People state removed. Assignment remains server-owned. |
| `/settings` and every settings subroute | Public scope GUID in department/team path; personal/organization section in path | Old `page`/`section` converted to path; all unrelated query state removed. |
| `/help` | None | All unrelated query state removed. |
| `/login`, compatibility `/login.html` | Safe nondefault `returnUrl`; `reason=expired` only | Default Calendar return destination and unrelated/invalid keys omitted. Unsafe return targets still resolve to Calendar. |
| Root, `/index.html`, `/app.html`, `/availability`, `/balances`, `/admin-balances` | Legacy input translated to the owning canonical destination | No second page implementation. Unknown routes including deferred Home resolve to Calendar. |

A `company` probe matching the current company is redundant and removed. A foreign-company probe stays explicit until denial; silently dropping it must not turn a denied view into an authorised current-company view. URL cleanup never grants authority or changes the API tenant boundary. Resources continue using public GUID paths. Legacy fixture aliases are not introduced as new resource paths.

Calendar scope/view are retained because they select a meaningful projection and layout. The date is intentionally different: the owner explicitly requested removing it while preserving navigation, so per-entry history is necessary in addition to last-view session storage.

## API decisions

Every public path identifier remains necessary for resource identity and authorisation: company, user, membership/scope and saved-request GUIDs are not replaced with implicit actor-dependent writes. Methods and bodies identify lifecycle actions and writable fields. Removing those would change the contract, rather than simplify it.

The only current server query reader and OpenAPI query declaration is `GET /api/organizations/{companyId}/admin/personnel?year={year}`. `year` is required to select the entitlement/report period and remains explicit even for the current year; the frontend's default omission is resolved before making this API call. The server validates it and still authorises the actor/company. No API call currently sends Calendar date/view/scope or a duplicate company query. No redundant API query or endpoint change was identified. Backend, DTOs, permission checks and persistence are unaffected.

## Complete HTTP-trigger inventory

All registered operations found in `api/src/Vacate.Api/Functions` are listed below. Only personnel reads `year`; the other listed operations have no declared/consumed query parameter. Unknown query keys are currently ignored by the HTTP framework/server; a new strict-rejection policy is not introduced as a cosmetic cleanup.

| Method | Path | Query |
|---|---|---|
| GET | `/api/auth/development-accounts` | None |
| POST | `/api/auth/sessions` | None |
| DELETE | `/api/auth/sessions/current` | None |
| GET | `/api/auth/sessions/current` | None |
| GET | `/api/health` | None |
| GET | `/api/organizations` | None |
| POST | `/api/organizations` | None |
| DELETE | `/api/organizations/{companyId}` | None |
| GET | `/api/organizations/{companyId}` | None |
| PATCH | `/api/organizations/{companyId}` | None |
| GET | `/api/organizations/{companyId}/admin/approvals` | None |
| POST | `/api/organizations/{companyId}/admin/approvals/{requestId}/decision` | None |
| PUT | `/api/organizations/{companyId}/admin/approvers` | None |
| GET | `/api/organizations/{companyId}/admin/calendar` | None |
| POST | `/api/organizations/{companyId}/admin/closures` | None |
| POST | `/api/organizations/{companyId}/admin/closures/preview` | None |
| POST | `/api/organizations/{companyId}/admin/holidays` | None |
| GET | `/api/organizations/{companyId}/admin/personnel` | Required `year` |
| POST | `/api/organizations/{companyId}/deletion-request` | None |
| GET | `/api/organizations/{companyId}/departments` | None |
| POST | `/api/organizations/{companyId}/departments` | None |
| DELETE | `/api/organizations/{companyId}/departments/{nodeId}` | None |
| GET | `/api/organizations/{companyId}/departments/{nodeId}` | None |
| PATCH | `/api/organizations/{companyId}/departments/{nodeId}` | None |
| POST | `/api/organizations/{companyId}/departments/{nodeId}/deletion-request` | None |
| GET | `/api/organizations/{companyId}/directory` | None |
| GET | `/api/organizations/{companyId}/leave/calendar` | None |
| GET | `/api/organizations/{companyId}/leave/company-calendar` | None |
| POST | `/api/organizations/{companyId}/leave/preview` | None |
| GET | `/api/organizations/{companyId}/leave/requests` | None |
| POST | `/api/organizations/{companyId}/leave/requests` | None |
| DELETE | `/api/organizations/{companyId}/leave/requests/{requestId}` | None |
| POST | `/api/organizations/{companyId}/leave/requests/{requestId}/cancel` | None |
| GET | `/api/organizations/{companyId}/memberships` | None |
| DELETE | `/api/organizations/{companyId}/memberships/{userId}` | None |
| GET | `/api/organizations/{companyId}/memberships/{userId}` | None |
| PATCH | `/api/organizations/{companyId}/memberships/{userId}` | None |
| POST | `/api/organizations/{companyId}/memberships/{userId}` | None |
| POST | `/api/organizations/{companyId}/memberships/{userId}/deletion-request` | None |
| GET | `/api/organizations/{companyId}/roles` | None |
| GET | `/api/organizations/{companyId}/summary` | None |
| GET | `/api/organizations/{companyId}/teams` | None |
| POST | `/api/organizations/{companyId}/teams` | None |
| DELETE | `/api/organizations/{companyId}/teams/{nodeId}` | None |
| GET | `/api/organizations/{companyId}/teams/{nodeId}` | None |
| PATCH | `/api/organizations/{companyId}/teams/{nodeId}` | None |
| POST | `/api/organizations/{companyId}/teams/{nodeId}/deletion-request` | None |
| GET | `/api/organizations/{companyId}/workspace` | None |
| GET | `/api/users` | None |
| POST | `/api/users` | None |
| DELETE | `/api/users/{userId}` | None |
| GET | `/api/users/{userId}` | None |
| PATCH | `/api/users/{userId}` | None |
| PATCH | `/api/users/{userId}/account` | None |
| POST | `/api/users/{userId}/deletion-request` | None |

Inventory: 55 HTTP operations. Contract/client inspection found no additional query-bearing endpoint.
