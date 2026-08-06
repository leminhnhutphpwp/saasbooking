# UI Overhaul

## Goal
Unify the frontend around the approved green token system and improve responsive behavior without changing booking or manager behavior.

## Changed
- Strengthened light/dark semantic tokens and typography rhythm in `app.css`.
- Added `PublicBookingLayout`; migrated public booking selection to semantic surfaces while retaining dialog selectors and focus behavior.
- Improved manager page containers, headers, legacy dashboard/profile, calendar semantic slot controls, and mobile action rows.
- Tokenized shared auth and marketing layout/navigation/footer/heading components.
- Replaced the remaining warm-orange manager accents with the shared green tokens, including the sidebar, dashboard links, reports, refunds, avatar, and public-booking color fallback.
- Rebuilt the manager home hierarchy with priority actions, operational metrics, clearer schedules/attention panels, and grouped sidebar navigation.
- Fixed `SidebarTrigger` so the mobile trigger controls the mobile drawer instead of the desktop collapse state.
- Reworked the manager calendar around day navigation, court filtering, sticky time context, visible scroll guidance, and hover/focus-only walk-in affordances; removed repeated empty-slot prices that obscured booking information.
- Standardized normal manager pages on the shared `max-w-7xl` container and removed the calendar-specific width override; narrow form/empty-state pages remain intentionally constrained.

## Decisions
- Tenant branding remains an inline accent only on public booking.
- Amber, emerald, and rose remain reserved for semantic status communication.
- Did not modify protected T23 files or backend behavior.

## Verification
- `docker compose exec -T vite npm run build`: passed.
- `./scripts/dev.sh test`: passed, 269 tests and 1,050 assertions.
- Direct Docker Playwright run: 17/17 passed, including the VietQR hold flow.
- Existing 390px booking and 390px/1440px marketing overflow checks passed.
- Manager browser review: desktop `1440px` expanded and collapsed sidebar screenshots at `/tmp/browser-screenshot-1785946993881.png` and `/tmp/browser-screenshot-1785947028346.png`; exact `390x844` mobile drawer screenshot at `/tmp/san-ux/manager-home-mobile-drawer.png`, `scrollWidth: 390`, with no console/page/request errors.
- Calendar browser review: desktop screenshot `/tmp/browser-screenshot-1785947496088.png`; exact `390x844` court-filter, hover, and walk-in dialog flow screenshot `/tmp/san-ux/manager-calendar-mobile-walk-in.png`, `scrollWidth: 390`, with no console/page/request errors.
- Host Chromium review at `1920px`: manager booking container is the shared `max-w-7xl` at `1280px`, with `scrollWidth: 1920`; screenshot `/tmp/browser-screenshot-1785950544333.png`.

## Status
In review
