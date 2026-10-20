# Product charter

**Status:** Confirmed intent plus proposed pilot scope
**Owner:** Product lead / founder  
**Last updated:** 2026-10-20

## Confirmed intent

Source: founder instruction in the repository review, 2026-10-20.

- Vacate manages employee absence.
- The founder's company is the first intended user.
- The intention is to sell Vacate as a subscription product as well, supporting many customer companies.
- Accounts and personnel are managed manually initially. Optional customer directory/Entra integration may follow; customers do not need a Microsoft tenant.
- Company email is the username and must be unique across Vacate; creating another account with the same username is rejected. Shared accounts, company switching and multi-company owner/employee membership are deferred.
- Delivery direction: Angular web app and a .NET 10 backend API.
- SQL Server / Azure SQL is preferred but tentative; inexpensive Azure hosting is the starting goal.

This replaces the earlier assumption that a Greek market launch must precede company use. It does not establish the company's jurisdiction or approve a commercial launch geography.

## Proposed first outcome

An administrator configures employees, leave types, opening allocations and a working calendar. An employee requests leave, an assigned approver decides, balances remain correct, and authorised colleagues can see availability.

**ASSUMPTION:** A small internal pilot can use a single company, simple teams and one approval step. Confirm against the actual company process before implementation.

## Product boundaries

Keep the first release focused on absence requests, balances, approvals and availability. Defer native apps, resource booking, payroll, statutory country packs, complex organisation hierarchies and integrations until a specific need is confirmed.

Supporting many customer companies requires company data isolation in the design and verification from the start. A customer company is not a Microsoft Entra tenant. It does not require automated payments, public signup or pricing tiers for the company pilot.

Do not ship country-specific legal defaults from the reference documents. Policy configuration and historical calculations must remain explainable and attributable.

## OPEN QUESTION — company workflow before build

1. How many employees, teams and legal employers are in the pilot, and in which jurisdiction(s)?
2. Are full days sufficient, or are half days, hourly leave, part-time schedules or shifts necessary?
3. Who approves whose requests, including managers' own requests and approver absence?
4. Which leave types, allocations, holiday calendars, carryover and cancellation rules does the company currently use?
5. Who creates accounts and personnel, and how are login access, recovery and email changes handled? Manual setup and unique company-email usernames are confirmed; directory integration and multi-company membership are deferred.

## OPEN QUESTION — before selling

- First customer segment, geography, pricing and subscription terms.
- Commercial billing process and any later self-service onboarding. Initial account/personnel setup is manual.
- Privacy ownership, retention, customer agreements and recovery/availability requirements.

Evidence from the company pilot validates that company's workflow; it does not establish wider demand or willingness to pay.
