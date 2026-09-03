# Product charter

**Status:** PROPOSED  
**Owner:** Product lead / founder  
**Last updated:** 2026-09-03

## Problem

Employees and managers need a trustworthy, low-friction way to understand leave entitlement, request time off, approve it, and see appropriate team availability. Spreadsheet and email processes become unreliable as companies add people, teams, and approval rules.

## Proposed product

Vacate is an absence-management SaaS that provides leave requests, balances, approvals, and permission-aware availability for organisations that have outgrown spreadsheets but do not want a full HRIS.

## Proposed initial wedge

**ASSUMPTION:** Role-scoped visibility and approval flows for organisations with more structure than a flat team, integrated with Microsoft Teams and calendars.

This is a hypothesis, not a proven differentiator. It must be tested with prospective customers.

## Customer and market

| Decision | Current draft | Status / clarification needed |
|---|---|---|
| First geography | Greece | **OPEN QUESTION:** confirm Greece is the paid launch market, not merely founder preference. |
| Next geographies | Nordics, then DE/FR/NL, then UK/Spain | **OPEN QUESTION:** choose based on legal-policy and distribution evidence; do not pre-commit all waves. |
| Initial company size | 25–150 employees suggested | **OPEN QUESTION:** existing documents alternatively state 20–300 and 20–1,500. |
| Economic buyer | HR/office manager or operations lead | **ASSUMPTION:** validate who controls budget in Greece. |
| Daily users | Employees, managers, HR/admin | PROPOSED |
| Product category | Focused absence management, not HRIS | PROPOSED |

## MVP outcome

An organisation can configure its people, work structure, leave types, and approval policy; an employee can submit a valid request; the right approver can decide; affected users can see appropriately scoped availability; and the decision is auditable.

## Non-goals for MVP

- Equipment, rooms, vehicles, holiday homes, or generic resource booking.
- Native iOS and Android applications.
- Payroll calculation or payroll-system integrations beyond documented event/webhook capability.
- Full statutory entitlement calculation across multiple countries without reviewed policy packs.
- Consultancy/coworking and cross-organisation managed-team workflows.

## Product principles

1. Explain leave calculations and decisions to employees.
2. Collect the minimum employee data needed for the workflow.
3. Make permissions explicit: role alone never grants broad employee-data access.
4. Keep legal defaults versioned, sourced, and configurable.
5. Prefer a complete core leave journey over breadth of HR features.

## Open questions to resolve before build

1. What single customer segment in Greece will be recruited as design partners?
2. Is Microsoft Teams integration a purchasing requirement, activation aid, or later convenience?
3. Does the buyer need legal-entitlement calculation, or only a configurable leave policy with transparent balances?
4. Is the product self-serve, sales-assisted, or sold through HR/payroll partners?
5. What concrete privacy need makes role-scoped visibility a switching trigger?

