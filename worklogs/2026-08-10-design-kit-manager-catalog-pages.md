# Design-kit manager catalog pages

Date: 2026-08-10

## Goal

Bring Courts and Settings page-level UI into the canonical design kit without changing tenant configuration or public booking behavior.

## Changed

- Replaced remaining page-level arbitrary layout, radius, and visual utilities with design-kit token classes.
- Kept court list mobile cards, accessible form labels, numeric VND pricing, and opening-rule timeline controls intact.
- Kept tenant brand color dynamic only inside the public booking preview, with an explicit data-exception comment.

## Decisions

- Timeline positioning remains inline because opening and closing times are runtime data, while its surfaces and radii use supplied tokens.
- Public-preview color styles remain data-driven tenant branding and are not used by the signed-in app.

## Next

- Run `php artisan test tests/Feature/Catalog/CourtManagementTest.php tests/Feature/Venue/VenueProfileTest.php tests/Feature/Manager/BrandingControllerTest.php` and `npm run build` from an environment with PHP and Node installed.
- Browser-check the manager pages at 360px and desktop with a running application.
