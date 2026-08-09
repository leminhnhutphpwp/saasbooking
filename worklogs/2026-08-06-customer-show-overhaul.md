# 2026-08-06 · Customer Show page overhaul (Phase 1)

## What we did
- Implemented Phase 1 of the 6-phase UI/UX overhaul plan: Customer Show page transformation
- Extended `CustomerService.getHistory()` with aggregations: `total_spent`, `last_visit`, `favorite_court`
- Updated `CustomerController` to pass `created_at` to frontend
- Rewrote `Show.jsx` with:
  - Hero section: avatar with initials, contact info (clickable phone/email), member since date
  - 6 stat cards: total bookings, upcoming, cancelled, no-shows, total spent, last visit
  - Favorite court display when available
  - Filterable booking history (All/Upcoming/Completed/Cancelled/No-show)
  - Quick action buttons: Edit and Book for customer
  - Responsive layout (tested at 1920px)

## Key decisions
- `total_spent` only counts bookings with status `confirmed` or `completed` (not `pending_deposit`, `expired`, `cancelled`, or `no_show`)
- Avatar uses initials from customer name (first 2 characters, uppercase)
- Filter tabs use client-side filtering for instant response
- "Đặt hộ" button links to calendar page (future enhancement: pre-fill customer info)

## Verification results
- Build: ✓ passes
- Tests: ✓ 14 tests, 33 assertions pass
- Browser (1920px): ✓ all components render correctly
- Console errors: ✓ none
- Network requests: ✓ no failures
- Filter tabs: ✓ "Sắp tới" filter works, empty state shows correctly
- Edit dialog: ✓ opens with 3 fields (name, phone, email)
- "Đặt hộ" button: ✓ links to `/manager/calendar`
- Stats: ✓ display correctly (total_spent=0 for test customer with no confirmed bookings)
- Favorite court: ✓ displays "Sân A"

## Next steps
- Test responsive layout at 390px (mobile viewport)
- Capture screenshots at both viewports for documentation
- Move to Phase 2: Customer Index page enhancement
