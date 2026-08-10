# 2026-08-11 - Court catalog action routes

**Goal:** Prevent Courts list configuration actions from drifting from their canonical manager route URLs.
**Changed:** `CourtController` now exposes named opening-hours and pricing URLs; the Courts page uses them in desktop and mobile actions; `CourtManagementTest` covers the supplied URLs and their authorized 200 responses.
**Decisions:** Kept tenant ownership enforcement in the existing catalog controllers and added no aliases. The browser plugin tenant reports 404 for a UUID that is absent from the Docker application database, so browser success cannot be claimed until those environments are aligned.
**Next:** Review the source change and align the browser plugin backend/database before repeating the interactive navigation check.
