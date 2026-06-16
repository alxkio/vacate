You are an expert in:
- context engineering
- AI-native software delivery
- agentic SDLC
- APM (Agent Package Manager)
- multi-agent architecture
- instruction system design
- prompt governance
- repository-scale agent orchestration

Your task is to perform a comprehensive Context Engineering Audit of this repository.

This repository uses:
- APM
- local `.apm` packages
- shared and target-specific agent installs
- Claude/Copilot-specific transforms
- reusable instructions, skills, prompts, workflows, and memories

You must evaluate the repository using principles from:
- Agentic SDLC
- PROSE-style instruction systems
- context engineering best practices
- bounded context design
- composable instruction architecture
- context governance and integrity

Treat the repository as a production-grade agent operating system, not merely a collection of prompts.

---

# PRIMARY OBJECTIVE

Determine whether the repository’s context system is:

- maintainable
- composable
- scalable
- governable
- deduplicated
- target-safe
- token-efficient
- operationally reliable

You are NOT reviewing code quality.

You ARE reviewing:
- context architecture
- instruction architecture
- agent structure
- context lifecycle
- prompt governance
- agent interoperability
- context delivery patterns
- target isolation
- instruction inheritance
- operational maintainability

---

# 1. CONTEXT INVENTORY

Scan and classify all context artifacts including:

- system prompts
- instructions
- skills
- memories
- workflows
- agents
- templates
- MCP/tool definitions
- conventions
- target overrides
- install transforms
- generated artifacts
- runtime-injected context
- static context
- session context
- persistent context

For each artifact identify:
- ownership
- purpose
- scope
- lifecycle
- inheritance chain
- consumers
- duplication risk

Produce a Context Topology Map.

---

# 2. CONTEXT FLOW ANALYSIS

Explain how context flows through the system.

Identify:
- root context
- shared/global context
- target-specific context
- runtime-injected context
- generated context
- transient/session context
- memory persistence
- installation-time expansion

Evaluate:
- instruction precedence
- inheritance clarity
- context boundaries
- dependency direction
- coupling
- isolation guarantees

Identify hidden context dependencies.

Detect cases where:
- agents rely on undocumented assumptions
- behavior depends on file ordering
- context is implicitly inherited
- target installs accidentally diverge

---

# 3. DUPLICATE CONTEXT DETECTION

Identify duplicated or overlapping context including:

- repeated instructions
- repeated behavioral constraints
- duplicated formatting rules
- duplicated role definitions
- repeated safety guidance
- repeated coding standards
- repeated workflow steps
- repeated target-specific instructions
- semantically equivalent prompts
- partially diverged copies

For every duplication:
- show involved files
- classify duplication type
- estimate maintenance risk
- estimate divergence risk
- identify source-of-truth candidates

Differentiate:
- intentional duplication
- accidental duplication
- dangerous divergence

Flag:
- copy-paste inheritance
- near-duplicate prompt drift
- duplicated prompt prefixes
- repeated token-heavy context

---

# 4. STRUCTURAL QUALITY REVIEW

Evaluate the repository for:

## Architecture Quality
- bounded contexts
- modularity
- separation of concerns
- composability
- discoverability
- ownership clarity
- instruction layering
- deterministic structure
- explicit dependency management

## Context Engineering Quality
- token efficiency
- stable context prefixes
- reusable instruction composition
- context compression opportunities
- context pollution
- context dilution
- prompt entropy
- instruction conflicts
- instruction ambiguity
- instruction ordering issues

## Agentic SDLC Quality
- governance readiness
- context integrity
- operational scalability
- onboarding quality
- reproducibility
- target portability
- auditability
- maintainability

## Failure Modes
Detect:
- tool sprawl
- instruction sprawl
- context collapse
- context fragmentation
- hidden coupling
- circular dependencies
- target leakage
- uncontrolled inheritance
- duplicated conventions
- conflicting authority
- implicit behavioral contracts

---

# 5. STATIC VS DYNAMIC CONTEXT ANALYSIS

Determine what context should be:

## Static
- durable conventions
- architecture standards
- coding standards
- stable policies

## Dynamic
- runtime state
- task-specific plans
- temporary constraints
- session learnings
- retrieved documentation

## Generated
- summaries
- installation outputs
- derived target configs

Flag cases where:
- dynamic context is hardcoded statically
- static context is duplicated dynamically
- runtime context should be generated instead of embedded
- installation-time expansion creates unnecessary duplication

Identify opportunities for:
- retrieval
- runtime composition
- prompt assembly
- context compression
- reusable prompt primitives

---

# 6. TARGET ISOLATION REVIEW

Review how Claude/Copilot-specific configurations are handled.

Evaluate:
- separation quality
- portability
- leakage
- duplicated target logic
- abstraction quality
- provider-specific assumptions

Identify:
- what should remain shared
- what should become target-specific
- what should become provider adapters
- what should become install-time transforms

---

# 7. CONTEXT GOVERNANCE & SECURITY

Review context governance and integrity.

Identify risks involving:
- prompt injection via repository files
- unsafe imported instructions
- uncontrolled external skills/packages
- hidden behavioral overrides
- instruction shadowing
- untrusted generated context
- undocumented authority sources

Determine:
- authoritative instruction sources
- trust boundaries
- context supply chain risks
- governance gaps

---

# 8. SCORECARD

Score the repository from 1-10 for:

- maintainability
- composability
- modularity
- token efficiency
- context clarity
- governance
- scalability
- onboarding quality
- target portability
- deduplication
- context isolation
- instruction consistency
- operational readiness

Explain every score.

---

# 9. REFACTORING PLAN

Produce:

## A. Executive Summary
High-level assessment.

## B. Critical Risks
Most dangerous issues first.

## C. Quick Wins
High-impact low-effort improvements.

## D. Structural Refactor Recommendations
Folder structure
ownership boundaries
shared context extraction
modularization

## E. Target Architecture
Recommended future-state architecture.

## F. Context Deduplication Plan
Source-of-truth strategy.

## G. Migration Strategy
Incremental phased rollout plan.

## H. Context Flow Diagram
Textual explanation of inheritance/composition.

---

# 10. IMPORTANT REVIEW PRINCIPLES

Optimize for:
- long-term maintainability
- deterministic behavior
- composable instructions
- minimal duplication
- bounded context design
- explicit ownership
- token efficiency
- scalable agent operations
- multi-target compatibility

Prefer:
- composition over copy-paste
- stable shared prefixes
- explicit layering
- generated context over duplicated static context
- runtime retrieval over prompt bloat

Avoid:
- rewriting the entire repository
- theoretical advice disconnected from implementation
- generic prompt-engineering advice
- recommending monolithic system prompts

Be highly opinionated.

Treat this as a professional architecture and governance review for a production AI-native engineering system.
