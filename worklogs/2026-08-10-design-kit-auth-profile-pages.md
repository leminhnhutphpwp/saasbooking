# T52 Design-Kit Auth and Profile Pages

## Goal

Migrate only live auth, guest, registration, and profile UI to the canonical design kit.

## Changed

- Replaced legacy colors, dark variants, borders, decorative blur, and undersized controls in the scoped screens with canonical token classes.
- Kept forms semantic, added a visible 44px checkbox target, and applied the chalk selected state to service registration.
- Updated the profile deletion dialog with Headless UI title and description primitives, canonical panel/overlay treatment, and token-based motion.
- Changed Inertia progress from a hardcoded hex value to `var(--turf-600)`.

## Decisions

- Preserved all existing Inertia methods, route names, field names, validation paths, password reset flows, service registration, and account deletion behavior.
- Browser QA is blocked because the available web server has no Chrome DevTools Protocol endpoint at `127.0.0.1:9222`.

## Verification

- `git diff --check`: passed.
- `docker compose exec -T app php artisan test tests/Feature/Auth/AuthenticationTest.php tests/Feature/Auth/RegistrationTest.php tests/Feature/Auth/ServiceRegistrationTest.php tests/Feature/Auth/PasswordResetTest.php tests/Feature/Auth/PasswordUpdateTest.php tests/Feature/Auth/PasswordConfirmationTest.php tests/Feature/ProfileTest.php`: passed, 27 tests / 79 assertions.
- `docker compose exec -T vite npm run build`: passed (Vite reported pre-existing/dependency deprecation warnings only).
- Browser QA: blocked, CDP endpoint `127.0.0.1:9222` is unavailable.
