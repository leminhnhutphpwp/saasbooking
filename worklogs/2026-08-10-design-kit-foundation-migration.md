# T47 Design-Kit Foundation Migration

## Goal

Adopt the user-selected design kit as the canonical UI system and migrate only the shared
Manager foundation.

## Changed

- Added the design-system and design-review skills, reviewer agent, and token hook.
- Replaced the conflicting Quiet Green `DESIGN.md` with a canonical redirect.
- Ported canonical tokens into the Tailwind 3/shadcn CSS bridge and updated the shared
  Manager shell, controls, overlays, tables, states, and numeric treatment.

## Decisions

- Kept Be Vietnam Pro local through the existing `@fontsource` package. Space Grotesk is
  not installed, so `--font-num` falls back to the UI stack with tabular figures.
- Did not install the kit's Tailwind 4 `theme.css` or Google Fonts import. The hook checks
  added UI lines only and excludes token declarations and SVG fragment URLs.

## Verification

- `git diff --check`: passed.
- `docker compose exec -T app php artisan test tests/Feature/Manager/ManagerDashboardTest.php tests/Feature/Manager/ManagerAccessTest.php`: passed, 6 tests / 23 assertions.
- `docker compose exec -T app ./vendor/bin/pint --dirty --test`: passed, 0 files.
- Frontend build could not run: `npm` is not available locally or in the app container.
- Browser QA could not run: CDP endpoint `127.0.0.1:9222` is unavailable.
