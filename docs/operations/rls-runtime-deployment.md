# RLS Runtime Deployment

This runbook enables PostgreSQL RLS for the current direct tenant-owned tables. It is a defense in depth layer behind `WorkingTenant`; application queries must remain tenant-scoped.

## Credentials

Store these values in production secret management. Do not put them in Git, a Compose file, logs, or shell history.

| Variable | Consumer | Requirement |
|---|---|---|
| `DB_CONNECTION=pgsql` | HTTP, Horizon, scheduler runtime | Selects the non-owner runtime connection. |
| `DB_RUNTIME_USERNAME` | HTTP, Horizon, scheduler runtime | Dedicated `san_app`-style PostgreSQL login. |
| `DB_RUNTIME_PASSWORD` | HTTP, Horizon, scheduler runtime and role provisioning | Long random secret. |
| `DB_MIGRATOR_USERNAME` | migration/recovery only | Table owner or dedicated schema migrator; never runtime. |
| `DB_MIGRATOR_PASSWORD` | migration/recovery only | Separate long random secret. |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_SSLMODE=require` | both | Normal TLS database settings. |

The runtime role must have `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`, and must not own application tables. The RLS migration creates it on a fresh Docker/test database only when the migrator has `CREATEROLE`; production must provision it explicitly through secret management.

## Deployment Sequence

1. Take and verify a database backup. Confirm the current application is healthy while still using the migrator connection; do not enable RLS in an untested emergency shell.
2. Deploy this code release while HTTP/workers still have `DB_CONNECTION=migrator`. This lets the new middleware and job code exist before policies deny rows. Do not run migrations from a normal runtime container.
3. Provision the runtime login with the migrator credential and secret-injected variables. From an approved administrative runner:

```bash
PGPASSWORD="$DB_MIGRATOR_PASSWORD" psql \
  "host=$DB_HOST port=$DB_PORT dbname=$DB_DATABASE user=$DB_MIGRATOR_USERNAME sslmode=$DB_SSLMODE" \
  -v runtime_role="$DB_RUNTIME_USERNAME" \
  -v runtime_password="$DB_RUNTIME_PASSWORD" \
  -f apps/app/database/rls/provision-runtime-role.sql
```

4. Run the ordered migration with the owner/migrator connection. This grants the role, then enables the policies. `DB_CONNECTION=migrator` is required because existing migrations use Laravel's default connection facade.

```bash
DB_CONNECTION=migrator php artisan migrate --database=migrator --force
```

5. Verify the SQL checks below before changing runtime pods. A missing role, a bypass role, or a table owned by the runtime login is a hard stop.
6. Change only HTTP, Horizon, and scheduler deployments to `DB_CONNECTION=pgsql` with `DB_RUNTIME_*`; restart all three. Keep migration/backup/recovery jobs explicitly on `migrator` credentials.
7. Exercise an authenticated manager request, a public `/book/{tenant}` request, a payment webhook, and each scheduled job. Check worker logs for RLS errors. The public route receives its tenant only from Laravel's server-side route binding; manager context is resolved solely through `WorkingTenant`.

Local Docker uses the non-secret defaults in `apps/app/.env.example`. Run `bash scripts/dev.sh setup`; it migrates with `migrator` and starts app processes with the `pgsql` runtime login. Existing local databases need `bash scripts/migrate.sh up` once after updating `.env`.

## Verification SQL

Run as the migrator after step 4. Substitute the secret-injected role name through `psql -v runtime_role=...`; never interpolate it from a request.

```sql
SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname = :'runtime_role';

SELECT c.relname, pg_get_userbyid(c.relowner) AS owner, c.relrowsecurity AS rls_enabled
FROM pg_class c
WHERE c.relkind = 'r'
  AND c.relnamespace = 'public'::regnamespace
  AND c.relname IN (
    'audit_logs', 'resource_categories', 'courts', 'opening_rules', 'pricing_rules', 'blackouts',
    'customers', 'bookings', 'booking_slots', 'recurring_series', 'payments', 'refunds',
    'zalo_oa_configs', 'notification_messages', 'tenant_bank_config', 'bank_txn_inbox'
  )
ORDER BY c.relname;
```

The first query must show `rolsuper = false` and `rolbypassrls = false`; the second must show `rls_enabled = true` and an owner other than the runtime role. CI's `RlsRuntimeRoleTest` connects as the actual runtime role and proves same-tenant read/write, cross-tenant filtering, and context-less write rejection.

## Rollback

If verification fails before runtime pods switch, fix the role or code and rerun the migration. If a live rollback is necessary, first switch HTTP/workers back to `DB_CONNECTION=migrator`, then run:

```bash
DB_CONNECTION=migrator php artisan migrate:rollback --database=migrator --step=1 --force
```

This disables policies but deliberately retains the runtime login and grants. It is an emergency availability rollback, not an isolation-preserving state; investigate and redeploy before returning to normal operation.

## Current Exceptions And Release Gate

RLS is enabled on the 16 direct tenant-owned tables listed above. Composite tenant foreign keys continue to enforce cross-tenant reference integrity; policy checks use the same `tenant_id`. `tenant_bank_config` and `bank_txn_inbox` also enforce tenant-paired config/payment references.

The following remain intentionally outside RLS and require application-level scoping:

- `tenants`, `users`, `memberships`, roles/permissions, sessions, cache, and queue tables: identity/authentication and infrastructure must resolve before a tenant context exists. `WorkingTenant` validates active membership/primary candidates server-side; deleting a primary membership atomically clears or re-points `users.tenant_id` through `memberships_reassign_primary_tenant`, so stale session/cookie context cannot restore access. See [`identity-bootstrap-tenant-boundary.md`](identity-bootstrap-tenant-boundary.md).
- `platform_services`: genuinely global platform catalog.
- The bank webhook has one narrow pre-context exception: `app_webhook_tenant_id(provider, account_number)` is a `SECURITY DEFINER` lookup executable by the runtime role. It returns only the mapped tenant ID, after which normal RLS applies to the configuration, inbox, and reconciliation work. It never accepts a tenant ID from the payload. Historical unattributed inbox rows remain inaccessible to the runtime role and require migrator-role maintenance for attribution.

Before adding any table with a direct `tenant_id`, add it to the RLS migration (or a follow-on RLS migration), grant the runtime role, and add a policy/test in the same release. Do not make a context-less command query RLS tables with the runtime role. Tenant-aware scheduled work enumerates global tenants, then executes each tenant's work within its own transaction-local context; truly global maintenance uses the separate migrator role.
