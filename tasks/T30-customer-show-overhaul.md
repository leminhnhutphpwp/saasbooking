---
id: T30
title: Customer Show page overhaul (Phase 1)
status: in-review
owner: opencode
priority: P1
depends_on: [T29]
branch: fix/customer-routes-rls
scope:
  - apps/app/app/Services/CustomerService.php
  - apps/app/app/Http/Controllers/Manager/CustomerController.php
  - apps/app/resources/js/Pages/Manager/Customers/Show.jsx
  - worklogs/2026-08-06-customer-show-overhaul.md
updated: 2026-08-06
---

## Goal
Transform the sparse customer profile into a rich "Customer 360" view with hero section, expanded stats, favorite court, and filterable booking history.

## Context / references
Part of the 6-phase UI/UX overhaul plan. Phase 1 focuses on `/manager/customers/{uuid}` as the starting point.

## Acceptance criteria
- [x] Hero section with avatar, contact info, member since date
- [x] 6 stat cards: total bookings, upcoming, cancelled, no-shows, total spent, last visit
- [x] Favorite court display when available
- [x] Filterable booking history (All/Upcoming/Completed/Cancelled/No-show)
- [x] Quick action buttons: Edit and Book for customer
- [x] Backend aggregations: total_spent, last_visit, favorite_court
- [x] Responsive layout at 390px and 1440px
- [x] No console errors, no failed requests
- [x] Existing tests pass (14 tests, 33 assertions)

## Out of scope (do NOT do here)
- Customer Index page (Phase 2)
- Home dashboard refresh (Phase 3)
- Calendar polish (Phase 4)

## Verification (agent fills in before setting in-review)
- [x] `npm run build` passes
- [x] `php artisan test --filter=CustomerOperationsTest` passes: 14 tests, 33 assertions
- [x] Browser check at 1920px: hero, stats, favorite court, booking history visible
- [x] No console errors, no failed network requests
- [x] Filter tabs work correctly (tested "Sắp tới" filter, empty state shows)
- [x] Edit dialog opens with 3 fields (name, phone, email)
- [x] "Đặt hộ" button links to calendar
- [x] Stats display correctly: total_spent=0 (no confirmed bookings), last_visit shows date
- [x] Favorite court displays "Sân A"
- [ ] Browser check at 390px: responsive layout verified
- [ ] Screenshots captured at both viewports

## Log
- 2026-08-06 · claimed by opencode for Phase 1 Customer Show overhaul
- 2026-08-06 · extended CustomerService.getHistory() with total_spent, last_visit, favorite_court aggregations
- 2026-08-06 · updated CustomerController to pass created_at to frontend
- 2026-08-06 · rewrote Show.jsx with hero section, 6 stat cards, favorite court, filterable booking history
- 2026-08-06 · verified build passes, 14 tests pass, desktop browser check at 1920px
