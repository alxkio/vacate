# VAC-36 replacement verification

Date: 2026-11-02 · [deployed revision/artifact](deployed-artifact.json) `vac36-derived-20261102`. This supplements the earlier VAC-26/VAC-35 baseline evidence; it does not retroactively claim those tests covered the new mapping.

## Source and migration

Product lead explicitly selected immediate replacement of snapshots with leave records and derived balance calculation. Accepted ADR-0004 was amended with that direction; organization settings mapping remains unchanged. MembershipEntitlements now stores only current period/allocation inputs; Leaves holds positive day quantities and explicit accounting provenance/status. Runtime used/pending/available totals are not persisted.

Release build passed without warnings; baseline tests passed 18 integration plus 10 unit cases. Seventeen actual-SQL cases were intentionally skipped without the explicit connection in that baseline. Updated provider tests cover derived sums, cancelled exclusion, independent company consumption, allocation edit preservation, foreign-company FK rejection, opening uniqueness, invalid quantity/date/origin/status, rowversion and unknown allocation. The separate actual-SQL test execution request was rejected by the execution approval tool before the command ran. Those seventeen cases are NOT reported passed; prior ten-provider-test evidence applies only to the preceding schema. No retry of the rejected test command was made.

EF model has no pending changes. C# format verification passed. Reviewed idempotent forward SQL is [0003](../../../database/migrations/0003-derived-leave-balances.sql); previously applied migrations are retained. Before applying, the actual migration script ran twice in rollback-only acceptance transactions against the real dev baseline: an altered nonzero consumption amount was rejected with the intended provenance error; the positive run verified exact source counts and per-membership Used/Pending sums before dropping the old table. Both tests rolled back, including migration history. The rehearsal was repeated after correcting the architect's numeric-ID finding and passed.

## Applied development state

Briefly stopped the old dev API, explicitly applied migration 20261102193840_DerivedLeaveBalances and repeated migrate successfully. Operator inspect reported three migration-history entries, 14 MembershipEntitlements and 14 Leaves, no MembershipBalanceSnapshots; the 14 memberships comprise 12 original fixtures plus zero-consumption synthetic acceptance records. All 12 original user/membership identities and the fixture organization IsDemo=true are preserved. Normal organizations remain false. No real employee data or invented occurrence dates; opening entries are labeled fictional-fixture-opening-v1.

Runtime grants verified resource DML and Leaves SELECT only; db_owner, CREATE TABLE, physical DELETE, migration-history UPDATE and Leaves INSERT/UPDATE/DELETE denied. No startup migration/import, SQL password, Graph grant, request/approval endpoint or policy evaluator was added.

Code upload succeeded, but Azure CLI returned nonzero from its post-upload health check while the API was deliberately stopped. The existing app was then explicitly started. The subsequent hosted checks, rather than that CLI health poll, establish the running result. Frontend assets remain unchanged apart from matching public revision metadata; existing Free SWA retained.

- Real hosted HTTP acceptance passed all twelve sessions/revocation, resource CRUD/lifecycle/conflicts, private projections and company authorization.
- All twelve live user projections passed shared JSON Schema checks.
- Full matching web/API cloud smoke passed: revision, health, assets/routes/config and exact allowed/denied CORS.
- Complete hosted functional browser acceptance passed in Chrome150: all twelve accounts/scopes/privacy, resource edits, owner/HR/delegation/approval inheritance, unchanged balance projections, account history and responsive views. Native checks are excluded in this mode and are not claimed passed.
- Full native/default browser reliability remains existing VAC-15 QA; no pass inferred from functional mode.

## Cost and infrastructure

[Actual SQL readback after replacement](sql-free-controls-after-replacement.json): useFreeLimit=true, freeLimitExhaustionBehavior=AutoPause, General Purpose serverless GP_S_Gen5, max34359738368 bytes, min0.5/max2vCores, local backup redundancy, approved Latin1_General_100_CI_AS_SC_UTF8. Observed idle autoPauseDelay=60 minutes remains distinct from monthly exhaustion AutoPause. Monthly free allowance is 100,000 vCore-seconds, 32GB data and 32GB backups; exhaustion means downtime until the next calendar month, no BillOverUsage/fallback.

No Azure resources or cost/network settings were created/changed by this schema replacement. The ten-resource post-cleanup inventory and eight retired resources remain documented in VAC-35. Defender paid plans remain disabled; no Defender protection claim is inferred from the Free pricing tier. Initial-development all-IPv4 SQL access remains explicitly approved, with Entra-only/TLS and scoped permissions. Storage/light monitoring remain the separately approved minimum-cost resources; FC1 grants and log cap are not hard spending ceilings.

[Existing platform-metric measurement](../VAC-35/sql-platform-allowance-metrics.json), before this schema replacement: daily maxima 25MiB data used, 32MiB allocated; full/differential/log backups 1/1/9MiB. These are returned-window maxima, not a measurement of the current remaining compute balance. No paid sink/monitoring dependency was enabled to read them.

## Review and remaining work

Pre-apply architect review found no P0/P1 blocker and one P2: add numeric internal Id alongside unique immutable Guid for Leaves. Corrected before applying; architect confirmed resolved. Final post-apply architect review found no new P0/P1 architectural blocker; it requires keeping the updated provider-test execution gap explicit and VAC-36 in QA. [Review record](architect-review-2026-11-02.md). Outstanding provider execution, native-browser QA, production identity/recovery/retention and future request/approval/calendar/carryover rules remain explicit. Derivation alone does not enforce concurrent overspend; no write workflow is claimed.

Human actual and assistant duration: Unknown, unmeasured. Provider test elapsed from earlier VAC-26 is not reused as VAC-36 effort or acceptance.
