---
name: tenant-isolation
description: Tenant isolation — WorkingTenant, composite FK, RLS, query scoping, security boundaries
---

# Tenant Isolation — Sân

Multi-tenancy is enforced at **three layers**: app-level (`WorkingTenant`), schema-level (composite FK), and database-level (RLS). No single layer is sufficient alone — they are defense-in-depth.

## Layer 1: App scope — WorkingTenant

`WorkingTenant` is the **single source of truth** for which venue a request belongs to. Ported from appdhv's `WorkingSchool`.

```php
// The ONLY way to get the current tenant
$tenantId = WorkingTenant::id($request);

// Controllers trust ONLY WorkingTenant, NEVER the payload
// ❌ WRONG
$tenantId = $request->tenant_id;  // can be forged

// ✅ CORRECT
$tenantId = WorkingTenant::id($request);  // resolved server-side
```

### Resolution logic (per request)

```php
WorkingTenant::resolve(Request $request): ?int
```

| User role | Resolution strategy |
|---|---|
| `super_admin` (platform operator) | `?tenant_id` query param → cookie → first active venue |
| Any other role | **Hard-clamped** to `users.tenant_id`. `?tenant_id` and cookie are **ignored**. |

If a non-admin user has no `tenant_id` (null), they belong to no venue — scoped queries return empty.

### Middleware

```php
// app/Http/Middleware/ResolveWorkingTenant.php
$request->attributes->set(WorkingTenant::ATTR, WorkingTenant::resolve($request));
```

Registered in `bootstrap/app.php` or `Kernel.php`. Runs before every request.

### Query scoping

Every business query MUST be scoped by `tenant_id`:

```php
// ✅ CORRECT — scoped to current tenant
Booking::where('tenant_id', WorkingTenant::id($request))->get();

// ❌ WRONG — leaks other tenants' data
Booking::all();

// ❌ WRONG — trusts payload
Booking::where('tenant_id', $request->tenant_id)->get();
```

### Tenant switcher (super_admin only)

```php
WorkingTenant::switchable(?User $user): Collection
// super_admin → all active tenants
// any other role → only their own tenant (or empty)
```

## Layer 2: Composite FK — (tenant_id, id)

Most business tables use a composite pattern:

```php
$table->id();                                    // bigint PK
$table->foreignId('tenant_id')->constrained();   // tenant scope
$table->uuid('uuid')->unique();                  // route binding
```

This ensures:
- A booking's `tenant_id` must match an existing tenant.
- Application code enforces that queries filter by `tenant_id`.
- Cross-tenant references are impossible at the FK level.

For stricter enforcement, composite FKs can be used:

```php
$table->foreign(['tenant_id', 'court_id'])
      ->references(['tenant_id', 'id'])
      ->on('courts');
```

## Layer 3: RLS — Postgres Row-Level Security

RLS is the safety net. Even if application code forgets the tenant scope, the database filters rows.

```sql
-- Enable RLS on a table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: tenant isolation
CREATE POLICY tenant_isolation ON bookings
    USING (tenant_id = current_setting('app.tenant_id')::int);

-- Set tenant context per request (in middleware or connection)
DB::statement("SET app.tenant_id = ?", [WorkingTenant::id($request)]);
```

**RLS is a safety net, not the primary mechanism.** Application code must still scope queries correctly — RLS catches mistakes, not replaces discipline.

## Common violations and how to detect them

| Violation | How to detect | Fix |
|---|---|---|
| Query without `tenant_id` scope | Code review / `module-reviewer` agent | Add `->where('tenant_id', WorkingTenant::id($request))` |
| Using `$request->tenant_id` | Grep for the pattern | Replace with `WorkingTenant::id($request)` |
| Cross-tenant JOIN | Code review | Add tenant scope to both sides of JOIN |
| `Model::all()` without scope | Code review | Add `->where('tenant_id', ...)` |
| Forgetting tenant in `forceCreate` | Code review | Always include `'tenant_id' => WorkingTenant::id($request)` |

## Testing tenant isolation

```php
// tests/Feature/TenantIsolationTest.php
public function test_cannot_access_other_tenant_data(): void
{
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $bookingA = Booking::forceCreate([
        'tenant_id' => $tenantA->id,
        'code' => 'SAN-TEST1',
        // ...
    ]);

    // Authenticate as tenantB user
    $this->actingAs($tenantB->users->first());

    // Attempt to access tenantA's booking
    $response = $this->get("/manager/bookings/{$bookingA->uuid}");

    $response->assertStatus(403); // or 404
}
```

## When to use

- Writing any business query (ensure tenant scope).
- Adding a new model/migration (ensure `tenant_id` column).
- Reviewing code for tenant isolation violations.
- Debugging data leakage between tenants.

## Related docs

- `docs/06-erd.md` — multi-tenant schema design
- `docs/08-thiet-ke-module-chi-tiet.md` §1 — identity module + WorkingTenant
- `docs/11-diem-vo.md` — #9 (composite FK), tenant isolation invariants
