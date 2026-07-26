# Pricing rules layout

## Goal

Use the available manager workspace more effectively and improve the visual hierarchy of the court pricing configuration page.

## Changed

- Switched the pricing page from the narrow container to the standard manager container.
- Added a responsive two-column layout: pricing rules as the primary area and a sticky summary/help sidebar on desktop.
- Added minimum/maximum price, covered weekdays, and configured time-range summaries.
- Improved pricing rows with clearer price, schedule, priority, and action hierarchy.
- Kept the existing CRUD dialog and backend behavior unchanged.

## Decisions

- Added useful summary content instead of stretching a short list across the full viewport.
- Kept the sidebar below the list on mobile and sticky on desktop.
- Avoided mutating `weekday` arrays while deriving labels.

## Verification

- `npm run build` passed.
- `docker compose exec -T app php artisan test --filter=Pricing` passed: 10 tests, 20 assertions.

## Next

- Visually verify the page at desktop and mobile widths.
