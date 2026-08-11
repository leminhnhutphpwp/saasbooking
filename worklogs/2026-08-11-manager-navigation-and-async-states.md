# 2026-08-11 - Manager navigation and async states

## Goal
Improve Manager navigation density, settings discoverability, and shared async/empty/error state contract.

## Changed
- `managerNav.jsx`: Reorganized into 4 groups (Primary, Catalog, Finance, Settings). Added Venue Profile (`manager.venue.edit`). Moved Series to Catalog, Courts to Catalog.
- `ManagerLayout.jsx`: Wrapped rail links in Tooltip components for accessible labels on hover.
- `AppTopbar.jsx`: Removed duplicate navigation tabs. Topbar now shows only active page label, tenant switcher, and user menu.
- `EmptyState.jsx`: Added `variant` prop (`first-use`, `filtered`, `error`) with default icons (PlusCircle, FilterX, AlertCircle). Added `example` prop rendering.
- `skeleton.jsx`: Added `SkeletonCard`, `SkeletonTable`, `SkeletonList` helper components using `ui-skeleton` class.
- `Courts/Index.jsx`: Applied `variant="first-use"` and `variant="filtered"` to empty states.
- `Customers/Index.jsx`: Split single EmptyState into separate `variant="first-use"` and `variant="filtered"` paths.
- `Refunds/Index.jsx`: Applied `variant="first-use"` (non-actionable).
- `Reconcile/Unmatched.jsx`: Applied `variant="first-use"` (non-actionable).

## Decisions
- Used existing `manager.venue.edit` route (not a new `manager.venue-profile` route) since the route already exists.
- Kept domain-specific icons (MapPin, Users, PartyPopper, CheckCircle2) on EmptyState even with variant prop, since they communicate domain context.
- Removed topbar navigation tabs entirely rather than keeping a subset, since the rail already provides all destinations with tooltips.

## Verification
- Frontend build: clean (no errors)
- Feature tests: 314 passed (1701 assertions)
- Manager access tests: 3 passed

## Next
- Playwright E2E for navigation matrix at 1440px and 390px
- T70 will add workflow E2E coverage

## Status
Complete (pending Playwright E2E).
