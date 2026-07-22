---
name: architecture
description: System architecture overview for SÂN — modular monolith, 7 modules, multi-tenancy, two inventory shapes
---

# Architecture — SÂN court booking

A **modular monolith on a single PostgreSQL** (Laravel 13 + Inertia + React). Module boundaries are *logical* (a group of Model + Service + Controller + Job), not network services. One database, one deploy, operable by one person.

```
Browser (Inertia/React)
    │  Inertia::render (no separate API for the dashboard)
    ▼
Laravel monolith ──► PostgreSQL (data + queue via Horizon + availability cache)
    ▲
    └── interop (optional): /v1 API + embed widget + WordPress plugin → same BookingService
```

## The 7 modules

| Module | Owns | Role |
|---|---|---|
| `identity` | tenants, users, membership | Tenant + auth; `WorkingTenant` is the single tenant source |
| `court-catalog` | courts, opening_rule, blackout, pricing_rule | What's sold + peak/off-peak pricing |
| `booking` | customers, bookings, booking_slots, recurring_series | The engine; only concurrency chokepoint |
| `payment` | payments, bank_txn_inbox, refunds | VietQR deposit + SePay/Casso reconcile |
| `notification` | notifications, zalo_oa_config | Zalo ZNS confirm/reminder |
| `interop` | api_key, webhook_endpoint | Embed booking into any front-end (Phase 2) |
| `billing` | plans, subscriptions, invoices | Flat SaaS fee (Phase 2) |

**Rule:** a module never reads/writes another module's tables directly — call the owning Service, or emit an event (`afterCommit` queued listener via Horizon).

## Multi-tenancy (three layers)

1. **App scope** — every business query scoped by `WorkingTenant::id($request)`; non-operators hard-clamped to `users.tenant_id`; never trust the payload.
2. **Composite FK** — `(tenant_id, id)` so a row cannot reference another tenant's row.
3. **RLS** — Postgres policy as the safety net.

Keys follow the appdhv template: `id` bigint PK + `uuid` route key; `SoftDeletes` + `Auditable`.

## Two inventory shapes (meet at the `booking` layer)

- **resource-time-slot** — courts (pickleball/badminton/tennis) and spa. Anti-overlap via a Postgres exclusion constraint on `booking_slots`. **Phase 1.**
- **capacity/session** — golf tee-time, classes, events. Anti-oversell via conditional counter UPDATE. **Reserved door**, not built now.

Both reuse the same lifecycle, deposit/reconcile, Zalo, tenant, and interop. Selection is by `tenants.vertical → inventory_mode` (see the `vertical-dispatch` skill).

## When to use

- Understanding how the system fits together before a cross-module change.
- Deciding where new logic belongs (which module/Service).
- Onboarding to the codebase.

## Related docs

- `docs/05-module-map.md` — module ownership
- `docs/06-erd.md` — data model + multi-tenant strategy
- `docs/08-thiet-ke-module-chi-tiet.md` — module interfaces + vertical dispatch (§0)
- `docs/09-kien-truc-mo-rong.md` — extensibility / future architecture
