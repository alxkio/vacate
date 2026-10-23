# Product backlog

All real Vacate issues, including completed releases. [Workflow, types and statuses](README.md). The fictional [VAC-0 example](<Example Story.md>) is excluded.

| ID | Type | Summary | Status | Dependencies | Issue |
|---|---|---|---|---|---|
| VAC-1 | ![Story](badges/story.svg) | Deliver the Azure-hosted Vacate foundation and interactive leave mock | 🚀 Released | None | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) |
| VAC-2 | ![Story](badges/story.svg) | Preview organization settings for a demo administrator | 📝 Specification | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-2](VAC-2-organization-settings-mock.md) |
| VAC-3 | ![Story](badges/story.svg) | Lead the administrator experience with organization and team overviews | 📝 Specification | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-3](VAC-3-admin-overview-first-experience.md) |
| VAC-4 | ![Story](badges/story.svg) | Preview an administrator-only leave approval inbox | 📝 Specification | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) (released) | [VAC-4](VAC-4-admin-approval-inbox-mock.md) |
| VAC-5 | ![Story](badges/story.svg) | Show common leave types first with an explicit show-all action | 🔍 QA | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) (released) | [VAC-5](VAC-5-common-leave-types-chooser.md) |
| VAC-6 | ![Story](badges/story.svg) | Model a fictional company with per-person demo logins and visibility scenarios | 🚀 Released | [VAC-1](VAC-1-cloud-foundation-and-leave-mock.md) (released) | [VAC-6](VAC-6-company-personas-and-visibility-fixtures.md) |

Dependencies list **direct implementation prerequisites**, matching each issue's `depends_on` metadata. Coordination links do not block implementation, and inherited prerequisites are not repeated. VAC-6 supplies the shared personas/account fixtures for VAC-2–VAC-4. VAC-5 uses founder-authorized provisional defaults while its questions remain open for revision; VAC-2–VAC-4 retain their own specification decisions.

**Next real key: VAC-7.** Confirm against all real issue files before allocation. VAC-2–VAC-6 were requested on 2026-10-23; the founder subsequently authorized VAC-6 implementation. Backlog order is not a priority commitment. Other notes in `docs/next-up.md` have not been converted into issues.
