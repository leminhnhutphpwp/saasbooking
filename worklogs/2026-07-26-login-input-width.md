# Login input width fix

## Goal

Fix the email and password fields on the login page rendering narrower than the form card.

## Changed

- Added `w-full` to both login `TextInput` instances in `resources/js/Pages/Auth/Login.jsx`.
- Reworked the oversized stacked guest branding into a compact horizontal brand lockup in `resources/js/Layouts/GuestLayout.jsx`.
- Reduced dead space above the auth card and replaced hardcoded orange/amber decorations with theme-aware primary tokens.
- Added Laravel Vietnamese validation, authentication, password-reset, and pagination translations under `lang/vi`.
- Changed the default app, fallback, and Faker locales to Vietnamese.
- Translated all remaining Breeze auth screens to Vietnamese.

## Decisions

- Fixed the two affected fields locally instead of changing the shared `TextInput` component; other auth forms already pass `w-full`, so changing the component would unnecessarily broaden the impact.
- Kept the redesign in the shared guest layout so login, registration, and password recovery retain one coherent auth shell.

## Verification

- `npm run build` passed.
- `docker compose exec -T app php artisan test --filter=Authentication` passed: 4 tests, 8 assertions.
- Added an authentication regression test asserting Vietnamese required-field messages.

## Next

- Confirm the corrected full-width fields visually at `/login` after refreshing the browser.
