# Vacate issues

One Markdown file per issue; [Product-Backlog.md](Product-Backlog.md) indexes every real issue, including Done and Released. This is the repository's Jira-like workflow, established by the founder on 2026-10-22. It does not sync with an external Jira service.

## Identity and files

Real keys start at **VAC-1** and increase across all issue types. Use `VAC-<number>-<short-slug>.md` directly in this folder. Keys are permanent: do not renumber or reuse them, delete completed issues, or move files when their status changes. Before assigning an ID, check issue files and the backlog; also check Git history if an earlier issue was removed. Allocate IDs serially and recheck uniqueness before finishing a change.

The populated [Example Story.md](<Example Story.md>) uses **VAC-0**, reserved for fiction. It never enters the product backlog, consumes the next real ID or contributes to time totals. Copy the [skill's template](../../.github/skills/vacate-issues/assets/issue-template.md) for new real issues. YAML frontmatter owns the ID, type, summary, status, dates, optional parent and `depends_on` list; keep the rendered heading, badge and backlog row consistent.

Use `media/VAC-<number>/` for issue-specific screenshots, attachments or supporting files when needed, with relative Markdown links and descriptive filenames. Link existing repository evidence instead of duplicating it. The example includes a [fictional UX note](media/VAC-0/favourite-view-notes.md). Never put credentials, employee records, medical proof or identifiable customer screenshots in this folder.

## Types

| Type | Use |
|---|---|
| ![Story](badges/story.svg) `story` | A user or stakeholder outcome with acceptance scenarios |
| ![Bug](badges/bug.svg) `bug` | Incorrect behaviour: include actual/expected results and reproduction steps |
| ![Epic](badges/epic.svg) `epic` | An outcome delivered through linked child issues; avoid duplicating their work logs |
| ![Task](badges/task.svg) `task` | Technical, research or operational work with a verifiable output |

Badges are local SVGs with icons and text; colour is supplementary. Every type shares the same issue structure, scaled to the work. Use the optional `parent` key and Markdown links for epic/child relationships. Numbered checkboxes within a story are subtasks; create separate issue files when work needs its own status, owner or discussion.

## Statuses

| Stored value | Display | Meaning / evidence needed |
|---|---|---|
| `specification` | 📝 Specification | Clarifying the outcome, scope, rules and acceptance scenarios |
| `todo` | 🟢 Open / ready for action | Scope is actionable; necessary product decisions are resolved or explicitly excluded |
| `in-progress` | 🔨 In progress | Work has started; record blockers in the issue |
| `qa` | 🔍 QA | Implementation is ready for verification and review |
| `done` | ✅ Done | Applicable acceptance checks and review passed; evidence is linked |
| `released` | 🚀 Released | Done and available at a named target/version, with deployment evidence |

The normal flow follows this table. A direct move is allowed when evidence already supports it, including retrospective issues. Reopening or moving backwards needs a reason in History. Record the actual release target: a dev mock release does not imply production readiness. Epics reach Done when their agreed child scope is verified; Released additionally needs release evidence for that scope.

## Issue content

Keep a summary, detailed description, scope, acceptance scenarios and relevant sources. Break work into UX, UI, backend, database, infrastructure, QA and other responsibilities where useful; mark unrelated areas **Not applicable** rather than inventing work. Include company-isolation scenarios for business data/permissions, or explain why a synthetic/documentation-only issue does not exercise them.

Maintain append-only **Comments**, **Decisions**, **History** and **Work log** sections. Use dates (and known times with timezone), author/role and evidence links. Corrections should identify the earlier entry; do not silently rewrite decisions. Mark reconstructed entries **Retrospective**, and never invent historic quotations, exact timestamps, durations or owners. Carry durable product/architecture decisions into their canonical documents and link them here. Keep unresolved questions explicit.

Work-log entries need a local entry ID, date/range, actor, activity, duration, measurement basis and evidence. Keep **human actual**, **assistant recorded**, **automation elapsed** and **estimate** totals separate. Unknown human time stays **Unknown**. Do not add nested subtotals, overlapping agent sessions or shared historical measurements twice; reference the issue owning a shared measurement. Log only evidence-supported time attributable to the issue. If timing was not captured, say so. Future work can use timestamped session entries, subject to these same limits.

The backlog is an index, not another specification. Keep one row per real issue with **ID, type, summary, status, dependencies and issue link**. Do not silently turn ideas from `docs/next-up.md` into approved work. Unselected UI alternatives and unresolved policy remain proposals even when an issue describing the mock is Released.

## Dependencies

Store direct implementation prerequisites as issue keys in YAML `depends_on`, using `[]` for none. Mirror them as linked keys in the backlog; retain completed prerequisites and label their status when helpful. Each issue's **Dependencies** section explains the output needed from a prerequisite. Avoid repeating transitive dependencies.

Distinguish prerequisites from related work, navigation integration and specification coordination. Related issues may be linked without adding them to `depends_on`; an epic parent is not automatically a prerequisite. Do not invent dependencies merely because two stories mention each other. Keep the graph free of self-links, missing/fictional keys and cycles; record an OPEN QUESTION if existing sources imply a cycle rather than silently changing the scope.

A satisfied dependency does not resolve the story's own product questions or change its status automatically. Before implementation, verify that the required output is available. Update issue metadata, dependency explanation and backlog together when a relationship changes.

## Working with agents

The [repository skill](../../.github/skills/vacate-issues/SKILL.md) describes the create/update/implement workflow. Root [AGENTS.md](../../AGENTS.md) explicitly tells repository agents to apply it. Skill-menu discovery depends on the client; use `$vacate-issues` when listed, or ask to apply the linked file explicitly.

Before finishing, check unique IDs, matching metadata/backlog values and dependencies, valid dependency targets/no cycles, relative links/media, evidence for the status, and time-log bases/totals. Report issues changed, decisions made, open questions and verification. Repository write/commit/push/deploy permissions continue to apply.
