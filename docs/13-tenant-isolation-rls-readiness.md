# Tenant Isolation RLS Readiness

Application scoping through `WorkingTenant`, tenant-scoped queries, and composite foreign keys is active. PostgreSQL RLS is intentionally not enabled yet: enabling it on a connection that is a superuser, table owner, or has `BYPASSRLS` would not enforce isolation and would create a false guarantee.

Enable RLS only after all of the following are deployed and verified:

1. Laravel uses a dedicated, non-superuser application login with `NOBYPASSRLS`. Migrations use a separate owner role; the runtime role must not own tenant tables, or table owners must use `FORCE ROW LEVEL SECURITY`.
2. Connection setup uses a transaction-local tenant context, for example `SET LOCAL app.tenant_id = '<resolved WorkingTenant id>'`, for every tenant-scoped request and job. It must be set after a transaction begins and cleared by transaction end, preventing pooled connections from inheriting another request's context.
3. Background jobs and system/webhook flows have an explicit, verified tenant context. Context-less operations must use a separate privileged maintenance role, not the runtime application role.
4. Each tenant-owned table has `ENABLE ROW LEVEL SECURITY`, appropriate `USING` and `WITH CHECK` policies based on `current_setting('app.tenant_id', true)`, and integration tests run under the runtime role rather than `postgres`.
5. Deployment verifies `session_user`, `current_user`, role attributes, table ownership, and that cross-tenant reads and writes are denied by PostgreSQL itself.

Until those prerequisites hold, RLS remains disabled. It is defense in depth, not a replacement for explicit `WorkingTenant` query scopes.
