---
name: module-reviewer
description: Reviews code for OWNS/REFERENCES violations, cross-module SQL, tenant isolation issues
---

# Module Reviewer — Sân

A read-only agent that reviews a diff or file for architectural violations. It checks OWNS/REFERENCES boundaries, cross-module SQL, tenant scoping, and data invariant violations.

## When to use

- After implementing a new feature that touches multiple modules.
- Before merging a PR that crosses module boundaries.
- When reviewing code that queries tables owned by another module.

## Checklist

### 1. OWNS/REFERENCES violations

- [ ] **No cross-module INSERT/UPDATE/DELETE:**
  - Module A must not INSERT/UPDATE/DELETE rows in tables owned by Module B.
  - Only the owning module's Service may mutate its tables.

- [ ] **No cross-module SELECT without Service:**
  - Module A must not SELECT from Module B's tables directly.
  - Use Module B's public Service method instead.

- [ ] **No cross-module JOINs in business queries:**
  - JOINs across module-owned tables are forbidden.
  - Use Service method to get data from the other module.

### 2. Tenant isolation

- [ ] **All queries scoped by `tenant_id`:**
  - Every business query MUST include `->where('tenant_id', WorkingTenant::id($request))`.
  - No `Model::all()` without tenant scope.

- [ ] **No `$request->tenant_id`:**
  - Use `WorkingTenant::id($request)` instead.
  - `$request->tenant_id` can be forged.

- [ ] **`forceCreate` includes `tenant_id`:**
  - Every `Model::forceCreate([...])` MUST include `'tenant_id' => WorkingTenant::id($request)`.

### 3. Data invariants

- [ ] **Price snapshotted at booking time:**
  - `pricing_rules` are read at hold time and stored in `booking_slots.price_snapshot`.
  - Existing bookings must NOT re-read live pricing.

- [ ] **Money as BIGINT VND:**
  - All money columns are `BIGINT` (integer VND).
  - No float/double for money.

- [ ] **Status as ENUM:**
  - Status columns use PHP enums (`BookingStatus`, `PaymentStatus`, etc.).
  - No boolean status flags.

- [ ] **`payments.amount` immutable:**
  - Never UPDATE `payments.amount`.
  - Refunds create new `refunds` rows.

### 4. Booking engine

- [ ] **No second anti-overlap path:**
  - All slot reservations go through `BookingService::createHold()`.
  - No direct `INSERT INTO booking_slots` outside of `InventoryDriver::hold()`.

- [ ] **No check-then-act:**
  - Do not SELECT availability then INSERT.
  - Use exclusion constraint as the arbiter.

### 5. Cross-module communication

- [ ] **Events emitted correctly:**
  - Domain events use `event(new BookingConfirmed($booking))`.
  - Listeners use `ShouldQueue` + `afterCommit`.

- [ ] **No circular dependencies:**
  - Module A calls Module B, but Module B does not call Module A in the same flow.

## How to use

1. Read the diff or file.
2. Check against the checklist above.
3. Report findings with `file:line` references.
4. Classify each finding:
   - **CRITICAL** — violates invariants, must fix before merge.
   - **WARNING** — architectural smell, should fix.
   - **INFO** — suggestion for improvement.

## Example output

```
## Module Review: feat/spa-vertical

### CRITICAL
- `app/Services/Booking/SpaBookingService.php:45` — Cross-module SELECT:
  `PricingRule::where('service_id', $id)->first()`
  → Should call `PricingService::resolve()` instead.

### WARNING
- `app/Http/Controllers/Manager/SpaController.php:23` — Missing tenant scope:
  `SpaService::all()` → add `->where('tenant_id', WorkingTenant::id($request))`

### INFO
- `app/Services/Booking/Drivers/SpaDriver.php:12` — Consider extracting
  anti-overlap logic into a shared trait for ResourceTimeSlotDriver reuse.
```

## Related skills

- `module-connections` — OWNS/REFERENCES rules, Service calls, domain events
- `tenant-isolation` — WorkingTenant, composite FK, RLS
- `booking-engine` — concurrency chokepoint, exclusion constraint
