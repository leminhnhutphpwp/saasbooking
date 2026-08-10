# T51 Design-Kit Public and Marketing Pages

## Goal

Migrate the public booking and marketing surfaces to the canonical design kit.

## Changed

- Rebuilt the public court and slot selection flow as an even, keyboard-operable court grid.
- Applied chalk corner marks and explicit selected text to selected courts and slots.
- Updated public time and money display to the shared Vietnamese formatters.
- Replaced legacy marketing palette, radii, shadows, and motion with canonical token-backed surfaces and controls.

## Decisions

- Dark pitch surfaces are restricted to explicit marketing sections and their contained mockups.
- Tenant `primary_color` remains only for genuine public tenant identity: booking-logo border and customer-avatar initial. It is not used for selection or product state.
- Kept the existing public routes, hold submission, payment status polling, cancellation behavior, tenant data, and signed-route behavior unchanged.

## Verification

- `git diff --check`: passed.
- `docker compose exec -T app php artisan test tests/Feature/Booking/PublicBookingTest.php tests/Feature/Booking/PublicBookingPaymentPresentationTest.php`: passed, 8 tests / 79 assertions.
- `docker compose exec -T vite npm run build`: passed (Vite reported existing deprecation warnings).
- Browser QA blocked: CDP endpoint `127.0.0.1:9222` is unavailable.
