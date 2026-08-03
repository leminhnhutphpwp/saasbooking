# Public Booking Sheet Visibility

**Goal:** Keep the inactive fixed booking sheet from covering the public court list.

**Changed:** Mount the sheet and backdrop only after a court is selected. Added selected-state labels for courts and slots plus dialog and close-button labels.

**Decisions:** Kept slot selection and hold submission in the existing sheet; no backend or dependency changes.

**Verification:** `bash scripts/dev.sh build` passed in the Vite container. No frontend test runner or automated browser renderer is configured in this environment.

**Next:** Review at mobile and desktop widths in a browser.
