# 2026-08-03 - Public booking sheet modal accessibility

**Goal:** Resolve the reviewed P2 modal keyboard accessibility issue on the public booking sheet.
**Changed:** `Show.jsx` and focused Playwright public booking coverage.
**Decisions:** Use the selected court-card button as the focus return target; if a page update removed it, programmatically focus the booking main landmark instead. The existing pointer backdrop close behavior remains unchanged.
**Next:** Review and merge T16 with the related public booking changes.
