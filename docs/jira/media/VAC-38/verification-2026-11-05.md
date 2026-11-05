# VAC-38 workflow policy verification · 2026-11-05

Scope: local changes to CI triggers/concurrency and Azure preview/apply gating. The application, test implementations, API contracts, Azure resource definitions and repository protection settings are unaffected.

## Event policy

| Event                                                 | Application CI                                           | Infrastructure                                                                  | Publish                                         |
| ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| Feature branch push without a PR                      | None                                                     | None                                                                            | None                                            |
| PR opened/reopened/updated                            | One CI run; older runs for that PR are cancelled         | Separate Bicep compilation only when existing infrastructure path filters match | None                                            |
| PR merge / direct master push                         | None                                                     | None                                                                            | None                                            |
| Manual Deploy Azure, apply=false                      | Skipped                                                  | Compile, then Azure validation and what-if                                      | None                                            |
| Manual Deploy Azure, apply=true, deploy_backend=true  | Full backend/frontend/API-browser checks                 | Compile, validate, what-if, apply                                               | Same-run API/web artifacts, then full smoke     |
| Manual Deploy Azure, apply=true, deploy_backend=false | Frontend checks; backend/paired checks skipped as before | Compile, validate, what-if, apply                                               | Same-run web artifact, then frontend-only smoke |

PR checks test GitHub's PR merge ref. Actual apply verifies the selected deployment commit independently; no PR artifact is substituted for a potentially different merge/squash SHA. Manual deployment remains explicit. Removing automatic push validation also removes validation of direct master pushes; required PRs/checks need repository protection settings, which this change does not configure.

## Checks performed

- Parsed both workflow files using Ruby standard-library YAML (normalizing YAML 1.1's boolean interpretation of the `on` key for the test harness).
- Evaluated the actual deployment condition over 192 combinations: pull_request/push/workflow_dispatch; apply false/true; compile and check results success/failure/cancelled/skipped; cancellation false/true. Actual gate matched the expected policy in all cases.
- Checked application CI calls run only for manual apply. The deploy gate includes an explicit cancellation status function so preview can run after its deliberately skipped checks dependency; apply still requires checks.result=success and compile.result=success.
- Checked old/new runs of the same PR share a concurrency group; different PRs and distinct manual runs have different groups. Caller/callee workflow groups differ. Automatic PR runs cancel prior runs; manual workflow runs do not cancel each other, and existing per-environment deployment serialization remains.
- Verified trigger sets, unchanged skip_backend/deploy_backend/apply defaults and mapping, valid job dependencies, read-only workflow token permissions and same-run artifact downloads.
- Verified full API/browser invocation still has native input checks enabled, with no functional-only shortcut. Application test commands and deploy smoke modes are unchanged.
- All embedded Bash commands passed `bash -n`; the deployment Python block passed AST parsing.
- Markdown/workflow formatting, new/changed links (pre-existing missing infrastructure-history links are unchanged), issue/backlog metadata and `git diff --check` passed.

The local Boolean/string-expression harness checks this limited expression subset; it is not GitHub's Actions runner. No actionlint binary was installed on this host. No application rebuild is needed for scheduling-only changes. No new tenant-isolation test applies; full CI retains its existing API/browser assertions.

## Limits

No hosted workflow, merge, dispatch, Azure change or branch-protection update was performed. Successful/failed/cancelled hosted job behavior still needs observation after commit/push; VAC-38 remains QA. The connector's PR-run query for the starting f3ccd30 returned no results and does not list push/manual runs; no historical run counts or measured cost savings are claimed.

Primary sources checked 2026-11-05: [GitHub workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [status functions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions), [reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
