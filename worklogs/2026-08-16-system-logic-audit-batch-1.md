# 2026-08-16 - System logic audit, remediation batch 1

**Goal:** Under T71, audit the system for logic errors and business-operation misalignment, then fix the confirmed data-integrity and reliability defects (failing test first, minimal change).

**Changed:**

- **Customer identity (C1/H1).** `normalizePhone` now collapses the bare country-code forms (`84…`, `0084…`) that previously escaped normalization, so every accepted spelling of one phone number maps to one identity. `PublicBookingController::hold` normalizes before `firstOrCreate` — it was the only creation path storing the raw input, which fragmented one human into up to three customers under `unique(tenant_id, phone)` and hid public bookings from manager phone search. Added `CustomerService::updateCustomer`, and pointed `CustomerController::update` at it: the bound customer is now edited in place, and a phone already owned by another customer in the tenant is rejected as a `phone` validation error instead of silently creating a second record.
- **Refund ledger conservation (C4).** `requestRefund` locks the payment, sums prior `requested`/`done` refunds, and validates the request against the *remaining* headroom inside one transaction; it also requires the payment to be `matched`/`orphaned`, so no refund can be raised against money never collected. `markRefundDone` locks the refund and returns early unless it is `requested`, making settlement idempotent and preserving the original `resolved_at`/`resolved_by`. `payments.amount` remains untouched.
- **Recurring series occurrence loss (C2).** `generateHorizon` no longer advances `generated_through` unconditionally: the cursor parks on the day before the first conflicted date, so a session lost to a temporary clash is retried on the next run instead of being skipped forever. Because later dates can now be revisited, the generator first loads the dates already materialised for the series (excluding cancelled/expired) and skips them, so retries cannot double-book. `extendHorizon` destructures the conflicts it previously discarded and logs them with series and tenant context, and uses `eachById` to match the keyset-chunking convention used by the jobs.
- **Walk-in commit race (C3).** `BookingWorkbenchController::store` and `CalendarController::walkIn` now wrap `confirmDeposit` in the same `SlotTakenException` handler as `createHold`. That call re-enters the exclusion constraint at the commit `UPDATE`, so a concurrent expire+re-hold produced an unhandled 500 while leaving the already-committed hold behind as an orphaned `pending_deposit`. Losing the race now releases the hold via `markPaymentOrphaned` and returns the standard "slot taken" flash.

**Decisions:**

- Kept the single anti-overlap path intact. The audit confirmed `booking_slots.no_double_book` is the only arbiter and no check-then-act exists; the series duplicate-guard added here filters *which dates to attempt*, and the exclusion constraint still decides every race.
- Rejected duplicate phones on update rather than auto-merging. Merging rewrites `bookings.customer_id` and is not reversible, so it belongs in a separate, explicitly reviewed backfill.
- Scoped this batch to data integrity and reliability. The reporting/timezone defects found in the audit were left untouched because they share one root cause (UTC parsing of venue wall-clock time) and should be fixed behind a shared helper, not patched per call site.
- No schema changes were required.

**Verification:**

- `php artisan test` — 324 passed, 1738 assertions (baseline before the work: 314 passed, 1707 assertions). All 10 new tests failed for the intended reason before the fixes.
- `vendor/bin/pint --test` clean on all 12 changed files. Six pre-existing style failures elsewhere in `app/` were left alone as out of scope.
- `npx vite build` passes.
- Not done: browser check of the affected pages.

**Next:**

- Reporting correctness batch (audit H4–H7): report day boundaries, occupancy/utilization opening windows, top-customer slot join, and weekly deposit collection all compute in UTC or from the wrong source. Introduce one venue-timezone helper first.
- Customer-stats defects (audit H2/H3): `completed` counts `Confirmed` instead of `Completed`, and `upcoming` compares wall-as-UTC slots against real-UTC `now()`.
- Availability N+1 (audit H8): `AvailabilityService::search` is called inside a per-court loop in the manager calendar and eight times per public page request.
- RLS hardening: no migration issues `FORCE ROW LEVEL SECURITY`, so the table owner bypasses the policies; three job queries rely on RLS alone with no explicit `tenant_id` scope.
- Consider a reviewed backfill to merge the duplicate customers already created by the C1 defect.
