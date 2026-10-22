# Time-spent evidence — 2026-10-22

**Finding:** local records contain **6h 31m 36s of recorded assistant turn duration**, including **5h 44m 12s for 20–22 October**. These figures measure logged assistant turns, not total human effort or combined person-hours. No defensible exact total of the founder's working time is available.

| Period, Europe/Athens | Ended root turns | Recorded duration |
|---|---:|---:|
| 2026-09-03 to 2026-09-05 | 49 | 0h 47m 24s |
| 2026-10-20 | 7 | 0h 15m 48s |
| 2026-10-21 to 2026-10-22 | 25 | 5h 28m 24s |
| **Total** | **81** | **6h 31m 36s** |

## Sources and method

The [timestamp-only evidence CSV](time-spent-evidence.csv) lists the source session filename, turn ID, start/end timestamps, completion status and original `duration_ms` field. No conversation text or credentials are copied.

Read local JSONL files under `/Users/user208256/.codex/sessions/`; select top-level sessions whose metadata identifies the Vacate checkout, then inspect requests to confirm project relevance. Seven root sessions cover project discovery, design, setup, implementation and release work. Exclude sub-agent/guardian sessions to avoid parallel-work double counting. Exclude the unrelated company-data project session opened on 10 September even though its initial working directory was Vacate.

Sum the logged `duration_ms` for 80 `task_complete` events and one `turn_aborted` event. Deduplicate by source, turn ID and start/end; verify that included root-turn windows do not overlap. Exclude the in-progress time-audit request. The audit snapshot ends at the preceding release-closeout turn, 22 October 2026, 23:12:35 Athens time. Milliseconds are retained in the CSV; the table rounds to the nearest second.

**Two different measurements:** the included start/end windows sum to **15h 22m 49s**, while their recorded duration fields sum to **6h 31m 36s**. These clocks differ materially in long-running turns. Do not interpret the difference as known working time, or assume undocumented timer semantics. Session-wide first-to-last spans also include long breaks and are unsuitable as effort totals.

## Corroborating project history

Git `master` contains 16 commits as of `591a523`; the earliest is `8aee89e` on 5 June 2026 at 10:01:45 Athens time. Earlier research/context work therefore predates the available included session records. Commit dates confirm milestones; they do not record work-session starts or durations.

- `b0179e5`, 20 October 16:58 — application/project structure; this predates the included October session beginning that evening.
- `96e4632`, 22 October 00:22 — infrastructure and deployment preparation.
- `995ec89`, 22 October 14:19 — first successful gallery deployment revision.
- `775e54a`, 22 October 22:28 — approved catalogue and five-day mock balances.
- `591a523`, 22 October 23:08 — final deployment evidence.

The [first deployment record](cloud-deploy-2026-10-22.md) and [latest release record](release-2026-10-22-leave-mock.md) link CI/deployment runs that corroborate delivery. Runner elapsed time is automation time and is not added to assistant duration or human effort.

## Limits and open question

This is a partial historical measurement. It does not measure the founder's reading, decisions, manual Azure/GitHub setup, work in other tools, or unrecorded earlier sessions. Tool/approval waits may affect recorded turns, and the duration field's timing rules have not been independently established. It is neither an exact human timesheet nor a reliable lower bound on human working hours.

**OPEN QUESTION:** if a combined project-effort estimate is needed, reconcile these records with the founder's own session estimates and define a tracking method going forward.

Only this report and its evidence CSV were added for the audit; application code, deployment and existing product decisions are unchanged. Verified CSV totals, event counts, duplicate exclusion, non-overlapping root windows and milestone timestamps against local logs/Git. Not committed or pushed.
