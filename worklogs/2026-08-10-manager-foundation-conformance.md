# Manager Foundation Conformance

## Goal
Bring the shared Manager shell and primitives into conformance with `DESIGN.md`.

## Changed
- Added exact design tokens, shadcn bridges, display/numeric utility classes, shell motion, and reduced-motion support.
- Rebuilt Manager navigation around primary, tools, and account groups with keyboard roving and a mobile More mechanism.
- Removed the unsupported theme toggle and inert search field.
- Updated shared buttons, cards, tables, status badges, empty states, statistics, and quick links.

## Decisions
- Outfit and Plus Jakarta Sans are not installed locally. The existing bundled Be Vietnam Pro remains the UI face; a system rounded display fallback provides the second family without external assets or dependencies.
- No command palette exists, so search was removed rather than presenting a nonfunctional control.

## Next
- Browser QA remains blocked: no DevTools endpoint is available at `127.0.0.1:9222`.

## Verification
- `docker compose exec -T vite npm run build` passed.
- `docker compose exec -T app php artisan test --testsuite=Feature` passed: 267 tests, 1,037 assertions.
- `git diff --check` passed.
