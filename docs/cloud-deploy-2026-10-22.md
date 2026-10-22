# First dev deployment — 2026-10-22

## Outcome

The three-direction UI mock gallery and API health endpoint were deployed successfully. Choosing a UI direction remains deferred at the founder's request; this publishes the existing fictional gallery for review.

- Site: https://lemon-beach-02f7a7103.4.azurestaticapps.net
- Gallery: https://lemon-beach-02f7a7103.4.azurestaticapps.net/design-preview/index.html
- API health: https://vacate-dev-wv5pdctnrzamu-api.azurewebsites.net/api/health
- Subscription: `07d79495-1f4f-40fd-9fdf-84605214e5e6`
- Resource group: `rg-vacate-dev`; region: West Europe.
- Published commit: `995ec89a8fbdd73f920974d5af92a8b56d584818`, branch `master`.
- [Successful workflow](https://github.com/alxkio/vacate/actions/runs/39769775695), `environment=dev`, `apply=true`.

## Changes and decisions

CI copies the standalone gallery into the frontend artifact at `/design-preview/` after building Angular; it stamps a revision file so cloud checks can distinguish the published gallery version. Static Web Apps redirects `/` to the gallery with a temporary redirect. Angular routes `/leave`, `/approvals`, `/availability` and `/people` remain available. The existing Bicep provisions the Free Static Web App, Flex Functions plan/app, managed-identity storage access and workspace-based Application Insights. No database or real employee data was introduced.

An initial build (`c12a33c`) exposed Angular's restriction on assets outside its workspace. Copying the files after the build fixed it. The first actual apply (`eb68584`, [run](https://github.com/alxkio/vacate/actions/runs/39768832302)) then failed because Azure requires a log quota greater than 0.023 GB/day. Bicep now permits 0.025 GB/day and higher. The incremental retry completed the partially created infrastructure without deleting resources. Warning/error filters remain enabled; ingestion and cap enforcement have not been separately exercised by a controlled diagnostic event.

These are deployment choices, not acceptance of A/B/C, leave rules, permission models or the historical agent prompt's proposed features.

## Verification

The successful hosted workflow passed Bicep compilation, Angular production build/tests, .NET Release build/tests, Functions packaging and a real Functions-host health check. It then passed Azure validation/what-if, infrastructure creation, API publishing and frontend publishing.

Deployed smoke checks passed for:

- API health and exact build revision.
- Expected frontend CORS origin and rejection of an unrelated origin.
- Runtime API configuration, revision and no-store caching.
- Root redirect and gallery entry HTML, JavaScript/CSS assets and gallery revision.
- Existing Angular deep links serving the Angular entry point.

Post-deploy Chrome checks against the live gallery passed all twelve scope/view combinations, generic shared-detail projections, empty/own details, Escape and focus return, year navigation/Today, the demo request and twelve mobile overflow checks. Six live screenshots were captured under `/private/tmp/vacate-cloud-browser-previews/`. The live harness used a longer page-load allowance and waited for asynchronous dialog closure before asserting restored focus. This is targeted browser verification, not a full accessibility audit. The deploy action emitted non-fatal metadata warnings for `skip_api_build` and `production_branch`; API and web publishes and all smoke checks nevertheless succeeded.

## Boundaries and open questions

The public gallery contains synthetic data and demo interactions only. No authentication or business authorization is provided by it. Backend company-isolation and real-data authorization tests remain release gates before introducing employee data. UI direction, organization visibility, leave units and company calendars remain open in the [UI proposal](design/calendar-ui-proposal.md).

Sources changed: `.github/workflows/ci.yml`, `.github/workflows/azure-infrastructure.yml`, `web/public/staticwebapp.config.json`, `scripts/cloud-smoke.py`, `infra/main.bicep`, `infra/parameters/dev.bicepparam`, `infra/README.md`, `infra/cost-estimate.md`, `docs/cloud-validation-2026-10-22.md`, the gallery sources and documentation under `docs/design/`, this record and `docs/README.md`. The earlier logging/package updates are included in the deployed commit. The [earlier validation record](cloud-validation-2026-10-22.md) preserves the login/IAM and quota evidence.
