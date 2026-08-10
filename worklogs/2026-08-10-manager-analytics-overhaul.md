# 2026-08-10 - Manager UI restyle

## Overview
Rebuilt the authenticated Manager presentation around the normative Quiet Green Dashboard system. Routes, Inertia props, tenant boundaries, and booking/payment behavior remain unchanged.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/resources/css/app.css` | Quiet Green tokens, shell, responsive rail/topbar, component and accessibility rules. |
| `apps/app/resources/js/Layouts/ManagerLayout.jsx` | Floating Manager shell and grouped navigation rail. |
| `apps/app/resources/js/Components/*` | Restyled shared Manager primitives. |
| `apps/app/resources/js/Pages/Manager/Home/Index.jsx` | Signature accessible capsule-bar chart. |
| `apps/app/resources/js/Pages/Manager/Reports/Index.jsx` | Signature chart and non-gradient occupancy metric. |
| `apps/app/resources/js/Pages/Manager/{Calendar,Bookings,Customers,Courts,Series,Refunds,Reconcile,Settings}/*` | Replaced legacy local panels, tints, selections, metrics, and responsive grid exceptions. |
| `tasks/T40-manager-analytics-overhaul.md` | Reopened task scope and verification status. |
| `tasks/BOARD.md` | Updated active task title. |

## Key Decisions
1. Used the already-installed, self-hosted Be Vietnam Pro as the no-dependency type substitute. No external CDN, font, chart, or UI package was added.
2. Kept all Manager pages under their existing shared layout and primitives so every reachable route inherits the shell, cards, controls, table, status, and responsive behavior.
3. Retained native file and color controls in Branding because they are required for the existing public-brand configuration behavior.
4. Kept timeline/grid lines in Calendar and opening-hours visualizations because they encode time, rather than separating cards.

## Verification
- [x] `docker compose exec -T vite npm run build`: passed; Vite dependency deprecation warnings only.
- [x] `docker compose exec -T app php artisan test`: 268 passed, 1038 assertions.
- [x] `docker compose exec -T app vendor/bin/pint --dirty`: passed; no dirty PHP files required formatting.
- [x] `git diff --check`: passed.
- [x] `docker compose exec -T app php artisan test --filter=Manager`: 62 passed, 184 assertions.
- [ ] Browser QA: blocked because `http://127.0.0.1:9222` had no reachable CDP endpoint. No screenshots were created.

## Handoff Notes
- Complete desktop and <=390 CSS-pixel browser QA when CDP is available, especially the plane margins, bottom rail, scrollable mobile tabs, and chart reflow.

## Status
In review; browser QA remains outstanding.
