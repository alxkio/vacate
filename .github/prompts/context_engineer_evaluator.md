# Repository context review prompt

Manual review prompt: use only when asked to audit AI context. Read root [AGENTS.md](../../AGENTS.md) and the [context guide](../../docs/ai-context.md) first. This prompt does not override accepted ADRs/product decisions or authorize application changes, agent spawning, external messages or installation.

## Inspect before assuming

Inventory the actual root/nested AGENTS files, `.github/agents/` profiles, `.github/skills/`, manual prompts, workflow/configuration files and linked product/architecture sources. Inspect ignored/private machine configuration only when needed and authorized; never print credentials or personal data.

Do not assume APM, `.apm` packages, Claude transforms, shared installs, memories or MCP servers exist. Record **not found in the inspected repository** when absent, and distinguish that finding from a claim about user-global configuration.

## Review

- Verify the current client's documented discovery/precedence rules; YAML `applyTo` in a profile is not a Codex agent loader. This repository uses root instructions and explicit Markdown role reading, without native custom-agent configuration.
- Check that root routing globs, role scope metadata and canonical Markdown role instructions agree. Look for unsupported fields, hidden instructions inside YAML, empty profiles, broken links and nonexistent paths.
- Compare active context with the actual API layers, Angular features/resources/state, test frameworks, infrastructure and workflow inputs. Use accepted ADRs first; scaffolds and historical proposals do not prove runtime functionality.
- Identify contradictory scope/security instructions, duplicated guidance, stale examples, assumed tools and claims of implemented approval/policy/compliance behavior without evidence.
- Separate durable rules from dated verification/session facts. Keep authoritative product decisions and issue status in their existing documents rather than copying a backlog into prompts.

## Output and verification

Lead with actionable findings ordered by impact, with paths/lines and observed evidence. Distinguish **fixed**, **remaining**, **ASSUMPTION** and **UNVERIFIED**. Include a compact artifact/discovery map and concrete checks run. Do not invent numerical quality scores or a complex context-management platform for a small repository.

Make authorized, reversible context fixes and validate Markdown frontmatter, referenced paths/globs and issue/backlog links. Explicitly state when runtime client loading has not been tested. Application builds/tests are needed only if application behavior or build inputs change. Keep secrets and real employee data out of review evidence.
