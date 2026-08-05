# Identity Bootstrap Tenant Boundary

`tenants`, `users`, `memberships`, Spatie role tables, sessions, and password-reset records are intentionally not tenant-RLS tables. The application must read authenticated identity and membership rows before it can derive the transaction-local `app.tenant_id` required by tenant-owned RLS policies.

The application boundary is `WorkingTenant`: non-operators may establish context only from an active tenant joined through their current `memberships` rows or their legacy `users.tenant_id` primary/fallback. Query-string and cookie tenant identifiers are candidates only; they must match that server-side set. The `memberships_reassign_primary_tenant` trigger clears or re-points the primary tenant when its membership is removed, so a revoked primary membership cannot be resurrected by a stale browser cookie or session. Inactive or soft-deleted tenants, UUID/slug inputs, and arbitrary numeric identifiers are excluded from the server-side set.

`super_admin` remains the explicit platform-operator exception and may select any active tenant. Manager authorization separately verifies the membership pivot role for the resolved tenant, so a global `owner` or `staff` role cannot elevate a membership in another tenant.

Do not add blanket RLS to these bootstrap tables. If identity-table access needs further restriction, use a dedicated application query/service boundary that preserves the pre-context lookup, then test it under the runtime role.
