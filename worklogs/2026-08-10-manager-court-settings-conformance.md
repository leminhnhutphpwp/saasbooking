# Manager court and settings conformance

## Goal

Bring the manager court configuration and venue settings pages into DESIGN.md conformance without changing form or pricing behavior.

## Changed

- Reflowed Courts into accessible cards below `md`; the desktop table remains available from `md` upward.
- Moved right-side and sticky page arrangements to `xl`, added form labels and accessible weekday control groups, and supplied a timeline summary.
- Normalized owned card spacing and price numerals, simplified empty states, and kept tenant brand color rendering within the public booking preview.

## Decisions

- Existing shared primitives and concurrent changes were left untouched per T43 scope.
- Logo removal remains destructive but uses a non-filled negative affordance with an accessible name.

## Next

- Browser QA remains blocked: no Chrome DevTools endpoint is listening at `127.0.0.1:9222`, so desktop and mobile visual checks could not run.

## Verification

- `docker compose exec -T vite npm run build` passed.
- `docker compose exec -T app php artisan test tests/Feature/Catalog/CourtManagementTest.php tests/Feature/Catalog/OpeningRuleControllerTest.php tests/Feature/Catalog/PricingRuleControllerTest.php tests/Feature/Manager/BrandingControllerTest.php tests/Feature/Venue/VenueProfileTest.php` passed: 30 tests, 225 assertions.
- Browser QA retry failed because Chrome DevTools was unavailable at `127.0.0.1:9222`.
