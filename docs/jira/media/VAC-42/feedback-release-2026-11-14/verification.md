# VAC-42 dev feedback release · 2026-11-14

The owner explicitly requested merging and deploying all changes for another feedback round. [PR #7](https://github.com/alxkio/vacate/pull/7) merged the tested head `f11db5962cf9370e0dc8d78ad41c6422ec0c5db5` into `master` as **`1aa57070aba213cf4d4bebb3ace5c0eab448276e`**.

## Release evidence

- [Final PR CI](https://github.com/alxkio/vacate/actions/runs/43596397142): all three jobs passed, including the complete trusted native/adversarial input and functional API/browser suite. Local shared-table acceptance additionally covered personal filters/cancellation, matched computed table presentation, Nora's consolidated People/balances, legacy URL and 1440/375/320px layouts. All 96 Angular tests, production build and both TypeScript projects passed; administrator functional acceptance and four offline database-deployment checks passed.
- [Dev preview](https://github.com/alxkio/vacate/actions/runs/43596805214): succeeded for the final branch tree. What-if reported six existing resources modified, four unchanged and three ignored; no creates/deletes and SQL provisioning untouched. Reported default/expression differences are not proof each resource property changed.
- [Full dev deployment](https://github.com/alxkio/vacate/actions/runs/43597297266): all jobs passed for merged revision `1aa5707`. Its own repeated CI checks passed before publication.
- The database operator succeeded against `vacate-dev-srv.database.windows.net` / `vacate-dev-db`, checking artifact revision, applying forward migrations, runtime grants, no pending migrations and mapped-column reads. The package includes `SharedApiSessions` and `LeaveCancellationExpiry`. This is actual hosted database-gate execution, distinct from the skipped SQL-provider test suite.
- API and Angular publication succeeded, followed by endpoint/revision/CORS/asset/development-database smoke checks.
- The explicitly selected `import_demo_history=true` step succeeded after publication and smoke: **14 fictional dated requests imported**, with opening used totals preserved and existing requests not overwritten. This option defaults off and is restricted to applied full dev deployments. No reset or production import.

## Independent live check

[Web](https://lemon-beach-02f7a7103.4.azurestaticapps.net) config and [API health](https://vacate-dev-sc-wv5pdctnrzamu-api.azurewebsites.net/api/health) both returned the exact merged revision. A subsequent Chrome 150 / Node 22.22.3 / macOS check used only temporary Maya/Nora demo sessions and existing saved data; every created ticket was revoked and then rejected with 401.

Verified the actual hosted UI at 1440/375px:

- My Leave has initially collapsed balances and one shared-component saved table, with August past history and October Expired dates. Maya had 17 recorded dates and Nora three at inspection; these are a snapshot of demo data, not fixed expected quotas.
- Main-landmark focus computes `outline: none`; no blue page frame. My Leave and People have the same computed table typography and spacing.
- People has search/scope controls and a single You marker, no Relationship column or separate balances navigation item. Employee personnel access is denied; the live 404 conforms to the existing 403/404 privacy contract.
- Nora's People table includes annual balances and actions. Searching Maya returns one row. The legacy balances URL renders the same People component/title, without a second page implementation.
- Page-level horizontal overflow is absent; wide tables scroll within their named, keyboard-focusable region. No unexpected browser exceptions.

The first diagnostic run expected only 403 for employee personnel access and correctly stopped on the permitted 404. The temporary verification assertion was corrected to the repository's existing 403/404 denial contract; no application permission changed. Both runs revoked their captured sessions. The final check passed.

[Machine-readable snapshot](verification.json), [My Leave desktop](maya-my-leave-1440.png), [My Leave mobile](maya-my-leave-375.png), [Nora People/balances desktop](nora-people-balances-1440.png), [Nora People/balances mobile](nora-people-balances-375.png). Images contain fictional dev records only.

## Limits and handoff

The dev revision is ready for owner feedback. Sign in again after the storage upgrade: earlier process-memory tickets cannot migrate to SQL. No leave/profile/membership resource writes were made by the independent hosted review; the selected operator import is recorded separately above.

32 isolated SQL-provider cases remain unexecuted without a separate authorized test database. Hosted migration/grant/read success does not establish those concurrency/rollback cases, worker-restart/instance-rotation continuity, screen-reader conformance or production identity readiness. VAC-42 remains QA for further owner review and its outstanding gates; this records a named dev delivery, not production approval.

Assistant recorded time unmeasured; human actual Unknown. Workflow timestamps are automation evidence, not inferred human hours. Later release-evidence-only commits do not change the published application revision.
