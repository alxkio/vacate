# Mock login and branding review — 2026-10-22

Base: `11c8486`. Scope: pending demo login, root-calendar packaging, favicon, leave-rule research and balance-design proposal. No blocking findings remain within this mock-only scope.

## Changes reviewed

- `docs/design/calendar-mock/dist/`: exact `user/user` and `admin/admin` demo credentials, tab-scoped username only, sign-out, root index and matching SVG favicon. Both roles retain the same fictional company; no production permissions are implied.
- `scripts/package-design-preview.py`, CI and Static Web Apps configuration: package the mock as `index.html`, retain Angular as `app.html`, redirect old preview links and include all demo assets/revision metadata.
- `scripts/cloud-smoke.py`: check the new entry pages, root assets, favicon and revision while retaining API/CORS and Angular deep-link checks.
- `docs/product/leave-types-review.md`, `docs/compliance/policy-sources.md` and `docs/design/leave-balances-proposal.md`: sources, allowances, service milestones and expandable balance design. Type fixtures, request choices and statutory calculations remain unchanged pending product review.

## Findings corrected

The browser harness could observe a previous document during reload/navigation, making checks unreliable. It now waits for a new document before checking its contents. Chrome startup occurred outside the cleanup block; startup failures now reach browser/server/profile cleanup.

## Verification

Passed: anonymous redirect, invalid credentials, both logins, index landing, logout and session reload; twelve scope/view combinations; shared-detail privacy; dialogs and focus; request preview; thirteen mobile overflow checks; eight screenshot captures. Also passed root/fallback packaging, Angular entry preservation, favicon XML/references, documentation links, workflow YAML parsing, JavaScript/Python syntax and `git diff --check`.

Full Angular production build/tests need hosted CI because of the known local OS constraint. This commit is not pushed/deployed, so its Azure routing and cloud smoke checks remain pending. No API data endpoints changed. Real authentication and tenant-isolation tests remain required before introducing employee data; mock browser checks cannot establish those boundaries.

Open decisions: expanded legal-rule review, company applicability, balance details and UI direction. The favicon choice is confirmed. No product policy is accepted by this code review.
