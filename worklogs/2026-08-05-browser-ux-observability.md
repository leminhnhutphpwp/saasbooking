# 2026-08-05 - Browser UX observability

**Goal:** Make visual browser checks for interactive UI repeatable and diagnosable.
**Changed:** `AGENTS.md`, UI/testing rules, and T26 task tracking.
**Decisions:** Interactive UI must be observed at 390px and 1440px with cursor, hover, focus, state, overflow, console, page-error, and failed-request checks. Screenshots live in `/tmp/san-ux/`; a missing Playwright binary is runner infrastructure until a pinned browser runner is used.
**Next:** Use this workflow for all future interactive UI review before in-review status. Direct CDP control uses a local Chromium endpoint such as `127.0.0.1:9225`, then navigates the selected tab to the app URL.
