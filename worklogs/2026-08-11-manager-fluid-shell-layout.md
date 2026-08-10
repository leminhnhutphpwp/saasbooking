# 2026-08-11 - Manager fluid shell layout

**Goal:** Remove the widescreen Manager gutters while preserving the floating shell and responsive gutters.

**Changed:** `ManagerLayout` overrides the legacy 1440px shell cap; `PageContainer` is fluid by default while `narrow` remains capped; Calendar no longer restores a 2xl cap.

**Decisions:** Public and marketing layouts remain unchanged. `app.css` is owned by active T54, so the user-authorized override lives in the shared Manager layout. `BOARD.md` remains reserved by active T55 and was not edited.

**Next:** Review T56 and coordinate its Board entry after T55 releases `tasks/BOARD.md`.
