---
id: T02
title: Dashboard = real home
status: todo
owner: "-"
priority: P1
depends_on: [T01]
branch: feat/dashboard-home
scope:
  - apps/app/resources/js/Pages/Manager/Home/Index.jsx
  - apps/app/app/Http/Controllers/HomeController.php
updated: 2026-07-23
---

## Goal
Turn Home into the **hub** — the moment an owner/staff opens the app they see today's situation and jump anywhere fast. Cures the "pages feel disconnected" complaint.

## Acceptance criteria
- [ ] **Today overview**: bookings count, confirmed, awaiting-deposit, today's revenue, occupancy — via `StatCard` + `formatVND`.
- [ ] **Quick actions**: walk-in booking ("Đặt hộ"), create recurring series, view today's calendar, handle refunds — buttons that deep-link.
- [ ] **Needs-attention / cross-links**: short lists of "awaiting deposits", "refunds to process", "unmatched transactions" — each links to the right page.
- [ ] **Upcoming**: the next few bookings today.
- [ ] Data scoped by `WorkingTenant`; thin controller (read via existing services/models, no new business logic).
- [ ] Use the foundation components (`PageHeader/StatCard/StatusBadge/EmptyState/format`); empty states when there's no data.

## Out of scope (do NOT do here)
- No layout/sidebar/palette changes (that's T01). No heavy reports (that's T03).

## Verification
- [ ] `npm run build` passes · `php artisan test` if backend touched
- [ ] Browser: Home shows the tenant's correct numbers and every link lands on the right page.

## Log
- 2026-07-23 · created by manager
- 2026-07-23 · manager review: /manager/home 500 (BankTxnInbox.tenant_id undefined) → CHANGES REQUESTED, scope by account_number + status unmatched (PR #9)
