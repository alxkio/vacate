---
name: user-journey-mapping
description: Map current or proposed user journeys across stages, touchpoints and handoffs; identify evidence gaps, pain points, risky assumptions and measurable validation experiments. Use for journey maps and end-to-end experience analysis, rather than visual polish or implementation alone.
---

# User journey mapping

Create an evidence-led map of how a person achieves a goal, including what happens before, between and after screens. Combine the journey with Lean UX assumptions, hypotheses and small learning experiments when improvements need validation.

## Establish the journey

- Identify the actor, goal, trigger, starting context, completion signal and boundaries. Include relevant devices, channels, access needs and other actors involved in handoffs.
- State whether the map describes the **current experience**, a **proposed experience**, or a comparison. Keep current facts and proposed changes visibly separate.
- Read the project's authoritative product decisions and relevant research, support evidence, routes, UI states and service behavior. Inspect the actual experience when available; code alone does not establish how users think or behave.
- Use an evidenced persona or a task-based actor description. Label an unsupported persona **ASSUMPTION**. Ask only for missing information that would materially change the map; otherwise state a bounded assumption and continue.
- Respect the requested deliverable: a findings-only request produces a report without editing files. Mapping does not authorize implementation, product decisions, participant contact, analytics installation or external publication.

## Map the experience

Organize the journey into meaningful stages at the detail needed for the task. Show actions in sequence, touchpoints, transitions and the result the user needs at each stage. Do not treat a screen inventory or click sequence as a complete journey.

Use a Markdown table as the default visual map:

| Stage and user goal | Actions and touchpoints | System response or handoff | Thoughts and feelings | Friction and impact | Evidence and uncertainty | Opportunity and success signal |
| ------------------- | ----------------------- | -------------------------- | --------------------- | ------------------- | ------------------------ | ------------------------------ |

Adapt columns or split wide maps into smaller tables for readability. Include timing or waiting periods where they affect the experience. Reference stage names consistently in later findings.

For each relevant stage:

- Include entry conditions, user choices and visible feedback; identify how the user knows the step completed.
- Trace important alternate paths: first-time versus returning use, missing information, loading, empty results, denied access, invalid input, interruptions, cancellation, retries and recovery. Cover those that affect this journey rather than filling every possible state.
- Describe role changes and handoffs explicitly: who acts next, what they receive, how progress is communicated and what happens if nobody acts.
- Check keyboard and assistive-technology access, mobile constraints, language and cognitive demands where relevant. Distinguish an inspected barrier from an untested risk.
- Keep private information within the authorized audience. A hidden control does not establish authorization; fictional fixtures do not establish production behavior.

Attach a source or observation to important claims. Use **ASSUMPTION** for untested interpretations, **UNVERIFIED** for behavior not checked, and **OPEN QUESTION** for unresolved decisions. A source proving a feature exists does not prove users find it usable.

Thoughts, feelings and emotional highs/lows must be grounded in research or clearly labelled as inferred hypotheses. Do not invent participant quotes, emotional scores or a measured emotional curve. When evidence is absent, name the research needed; an annotated qualitative sequence is sufficient.

## Prioritize pain points and assumptions

Separate observed friction from proposed opportunities. Rank the few issues that most threaten task completion, trust, accessibility or recovery. Explain impact, evidence strength and any known frequency; do not invent frequency or numerical risk scores.

For uncertain improvements, identify the relevant assumption:

- **User:** the need, motivation, ability or behavior being assumed.
- **Business:** the value or operational outcome expected.
- **Solution:** why a proposed feature or interaction should improve that outcome.

Prioritize high-impact assumptions with weak evidence. Distinguish a small reversible improvement from a longer-term change requiring a product decision.

## Define learning and success

Turn the riskiest assumptions into hypotheses when useful:

> We believe that [change] for [actor in this context] will improve [user or business outcome]. We will evaluate this through [behavioral measure or qualitative signal] during [test window or task].

For each hypothesis, specify the smallest useful experiment, who or what it samples, the observation method and the decision its result would inform. Paper prototypes, task walkthroughs, supervised usability sessions or concierge trials may be sufficient; a new feature is not automatically the smallest experiment.

Define success using task completion, time, errors, recovery, abandonment, support demand or observed comprehension as appropriate. State the baseline, target, observation window and measurement source when known. Label proposed thresholds **PROPOSED**; mark missing values as unknown instead of inventing precision. Include evidence that would weaken the hypothesis, not just confirm it.

Keep experiments proportionate to the evidence gap. Do not propose deceptive controls or pretend transactions in a live operational journey. Research prototypes must make their limits clear and minimize personal data.

## Deliver and check

Provide the journey scope and evidence baseline, the map, prioritized pain points, and any hypotheses/experiments needed to resolve uncertainty. End with open decisions and what was or was not verified. Recommendations remain **PROPOSED** until accepted.

Before delivery, check that the map reaches a clear outcome, includes material recovery and handoffs, separates current/proposed behavior, traces important claims to sources, and does not present inferred emotions or suggested metrics as research findings. Scale the output to the question; do not force experiments or an emotional curve when they add no useful information.
