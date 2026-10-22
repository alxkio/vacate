---
name: vacate-issues
description: Create, update or implement Vacate file-based stories, bugs, epics and tasks; maintain the docs/jira backlog, status, decisions, evidence and work logs.
---

# Vacate issues

This is a repository-local workflow. Read root `AGENTS.md`, [the issue conventions](../../../docs/jira/README.md), [the backlog](../../../docs/jira/Product-Backlog.md) and the relevant issue before editing. Issue records do not override accepted ADRs, product documents or reviewed policy sources.

## Create

- Use [assets/issue-template.md](assets/issue-template.md), scaled to the issue type. Keep one Markdown file per real issue directly in `docs/jira/`.
- Allocate the next unused positive `VAC-<number>` across all types after checking files and the backlog; consult history if records are missing. Never reuse an ID. `VAC-0` is reserved for the fictional example and excluded from backlog/time totals. Recheck allocations when work is concurrent.
- Keep YAML metadata, rendered heading/type/status and the backlog's ID, type, summary, status, dependencies and link consistent in the same change. Use the local badge for the selected type.
- Store only direct implementation prerequisites in `depends_on` (an empty list for none), mirror them as backlog links and explain the required output in Dependencies. Keep coordination/related links separate; verify real targets and no self-links/cycles. Do not turn mutual references or epic membership into blockers. Retain completed prerequisites and verify the needed output before implementation; their completion does not automatically change this issue's status.
- Write the requested outcome, description, scope, acceptance scenarios and sources. Add useful responsibility subtasks; state Not applicable for unrelated areas. Bugs need reproduction steps and expected/actual behaviour; epics link children and do not duplicate their time.
- Use relative links to existing evidence or `docs/jira/media/VAC-<number>/` for necessary new attachments. Do not copy employee/medical data or credentials into issues.

## Update or implement

Keep the issue current as work progresses. The stored statuses are `specification`, `todo`, `in-progress`, `qa`, `done`, `released`; their gates are defined in the conventions. `todo` means Open / ready for action. Record blockers and backward moves with reasons. Do not mark Done from a unit test alone or Released without a named target/version and release evidence.

Append dated, attributed comments, decisions, status history and work entries. Label reconstructed history Retrospective; distinguish paraphrase from quotation. Link durable decisions to their canonical documents. An issue documenting a synthetic dev release does not establish production policy, permissions or readiness.

Log time with entry IDs, actor/category, activity, duration, basis and evidence. Keep human actual, assistant recorded, automation elapsed and estimates separate; unknown stays Unknown. Attribute only supported time. Reference shared measurements once; do not sum parent/child logs, nested subtotals, parallel agents or elapsed windows into the same total. The historical audit is already owned by VAC-1 and must not be copied as extra time onto future issues.

Create/link an issue for material authorised product work. Leave unrequested ideas as notes rather than silently populating the backlog. File edits do not authorise external Jira operations, commits, pushes or deployments.

## Finish

Check unique real IDs, allowed types/statuses, matching backlog values/dependencies, valid dependency targets and no cycles, valid relative links/media, acceptance evidence appropriate to the current status, and work-log arithmetic/bases. Summarise issues/documents changed, decisions, open questions and verification. Keep all real issues in the backlog even after release; exclude the example.
