# Holiday-calendar persistence direction

## Founder-selected initial scope · 2026-11-05

Try holidays.abouts.co for a one-time import of Greece (GR) public holidays for 2026, 2027 and 2028. Persist country code, date and name in a shared PublicHolidays table, with a country/date uniqueness constraint and normal identity/lifecycle/source provenance. Keep the acquisition adapter separate from normalized records and the eventual database import. Do not model New Year/Christmas as universal holidays: store explicit country applicability, even where names/dates coincide.

Phase 1 is acquisition, validation, review and database persistence. Phase 2 is ongoing provider integration/refresh and runtime calendar wiring. No automatic job or form-time external call is requested now. The current provider returns 2026 for all three year queries, so import is held and no SQL changes were made. [VAC-40](../jira/VAC-40-greek-public-holiday-import.md) owns implementation and evidence.

## Earlier proposal — deferred alternatives


**PROPOSED for product/architecture review, 2026-11-05:** persist reviewed holiday dates in the existing SQL database. Store shared country reference data once; keep organization configuration and private request/charge records company-scoped. This refines the earlier tenant-calendar candidate in the [schema catalogue](../database/schema-catalogue.md#stage-c-extension-catalogue-excluded-migrations); it does not change the accepted runtime schema or authorize a migration.

| Record | Proposed fields and constraints | Purpose |
|---|---|---|
| HolidayCalendars / shared reference | Id, immutable Guid, CountryCode, Name; unique country for the initial national-only scope | Stable identity for a country calendar; no organization or employee data. Regional variants require an explicit later scope decision. |
| HolidayCalendarVersions / shared reference | CalendarId, Year, Revision, Status (draft/published/superseded), SourceReferences, RetrievedAt, ReviewedAt, PublishedAt, content checksum; unique calendar/year/revision | Explicit year coverage and provenance. Published content is immutable; corrections create a new revision. Publication must be atomic with its complete date set. |
| HolidayDates / dependent reference | CalendarVersionId, Day (SQL date), Name, SourceReference; unique version/day; date must fall in the version year | Actual non-working dates, including applicable observed/substitute dates only when supported by the reviewed source. Deduplicate multiple holiday names on the same date for charging. |
| Organization configuration / tenant | CountryCode (required before calculation), effective-dated country/workweek configuration revision | Select the calendar from the organization's country; keep the weekday pattern separate from holidays. Do not persist recurring weekends as holiday rows. Retain configuration used by historical requests. |
| Request calculation evidence / tenant | RequestId, CompanyId, calendar version IDs for each covered year, schedule/configuration revision, calculation version and per-date charged/excluded breakdown with reason | Explain saved quantities and preserve the original charge after a holiday correction or organization change. Exact mapping to Leaves/charge rows needs implementation design; no stored balance totals. |

Use existing entity identity/lifecycle and concurrency conventions where applicable; dependent holiday dates inherit their version's lifecycle. Shared reference publication must be a controlled platform maintenance operation, not an organization employee/admin write permission. Organizations read applicable published calendars through authorized APIs; private calculation evidence uses same-company constraints and existing leave permissions.

Recommended acquisition: import an explicitly reviewed country/year dataset with source URLs and dates, validate it, then publish it. This can begin as a version-controlled import file feeding SQL; frontend bundles and live third-party calls are not authoritative at request time. Provider, license, supported countries/years, reviewer and refresh process are **OPEN QUESTIONS**; no external provider or statutory holiday list is selected here. Existing non-null membership calendar references are currently rejected; do not activate employee overrides as a shortcut around the organization-country rule.

Recommended calculation: resolve the organization's effective country/workweek and published calendar revision for every year touched by the range; count a date once only if it is a working weekday and absent from the applicable holiday dates. Pin the revisions when saving. Earlier recommendation, superseded for form submission by the founder on 2026-11-05: missing country/year coverage would block submission. The current accepted form rule instead calculates using the company working schedule/weekends only where holiday data is missing; an empty *published, reviewed* year is distinguishable from missing data. Corrections do not silently rewrite existing requests; treatment of already-pending/future requests needs an explicit decision.

Additional proposed storage acceptance: reject duplicate version/date rows and out-of-year dates; reject unauthorized publication; prove a cross-year range uses both years' revisions; prove missing coverage is not treated as no holidays; prove a new revision leaves saved calculation evidence unchanged; reject cross-company evidence reads/writes. Test against real SQL when implemented.


Status: Founder-selected bounded phase 1 above supersedes the earlier blanket deferral for that scope only. The earlier multi-table versioning proposal remains unaccepted and is not required for phase 1. Source: founder clarification after the VAC-31 specification discussion, 2026-11-05.
