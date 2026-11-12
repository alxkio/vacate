# VAC-42 local verification · 11–12 November 2026

Local macOS 12.7.6; Chrome 150.0.7871.125; Node 22.22.3; Angular existing workspace. Fictional seeded accounts only. Working tree started clean. API/backend/contracts are unchanged. No SQL/hosted verification, commit, push or deployment occurred.

## Automated checks

| Check                                            | Result and boundary                                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing Vitest suite                            | **71 passed, 17 files** after implementation and focus refinement. Latest full run: 7.92s; test build 14.125s. A final focused rerun covers the added explicit cross-company feedback assertion. |
| App and spec TypeScript                          | Both `tsc --project … --noEmit` passed.                                                                                                                                                          |
| Production Angular build                         | Passed on final source, 329.02 kB initial raw / 88.53 kB estimated transfer. Last build 8.649s. Existing macOS Sass flags used.                                                                  |
| `verify-fixtures.mjs`                            | Passed all twelve fictional accounts, own/shared privacy projections, scope and invalid/stale contexts. Synthetic presentation evidence.                                                         |
| `verify-eligibility-contract.mjs`                | Passed schema and 360 reference decisions. No statutory policy certification.                                                                                                                    |
| `verify-profiles.mjs`, `verify-organization.mjs` | Passed reference write-double allowlists, atomicity, stale/foreign contexts and optional structure scenarios. Distinct from real API/browser tests.                                              |
| Impeccable source detector                       | Baseline and final review scan returned `[]`. Manual findings show that zero detector results do not imply accessibility conformance.                                                            |
| Formatting and diff                              | Changed TS/templates/component SCSS checked/formatted; new shared SCSS section formatted without reformatting the unrelated existing minified stylesheet. `git diff --check` passed.             |
| Issue/index integrity                            | All 41 real issue files indexed; unique IDs, valid prerequisites and no dependency cycles. VAC-42 metadata/backlog and report/media links checked.                                               |

Build/test host details: older system Core Tools 4.0.4483 started an empty host; cached 4.16.0 lacked its worker-discovery directory. Restoring that empty directory in `/private/tmp` and starting 4.16.0 against the SDK-built output initialized the isolated worker on port 7073 with `Persistence__Provider=InMemory`, development authentication and seeding enabled. No application fix was needed. The first test attempt used unsupported embedded Sass; compatibility flags resolved it. Some sandbox builds aborted with exit 134; an outside-sandbox build passed, followed by the approved compatible final build. These environment failures were not counted as passing checks.

## Real API and browser evidence

Complete repository suite invocation from `frontend/`:

```sh
MOCK_API_URL=http://127.0.0.1:7073 \
MOCK_SCREENSHOT_DIR=/private/tmp/vacate-design-review/acceptance \
MOCK_SUITE_TIMEOUT_MS=900000 \
/Users/user208256/.nvm/versions/node/v22.22.3/bin/node verify.mjs
```

**Passed without functional-only flags**, including:

- Native input readiness regressions and trusted keyboard Escape/focus return, shortlist/pinned selections/draft preservation, account dropdown/settings.
- All twelve accounts/aliases, own/shared records and scope/foreign-ID denials; logout/account-switch Back/Forward and page-history restoration.
- Real leave preview and save: inclusive dates, excluded Sundays, duration mode, disabled hours, negative/unknown/zero-day cases, persisted calendar/history, already-covered acknowledgement.
- Per-account display preferences, both calendar/planner layouts and alternate palette.
- Own profile validation/save/cancel/reload and isolation; organization/workweek/department/team changes, membership HTTP save/reload, foreign IDs and mobile layouts.
- Owner/HR/lead/employee settings, scoped delegation/revocation and approval inheritance.

This complete run followed the main implementation. Final small refinements (persistent keyboard refresh actions, policy spacing, table minimum width and muted-text contrast) received a fresh build, unit suite and focused rendered checks below; the complete suite was not repeated merely for those CSS/focus changes.

A temporary CDP review harness derived from the repository browser harness was used for inventory captures and focused checks at `/private/tmp/vacate-design-review.mjs`. It adds no dependency or production fixture fallback. Its modes and checks:

- Default review: all four advertised accounts; active pages and Settings sections; help/request/account dialogs; both layouts/colors and year/month/week/day query variants. Desktop 1440px, mobile 375px and variant checks at 320px. Some planner periods intentionally normalize through the existing route adapter. No page-level horizontal overflow was observed; tables retain intentional internal scrolling. The initial draft harness stopped at a synthetic membership-focus assertion because `.click()` had not focused its trigger; the final targeted check explicitly focused that trigger and passed.
- Failed reads: Chrome Network blocking of saved requests and directory reads showed error/retry states. Empty saved history was suppressed during failure. Unblocking and activating Retry restored data. The first directory-block pattern targeted an unused URL; it was corrected to the actual `/api/users` read and the check passed.
- `MOCK_FOCUS_ONLY=1`: a focused retry initially exposed lost focus when disabled. After the guarded `aria-disabled` correction, both saved-history and directory buttons retained focus after recovery. No native keyboard claim is made for these scripted-focus checks; native input is established separately by the full suite.
- `MOCK_FINAL_ONLY=1`: final built artifact checked at 1440/375/320px for admin table, policy form, lower membership fields and action buttons; no page overflow. Department/team drilldowns, accessible event dialog naming and membership Cancel focus return passed.

The earlier inventory captures are retained locally in `/private/tmp/vacate-design-review/after` (140 images). Final targeted captures are in `/private/tmp/vacate-design-review/final`. Representative repository evidence:

| Surface/state                             | Evidence                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Calendar and readable reference labels    | [Desktop](calendar-desktop.png)                                                                  |
| Saved history before reference cards      | [My Leave mobile](my-leave-mobile.png)                                                           |
| API-save explanation in request form      | [Request mobile](request-mobile.png)                                                             |
| Failed saved history / directory recovery | [Saved leave error](saved-leave-error-mobile.png), [directory error](directory-error-mobile.png) |
| Alternate layout and palette at 320px     | [Warm-brown planner](planner-brown-320.png)                                                      |
| Table with internal scrolling             | [Balance overview mobile](admin-balances-mobile.png)                                             |
| Separated policy labels and controls      | [Organization policy mobile](organization-policy-mobile.png)                                     |
| Lower editor fields and actions           | [Membership fields](membership-fields-mobile.png), [320px actions](membership-actions-320.png)   |
| Organization drilldowns                   | [Department](department-mobile.png), [team](team-mobile.png)                                     |

Representatives from the first post-change batch predate the small final contrast/focus refinements. Final targeted admin captures use the final built artifact. Screenshots prove their captured state, not all possible content/assistive technology combinations.

## Contrast and limits

Calculated standard sRGB token contrast after darkening `--muted` to `#586872`: white 5.77:1; canvas 5.36:1; green pale 5.12:1; warm-brown pale 4.79:1. Primary white-on-green is 6.71:1; white-on-brown 6.09:1. These are token checks, not a complete pixel/contrast audit of every legacy label/status.

Real screen readers, physical mobile hardware, every OS zoom/font combination, production identity, SQL provider/concurrency/grants and deployed application behavior remain **UNVERIFIED**. Keyboard/semantic checks do not certify WCAG conformance. Product questions about an operational pending-approval handoff, a future read-only example flow and hiding unavailable navigation remain proposals. No server workflow or legal-policy change was made.
