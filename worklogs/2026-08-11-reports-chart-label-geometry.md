# 2026-08-11 - Reports chart label geometry

**Goal:** Correct clipped and overlapping revenue chart labels at desktop and mobile widths.
**Changed:** `apps/app/resources/js/Pages/Manager/Reports/Index.jsx` and T55 task tracking.
**Decisions:** Size the SVG coordinate system from its observed container width so text retains readable CSS-pixel sizing on mobile; retain a compact, peak-inclusive sample for capsule bars.
**Next:** T55 is ready for review; build and the relevant manager authorization feature test pass, with Chrome screenshots at 1440px and 390px recorded in the task.
