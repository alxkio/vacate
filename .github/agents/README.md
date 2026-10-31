# Vacate role profiles

These are the canonical Markdown role instructions. Follow [root AGENTS.md](../../AGENTS.md) for shared rules, source precedence and the path/glob routing table. The [AI context guide](../../docs/ai-context.md) explains how this Markdown-only setup works.

Each profile uses the enterprise-architect reference layout: YAML `name`, `description`, `applyTo`, then a closed header and a normal Markdown body. Do not put the body inside `instructions: |`, indent headings, add `mode: extended`, or assume `applyTo` activates a Codex agent. Scope metadata must match the root routing table and real repository paths.

- [Enterprise Architect](enterprise-architect.agent.md)
- [Software Engineer](software-engineer.agent.md)
- [Frontend Engineer](frontend-engineer.agent.md)
- [UI Architect](ui-architect.agent.md)
- [QA Engineer](qa-engineer.agent.md)
- [Product Owner](product-owner.agent.md)
- [Branding Specialist](branding-specialist.agent.md)

Codex reads root instructions and is directed to open the matching profiles. You can also ask explicitly, for example: “Use `.github/agents/enterprise-architect.agent.md` to review this API change.” These are task instructions, not separately registered native custom agents. There is no required TOML configuration, provider/model pinning or automatic delegation. Role guidance grants no permission beyond the current task.
