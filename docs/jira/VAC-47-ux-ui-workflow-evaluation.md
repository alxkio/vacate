---
id: VAC-47
type: task
summary: Evaluate UX/UI prompts and skills for administrator journeys
status: done
created: 2026-11-12
updated: 2026-11-12
parent: VAC-43
depends_on: []
---

# VAC-47 — Evaluate UX/UI prompts and skills for administrator journeys

![Task](badges/task.svg) **✅ Done** · Owner: Delegated implementation roles

## Description

Evaluate and apply Product Designer prompts and installed skills to the multi-page administrator journeys, with optional Figma only where it contributes a concrete artifact. The owner asked for UX/UI agent prompt and skills, perhaps Figma, rather than mandating a new design tool or dependency.

## Scope

Document useful reusable workflow guidance and decisions from the actual settings, closure, approval and personnel journeys. Use installed Impeccable and user-journey-mapping where relevant; source role/profile authority remains AGENTS.md. Evaluate existing guidance before changing it. Figma is optional; do not create unrequested external files, import new tooling or change automatic discovery assumptions merely to satisfy a tool checklist.

## Dependencies

None. Existing administration, directory and configuration APIs are the implementation baseline.

Coordination only: VAC-42 UI feedback; VAC-20 Settings/People/balance summaries; VAC-40 national holiday data; siblings in VAC-43. Epic membership is not an implementation dependency.

## Acceptance scenarios

- [x] Given the current role and installed skills, when assessing administrator tasks, then guidance identifies critique, copy clarification, responsive adaptation, technical audit and final polish with applicable inputs/outputs.
- [x] Given multi-page tasks, when journey mapping, then actor, entry, decisions, failure/recovery and completion are tied to implemented capabilities and open product decisions.
- [x] Given optional Figma, when evaluating its value, then the result records use or reason to defer without making Figma a gate for code review.
- [x] Given any proposed profile/skill modification, when implementing it, then context guidance and source precedence are respected and actual discovery support is not overstated.
- [x] Technical and rendered evidence is distinguished from design/source conclusions. No real employee data enters design artifacts.

## Subtasks and responsibilities

Product Designer owns evaluation and journey evidence; Product Owner checks scope. Frontend/backend/database changes are not required merely to evaluate guidance. Any actual guidance edit follows context rules.

## Attachments and sources

- [Administrator journeys, handoff and reusable UX/UI review prompt](../design/admin-functionality-handoff.md).

- [Product charter — administrator epic](../product/product-charter.md#owner-decisions--administrator-functionality--2026-11-12).
- [ADR-0003](../adr/0003-domain-and-application-services.md), [ADR-0004](../adr/0004-relational-persistence.md), [ADR-0005](../adr/0005-frontend-capability-architecture.md).
- [Epic VAC-43](VAC-43-admin-functionality.md); [issue workflow](README.md).

## Comments

- C1 · 2026-11-12 · Assistant / Product Owner: Owner requested delegated implementation of the six-area administrator epic. Policy-dependent operations remain explicitly bounded by unresolved decisions; independent work continues.

- C2 · 2026-11-12 · Assistant / Product Designer: Read current role, Impeccable 4.8.2 workflows, journey-mapping and context guidance; inspected incumbent settings source and VAC-42 desktop evidence. Delivered a reusable manual prompt and state/journey handoff in the linked design artifact. This is not a claim that a full critique/audit command or new rendered verification ran.

## Decisions

- D1 · 2026-11-12 · Owner: automatic closure leave; recurring holidays apply to the whole company initially; approval inbox uses assigned approvers. Canonical source: linked product charter. No commit, push or deployment is authorized for this work.

- D2 · 2026-11-12 · Assistant / Product Designer: Existing profile already links installed skills. Keep this feature guidance in docs/design without modifying discovery, role profiles or global tools. Optional Figma not selected: existing app/source/browser evidence meets the review need without a second external artifact.

## Work log

- W1 · 2026-11-12 · Assistant recorded: issue/specification and delegated implementation coordination; duration unmeasured. Human actual: Unknown. No child/parallel time roll-up.

- W2 · 2026-11-12 · Assistant recorded / Product Designer: source and incumbent screenshot review, workflow evaluation, journey handoff, reusable prompt and relative-link validation; duration unmeasured. Human actual: Unknown. No parallel time roll-up.

## History

- H1 · 2026-11-12 · Assistant / Product Owner: Created In progress after owner explicitly requested delegated implementation. Open decisions constrain specific mutations and are not evidence of completed functionality.

- H2 · 2026-11-12 · Assistant / Product Designer: In progress → Done for the bounded guidance evaluation. All criteria supported by the linked artifact; feature runtime verification remains in sibling issues.

## Verification and release

Read root/role/context instructions, installed Impeccable and relevant references, journey-mapping, current feature sources and the existing VAC-42 desktop settings capture. Relative Markdown links in the delivered artifact resolve. Guidance includes all five requested workflows, multi-page journeys, explicit evidence limits, Figma rationale, and no discovery modification. No application behavior or API schema changed by this task; tenant-isolation execution is not applicable to the documentation-only change. New feature rendered checks, SQL-provider evidence and deployment are not claimed. No commit, push or deployment.

## Open questions and follow-up

Whether Figma adds value is an implementation evaluation, not a product blocker. Profile/skill changes, if justified, follow the repository context rules; no new global tool permission is granted.
