# VAC-8 / VAC-9 dev release — 2026-10-25

The founder authorized committing and deploying the reviewed calendar-first and eligibility mock. Application revision **`0ca66c95188d72ed5f4961a4003d5aadc73a8bb4`** is live at [Azure dev](https://lemon-beach-02f7a7103.4.azurestaticapps.net), subscription `07d79495-1f4f-40fd-9fdf-84605214e5e6`, resource group **`rg-vacate-dev`**. Use firstname/firstname, or `user/user` (Maya) and `admin/admin` (Nora).

## Changes and decisions

- [VAC-8](jira/VAC-8-calendar-first-and-balances-page.md): Calendar is the main content, with only own annual balance at the upper right; mobile shows the calendar first. Other balances have a dedicated My balances page. A/B/C alternatives remain available.
- [VAC-9](jira/VAC-9-eligibility-contract-and-mock-decisions.md): one centralized, provisional GR profile evaluator supplies backend-shaped eligible/not-eligible/to-confirm decisions. Known-unavailable types are hidden from default personal choices and disabled under Show all. Unknown eligibility has no invented personal quota. No upcoming-event prerequisite is introduced.
- Deployment inputs: `environment=dev`, `apply=true`, **`deploy_backend=false`**. Bicep validation/what-if and incremental infrastructure deployment passed. No API application package was published; the existing API revision is retained.

## Hosted evidence

- [CI passed](https://github.com/alxkio/vacate/actions/runs/40136181413) for the exact application revision: frontend and backend jobs succeeded, including build/test/package checks, fixtures, schema validation and smoke-helper regressions.
- [Azure deployment passed](https://github.com/alxkio/vacate/actions/runs/40136375542): compile and frontend checks succeeded; backend checks were skipped. Publish Angular and Verify deployed frontend succeeded. Publish API and full API endpoint smoke were skipped as intended.
- A separate request to the live `/gallery-revision.json` returned the exact application revision above. Hosted frontend smoke verified runtime configuration, revision markers, root/login/assets (including `leave-eligibility.js`), cache rules and retained Angular routes.

## Live browser acceptance

The complete Chrome acceptance suite passed against the deployed site with the committed verifier:

```sh
MOCK_URL=https://lemon-beach-02f7a7103.4.azurestaticapps.net/index.html \
MOCK_SCREENSHOT_DIR=/private/tmp/vacate-vac8-vac9-live-previews \
node docs/design/calendar-mock/verify.mjs
```

Verified all 12 firstname accounts and aliases; independently expected scope rosters and denied identifiers; own records/shared privacy; resets and actual Back/Forward; trusted keyboard Escape/focus return and shortlist toggles; preserved drafts/uncommon selections; profile-dependent default choices; all 30 reference types with guarded unavailable actions; sick unknown quota and child-only scope; balance units/projections; all calendar scopes/views; calendar-first annual rail; dedicated balances routes/refresh/focus; mobile balances/requests. The suite captured 11 screenshots; live A desktop and balances mobile images were visually inspected. No application assertions were waived. [Local review and representative images](jira/media/VAC-8/verification.md) remain historical implementation evidence.

## Sources, open questions and limits

Source documents: [calendar design](design/calendar-first-balances-proposal.md), [eligibility review matrix](product/leave-eligibility-review.md), [proposed backend contract](contracts/leave-eligibility.md), [JSON schema](contracts/leave-eligibility.schema.json), [policy sources](compliance/policy-sources.md), [mock README](design/calendar-mock/README.md), both issue records and the [backlog](jira/Product-Backlog.md).

Final A/B/C selection and shortlist revisions remain open. The eligibility matrix retains the founder/source differences and five policy questions; mock demographic shortcuts are not a verified statutory rule pack. Company overrides, birth registration/documents, real backend decisions/submission validation and production tenant isolation are future work. Public synthetic fixture filtering does not establish a security boundary. No real employee data is added.

Human actual and active assistant duration are Unknown. Workflow/browser durations were not recorded as attributable work; no inferred time or shared totals are added. A subsequent documentation-only commit records this evidence and does not change the deployed application revision.
