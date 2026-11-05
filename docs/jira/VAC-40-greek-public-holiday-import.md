---
id: VAC-40
type: task
summary: Import Greek public holidays for 2026 through 2028
status: in-progress
created: 2026-11-05
updated: 2026-11-05
parent: null
depends_on: [VAC-26]
---

# VAC-40 — Import Greek public holidays for 2026 through 2028

![Task](badges/task.svg) **🔨 In progress** · Owner: Unassigned

## Description

Prepare the reference data needed for working-day leave previews by importing Greece (GR) public holidays for 2026, 2027 and 2028 from holidays.abouts.co. Keep provider-specific parsing separate from normalized holiday records so the source can change. Founder request, 2026-11-05; this is bounded reference-data work, not leave submission implementation.

## Scope

Phase 1: one-time fetch, validate, review and persist the three years in SQL. Proposed table PublicHolidays: CountryCode char(2), Date date, Name nvarchar(200), unique (CountryCode, Date), plus the existing entity identity/UTC lifecycle/concurrency conventions and source/import provenance. Year is derived from Date. No universal/all-country holiday rows: names/dates shared by countries remain separate country entries. Weekends are computed from the working schedule, not seeded as holidays. Multiple names on a date need review rather than duplicate charge dates.

Phase 2 (deferred): automated/provider integration, refresh scheduling and runtime lookup/calculation wiring. No provider call on form submission in phase 1. Do not add organization settings or employee calendar overrides. The earlier multi-table/version-publication proposal is not required by this bounded initial import; future correction/history behaviour remains to design before calculations use this data.

## Dependencies

- [VAC-26](VAC-26-azure-sql-resource-persistence.md): Existing SQL/EF persistence and explicit operator migration path; retain free-limit/AutoPause and current security controls.

Related, not a dependency: [VAC-31](VAC-31-leave-request-accounting-transactions.md), which will consume reviewed calendar data. No cycle or new prerequisite is added to VAC-31 yet.

## Acceptance scenarios

- [x] Given a selected provider, when fetching is implemented, then its payload mapping stays behind a replaceable adapter and returns country/date/name records.
- [x] Given a response for another country/year, invalid date, non-public type, duplicate date or empty coverage, when validating, then reject it before producing a combined import artifact.
- [ ] Given reviewed GR data for all three years, when the migration/import runs, then persist exactly those country/date/name records and read them back from SQL.
- [ ] Given the same import again, when replayed, then create no duplicates; conflicting existing names/dates require review rather than silent overwrite.
- [ ] Given invalid/incomplete input or an import failure, when attempted, then preserve existing data without a partial batch.
- [ ] Given an ordinary organization actor, when accessing the system, then gain no reference-data write permission or new private/foreign-company data access. Reference holiday rows are public global data, not tenant-owned leave records; no new API is in phase 1.

## Subtasks and responsibilities

Data/tooling: fetch and normalize; preserve evidence. Product/policy: review applicability before using data for leave charges. Database: EF mapping, reviewed forward migration, atomic idempotent operator import and real-SQL checks once the provider dataset is valid. Frontend/API: unchanged in phase 1; runtime integration deferred. Infrastructure: no new resources or access changes. QA: adapter validation plus eventual database readback/replay/conflict/rollback checks.

## Attachments and sources

- [Provider documentation](https://holidays.abouts.co/tools/api), checked 2026-11-05: country/year query and public type; provider advertises free commercial use. This is not independent evidence of holiday accuracy.
- [Requested 2026 response](media/VAC-40/abouts-requested-2026.json), [requested 2027 response](media/VAC-40/abouts-requested-2027.json), [requested 2028 response](media/VAC-40/abouts-requested-2028.json).
- [Acquisition tool](../../scripts/fetch-public-holidays.py), [validation tests](../../scripts/test_fetch_public_holidays.py).
- [Product direction and earlier proposal](../product/holiday-calendar-persistence-proposal.md); accepted ADR-0003/0004 remain architecture authority.

## Comments

- C-1 · 2026-11-05 · Codex: All three requests returned HTTP 200 but country GR/year 2026 and 14 dated 2026 records, including requests for 2027/2028. A reordered query and cache-bypassed retry also returned 2026. The cause is UNVERIFIED; do not assert whether provider or intermediary caching is responsible. No dates were shifted or fabricated. No SQL connection, schema change or import was attempted.
- C-2 · 2026-11-05 · Codex: 2026 payload labels 2026-02-23 as “Ash Sunday”; it is a Monday. Treat the data as unreviewed provider reference data, not accepted statutory charging policy.

## Decisions

- D-1 · 2026-11-05 · Founder: Try holidays.abouts.co; initially persist GR 2026–2028 country/date/name records and keep source replacement easy. Defer ongoing integration to phase 2. [Canonical product direction](../product/holiday-calendar-persistence-proposal.md).
- D-2 · 2026-11-05 · Codex implementation choice: Fail acquisition before writing an import artifact if any requested year is mismatched. Hold database migration/import until valid complete data is available; no alternate provider selected without founder direction.

## Work log

| Entry | Date | Actor / category | Activity | Duration | Basis and evidence |
|---|---|---|---|---|---|
| W-1 | 2026-11-05 | Codex / assistant, unmeasured | Provider probes, normalized acquisition adapter, validation tests and phase specification | Unknown | Tool outputs, saved responses and current diff; elapsed/human time not measured. |

Human actual: Unknown. Assistant duration: Unknown. No estimate or implementation duration invented.

## History

- H-1 · 2026-11-05 · Codex: Created In progress for authorized acquisition/import; provider-response mismatch prevents completion. Acquisition code exists; SQL persistence remains outstanding.

## Verification and release

Six Python tests pass: valid normalization, country/year mismatch, malformed/out-of-year dates/types/names/duplicates, missing coverage, whole-batch rejection and alternative-adapter contract. Saved real responses reproduce rejection for 2027/2028. No runtime build/SQL persistence/tenant endpoint/deployment verification is claimed because those paths are unchanged. No release.

## Open questions and follow-up

Provider must return valid 2027/2028 data, or the founder must choose a different source. Review Greek holiday applicability/labels and observed/regional dates before charging leave. Only after validated acquisition: implement the EF table/operator importer and execute database replay/atomicity checks. Phase 2 remains deferred, without a separate unrequested backlog issue.
