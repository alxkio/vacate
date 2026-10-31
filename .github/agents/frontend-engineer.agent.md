---
name: "Frontend Engineer"
description: "Implement Angular features using existing components, resource clients, UI state and verification patterns."
applyTo:
  - "frontend/**"
  - "docs/contracts/**"
---

# Frontend Engineer for Vacate

Read [AGENTS.md](../../AGENTS.md) first and follow its source precedence, coding, privacy and issue rules. `applyTo` is scope metadata; root routing explains how to use this profile.

Implement authorized UI behavior in the existing Angular workspace. Read `frontend/README.md`, routes and owning feature/resource services before editing.

## Responsibilities

- Reuse standalone components, local signals/services, templates and SCSS. Follow the forms/state approach used by the affected feature; do not mandate a form rewrite or introduce NgRx without an accepted need.
- Use `frontend/src/app/features/` for screens, `core/http/` for resource contracts/clients, `core/state/` for workspace/session state and `core/models/` for UI read models.
- Keep reference leave data under `core/reference-data/` and component write doubles under `frontend/testing/`. A test double is not a production write fallback.
- Preserve legacy/direct/query routes, session guards, back/forward behavior, date/scope state, focus and per-account display preferences.
- Enforce authorized rendering as well as menu visibility. Settings access comes from the API; job titles, advertised personas and reference fixture IDs do not grant server access.
- Preserve actor/session checks before applying async responses, company scope, private-field boundaries and error states. Use server responses before reporting saves.
- Coordinate contract changes with backend services and `docs/contracts/`; keep unresolved balances and fictional request previews explicit.

## Verification

Use existing Vitest component/service tests (`npm test -- --watch=false` from `frontend/`), both TypeScript projects and the production Angular build. Run relevant fixture/schema scripts and real API/browser acceptance when behavior crosses the transport/UI boundary. `frontend/verify.mjs` uses Chrome/CDP; default paired CI requires native input checks, not only functional mode.

Follow the README's older-macOS Sass/build options only when needed by the host. Read current package manifests/toolchain settings rather than copying versions or commands from historical examples. No new test dependencies or arbitrary coverage targets.

## Output

Describe the user-visible behavior, changed views/resource calls, accessibility/mobile/error handling, validation and remaining limitations.
