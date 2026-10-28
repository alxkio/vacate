# VAC-10 Angular frontend release — 2026-10-25

Application revision **`7f7bffff8bd3f35226cf0a2f109d21717c4f8035`** is live at [Azure dev](https://lemon-beach-02f7a7103.4.azurestaticapps.net), subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, resource group **`rg-vacate-dev`**. [VAC-10](jira/VAC-10-consolidate-angular-frontend.md) records the founder's requested folder correction and explicit Angular conversion.

## Result and decisions

`frontend/` is the single active frontend workspace. Login, workspace/navigation, year/month/week/day calendars, annual rail, My balances, allowance rules, dialogs and request preview now render through Angular components/templates and typed presentation contracts. The existing reviewed fixture/catalogue/eligibility functions are imported modules behind DemoData; components do not inject generated HTML or execute the old DOM renderer.

CI, npm cache paths, agent prompt paths, validators, smoke checks and current setup documentation use frontend. The dependency lock and Angular project/output identifier remain unchanged. Legacy generated files/caches/editor settings were preserved outside the working tree before relocation; tracked obsolete build output and parallel static mock sources are retired. Git retains the earlier releases.

Azure publishes Angular's index directly. `prepare-frontend.py` validates it and stamps revision metadata without replacing it or creating a second app.html. Existing login/index/balances query links and supported deep links resolve to Angular. The public fictional account credentials and provisional country rules are unchanged. Root BFCache restoration re-runs route/session guards.

## Hosted build and deployment

- [CI passed](https://github.com/alxkio/vacate/actions/runs/40232916227) for the exact application revision. Frontend production build, unit tests, source fixture/schema checks, eleven smoke-helper regressions, artifact preparation and the **default complete browser suite against the optimized Angular output** succeeded. The normal push backend job also succeeded.
- [Azure deployment passed](https://github.com/alxkio/vacate/actions/runs/40233096363). Inputs: `environment=dev`, `apply=true`, **`deploy_backend=false`**. Bicep compile/validation/what-if/incremental apply and repeated frontend production/unit/browser checks succeeded. The deployment's backend checks, Publish API and full API smoke were skipped. Publish Angular and Verify deployed frontend succeeded; existing API application revision retained.
- A separate request to `/gallery-revision.json` returned the exact revision above. Frontend smoke verified Angular entry/routes/bundle delivery, configuration, revision, favicon and no-store entry settings. The prior static-gallery entry is rejected by the new smoke contract.

## Live acceptance and source evidence

The complete committed browser suite passed on the hosted Angular application:

```sh
MOCK_URL=https://lemon-beach-02f7a7103.4.azurestaticapps.net/index.html \
MOCK_SCREENSHOT_DIR=/private/tmp/vacate-vac10-live-previews \
node frontend/verify.mjs
```

Verified all 12 firstname/firstname accounts and legacy aliases; independent scope/group/permission expectations; own requests/annual quantities; generic shared availability and denied identifiers; actual logout/account-switch Back/Forward; trusted Enter/Escape, focus return and catalogue keyboard toggles; preserved draft fields, uncommon selected/expanded types and balance-page state; all 30 reference types with guarded unavailable requests; known-zero/unknown quantities, separate units and projections; denied/forged/stale-session submission guards; year/month/week/day views; calendar-first annual rail, balances routes/refresh/context/focus; A/B/C mobile balances/requests without horizontal overflow. Eleven live screenshots were captured; live A desktop and mobile were visually inspected. No application assertions were waived.

[Local conversion evidence and images](jira/media/VAC-10/verification.md) retain the Mac/AOT preview limitations and the state-handoff/shortlist-order regressions caught and fixed before release. Hosted production checks and the full live suite close that local production-build gap. Native acceptance uses trusted keyboard activation before history traversal; Angular frame and navigation-context waits preserve the existing behavior assertions.

Sources changed: [frontend application/setup](../frontend/README.md), source components/services/models/domain factories, frontend acceptance, CI and agent path guidance, Static Web Apps configuration, smoke/preparation scripts, root/design/infra documentation, VAC-10, source links in VAC-6/VAC-9 and [backlog](jira/Product-Backlog.md).

## Open questions and limits

Final A/B/C selection, shortlist revisions and the existing policy review questions remain open. No real authentication, employee API, persistence, submission/approval routing, legal rule pack or company override is added. These public synthetic fixtures and presentation checks do not establish production tenant isolation. The [eligibility review](product/leave-eligibility-review.md) and [backend contract](contracts/leave-eligibility.md) retain those future gates.

Human actual and active assistant duration remain Unknown; no workflow windows or parallel time are inferred as work totals. A subsequent documentation-only evidence commit does not change the deployed application revision.
