# T42 manager customer and finance conformance

Date: 2026-08-10

## Goal
Bring the six manager customer, finance, home, and reports pages into DESIGN.md conformance without changing their backend contracts or tenant routing.

## Changed
- Reflowed customer, booking-history, refund, and reconciliation records from div lists to native responsive tables with headers and right-aligned tabular numeric columns.
- Updated dashboard charts with hatched capsule bars, labeled zero baselines, 11px labels, peak labels, and accessible data summaries plus native datum hover/focus details.
- Removed page-level overflow handling, reduced nonessential green accents, and fixed Home's nested link/button markup with `Button asChild`.

## Decisions
- Kept chart rendering dependency-free SVG because no chart library is present; each datum exposes its value through an SVG title.
- Preserved all existing Inertia routes, form submissions, confirmation dialogs, and refund/reconciliation actions.

## Next
- Docker Vite build passed and 28 relevant PostgreSQL feature tests passed.
- Browser desktop/mobile QA remains blocked: no Chrome DevTools Protocol endpoint is exposed at `127.0.0.1:9222` or `localhost:9222`.
