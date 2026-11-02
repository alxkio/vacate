# Architect review after cleanup

Date: 2026-11-02. Reviewer: separate read-only Enterprise Architect agent requested by the product lead. Scope: accepted ADRs; domain/application/EF boundaries; migrations/tooling/runtime grants; Bicep/modules/workflows; saved actual Azure post-cleanup evidence. This is architecture review, not human or full release approval.

Initial review found no P0/P1 or substantive deployed SQL cost/security blocker. One P2 operational-document consistency finding identified stale backend names, in-memory resource claims, outdated monitoring/deployment statements and wording inconsistent with the explicitly approved development firewall exception. Corrections were made in infra/README.md, docs/database/implementation-stage-a.md and VAC-26/VAC-35. Follow-up read-only review confirmed that finding resolved and found no remaining architectural blocker.

The reviewed state retains ten Azure resources and retires eight replaced/unneeded resources. SQL free-limit/AutoPause, Entra-only/TLS, scoped runtime permissions, tenant relationship constraints and internal IsDemo handling agree with accepted scope and saved readback. Free frontend remains West Europe; regional backend/SQL are Sweden Central. The all-IPv4 SQL rule is the explicit initial-development user exception, not a production recommendation or an authorization to weaken authentication.

## Balance and organization mapping questions

MembershipBalanceSnapshots preserves the existing AnnualBalance representation across restarts: period, allocation inputs, used and pending amounts. One row per membership is a compatibility representation, not historical snapshots, transaction history or an authoritative leave ledger. Removing it needs a replacement source for current API/UI responses. Future accepted entitlement/leave work can replace it through an explicit migration; no policy/accounting behavior is implemented by this table.

VacationSettings is logically separated in the domain and its current few fields are stored on Organizations. Retain that mapping for this cutover: one aggregate/transaction boundary without another join. A separate one-to-one settings table can be justified by independent versioning, permissions, lifecycle or concurrency; none is established by the current feature requirements. The product lead's questions do not by themselves authorize another schema migration.

## Remaining limitations

Global admission locking serializes unrelated company operations; private aggregate hydration remains internal with projection allowlists. Sessions are process-local development authentication. Production identity, recovery and retention/erasure decisions remain open. FC1 free grants are shared; monitoring daily quota is not a hard financial cap. Existing VAC-15 native/default browser QA remains unresolved despite passing hosted functional mode. No full native-suite or production release approval is implied.

Review duration: Unknown, unmeasured assistant time; not added to human actuals or provider automation elapsed.
