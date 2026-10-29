# Product backlog

All real Vacate issues, including completed releases. [Workflow, types and statuses](README.md). The fictional [VAC-0 example](<Example Story.md>) is excluded.

| ID | Type | Summary | Status | Dependencies | Issue |
|---|---|---|---|---|---|
| VAC-1 | ![Story](badges/story.svg) | Deliver the Azure-hosted Vacate foundation and interactive leave mock | 🚀 Released | None | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) |
| VAC-2 | ![Story](badges/story.svg) | Preview organization settings for a demo administrator | 🔍 QA | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-2](VAC-2-organization-settings-mock.md) |
| VAC-3 | ![Story](badges/story.svg) | Lead the administrator experience with organization and team overviews | 📝 Specification | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-3](VAC-3-admin-overview-first-experience.md) |
| VAC-4 | ![Story](badges/story.svg) | Preview an administrator-only leave approval inbox | 📝 Specification | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-4](VAC-4-admin-approval-inbox-mock.md) |
| VAC-5 | ![Story](badges/story.svg) | Show common leave types first with an explicit show-all action | 🔍 QA | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) (released) | [VAC-5](VAC-5-common-leave-types-chooser.md) |
| VAC-6 | ![Story](badges/story.svg) | Model a fictional company with per-person demo logins and visibility scenarios | 🚀 Released | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) (released) | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) |
| VAC-7 | ![Task](badges/task.svg) | Temporarily skip backend work in UI deployments | 🔍 QA | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) (released) | [VAC-7](VAC-7-optional-backend-deployment.md) |
| VAC-8 | ![Story](badges/story.svg) | Put the calendar first with an annual side card and a separate balances page | 🚀 Released | [VAC-5](VAC-5-common-leave-types-chooser.md) | [VAC-8](VAC-8-calendar-first-and-balances-page.md) |
| VAC-9 | ![Story](badges/story.svg) | Model backend-owned leave eligibility with private mock decisions and a review matrix | 🚀 Released | [VAC-5](VAC-5-common-leave-types-chooser.md), [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-9](VAC-9-eligibility-contract-and-mock-decisions.md) |
| VAC-10 | ![Task](badges/task.svg) | Consolidate the deployed mock into Angular under frontend | 🚀 Released | [VAC-8](VAC-8-calendar-first-and-balances-page.md) (released), [VAC-9](VAC-9-eligibility-contract-and-mock-decisions.md) (released) | [VAC-10](VAC-10-consolidate-angular-frontend.md) |
| VAC-11 | ![Task](badges/task.svg) | Draft the user object and JSON Schema for product review | 📝 Specification | None | [VAC-11](VAC-11-draft-user-schema.md) |
| VAC-12 | ![Story](badges/story.svg) | View membership and edit own profile from settings | 🔍 QA | [VAC-11](VAC-11-draft-user-schema.md), [VAC-10](VAC-10-consolidate-angular-frontend.md) (released) | [VAC-12](VAC-12-profile-and-membership-settings.md) |
| VAC-13 | ![Story](badges/story.svg) | Support profiles, memberships and organizations through application services and API | 🔍 QA | [VAC-12](VAC-12-profile-and-membership-settings.md), [VAC-2](VAC-2-organization-settings-mock.md) | [VAC-13](VAC-13-api-backed-settings.md) |
| VAC-14 | ![Bug](badges/bug.svg) | Fix local Azure Functions startup with supported Core Tools | ✅ Done | None | [VAC-14](VAC-14-fix-functions-core-tools-startup.md) |
| VAC-15 | ![Bug](badges/bug.svg) | Stabilize trusted keyboard browser acceptance after closing a dialog | 🔍 QA | None | [VAC-15](VAC-15-stabilize-keyboard-browser-acceptance.md) |
| VAC-16 | ![Task](badges/task.svg) | Expose each API path and HTTP method as a separate Azure Function | 🔍 QA | None | [VAC-16](VAC-16-explicit-functions-routes-and-openapi.md) |
| VAC-17 | ![Bug](badges/bug.svg) | Resolve the Azure Functions runtime mismatch blocking deployed API health | 🔍 QA | None | [VAC-17](VAC-17-resolve-azure-functions-runtime-mismatch.md) |
| VAC-19 | ![Story](badges/story.svg) | Consolidate calendar preferences and balance ordering | 🔍 QA | None | [VAC-19](VAC-19-calendar-display-preferences-and-balances.md) |

Dependencies list **direct implementation prerequisites**, matching each issue's `depends_on` metadata. Coordination links do not block implementation, and inherited prerequisites are not repeated. VAC-6 supplies the shared personas/account fixtures for VAC-2–VAC-4. VAC-5 uses founder-authorized provisional defaults while its questions remain open for revision; VAC-2 implements the bounded admin settings iteration; VAC-3/VAC-4 retain separate specification decisions.

**Next real key: VAC-20.** VAC-18 was allocated historically for dev-only demo sign-in, then withdrawn from the current working tree; its identifier remains reserved. VAC-19 records the founder's 2026-10-28 calendar and balance direction. VAC-2–VAC-6 were requested on 2026-10-23; the founder subsequently authorized VAC-6 and VAC-5 implementation. VAC-7 records the requested temporary frontend-only deployment path. VAC-8/VAC-9 implement the 2026-10-24 calendar-first feedback and eligibility schema/mock boundary; no blanket demographic policy is approved. VAC-11 records the founder-requested user schema draft on 2026-10-26; proposed fields and permissions await review. Backlog order is not a priority commitment. Other notes in `docs/next-up.md` have not been converted into issues.
