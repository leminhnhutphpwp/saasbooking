---
name: laravel-inertia
description: Laravel 13 + Inertia + React + shadcn coding standards for SÂN (mirrors the appdhv template)
metadata:
  scope: backend
  type: rules
---

# Laravel 13 + Inertia Standards

Stack and patterns mirror the template project `/Users/nhut/Documents/appdhv`.

## Architecture

- **No fat controllers.** Controllers only validate, call a Service, and return a response. All business logic → `app/Services/`; async/scheduled work → `app/Jobs/` (Horizon).
- **`BookingService` is the only concurrency chokepoint.** All holds go through it / an `InventoryDriver`. Never insert into `booking_slots` directly; never check-then-act on availability.
- **Tenant scope every business query** via `WorkingTenant::id($request)` — never trust `tenant_id` from the payload.

## Models

- `id` bigint PK **plus** a `uuid` column for public route binding: `public function getRouteKeyName(): string { return 'uuid'; }`.
- `use SoftDeletes;` and `use Concerns\Auditable;` on business models.
- Keep models thin; use query scopes; snapshot price/deposit onto the booking at creation (never read live pricing for historical rows).

## Migrations

- Standard Laravel migrations; **raw `DB::statement`** for Postgres-only features: `btree_gist`, `EXCLUDE` (anti double-book), RLS policies.
- Every migration carries a docblock explaining **why** (mirror appdhv style), not just what.
- Composite FK `(tenant_id, id)` on tenant-owned tables; index leads with `tenant_id`.

## Controllers (Inertia)

- Reads return `Inertia::render('Area/Page', [...])` — data flows straight into React props.
- Writes return `RedirectResponse` with a flash message (`->with('success', ...)`).
- Scope: `->where('tenant_id', WorkingTenant::id($request))` on every tenant-owned query.

## Frontend

- shadcn/ui primitives only (`resources/js/components/ui/`).
- `DashboardLayout` for authed pages, `GuestLayout` for auth pages; config-driven sidebar.
- Vertical UI is chosen via the component registry (`docs/08` §0), never per-sport branching.
- `@/*` → `resources/js/*`.

## Naming conventions

| Type | Convention | Example |
|------|-----------|---------|
| Controller | `[Name]Controller.php` | `BookingController.php` |
| Service | `[Name]Service.php` | `BookingService.php`, `ReconcileService.php` |
| Job | `[Action][Entity].php` | `ExpireStaleHolds.php` |
| Event | `[Entity][Event].php` | `BookingConfirmed.php` |
| Model | Singular PascalCase | `Booking.php`, `Court.php` |
| Enum | PascalCase in `app/Enums` | `BookingStatus.php`, `HoldStatus.php` |
| Migration | Standard Laravel | `2026_..._create_bookings_table.php` |

## When to use this skill

Reference this when:
- Writing Laravel or Inertia code
- Reviewing backend/frontend changes
- Creating a new Service, Model, Job, or migration
