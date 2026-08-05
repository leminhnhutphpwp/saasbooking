# 2026-08-03 - RLS runtime role deployment

**Goal:** add a safe PostgreSQL RLS rollout with a non-bypass Laravel runtime role.

**Changed:** separate runtime/migrator database connections, transaction-local HTTP and scheduled-job tenant context, RLS role/policy migration, runtime-role regression test, and the production runbook.

**Decisions:** table owners/migrators intentionally bypass RLS and are never application runtime credentials. Identity/bootstrap and signed-webhook lookup tables remain documented exceptions until they can derive a tenant before querying tenant-owned data.

**Next:** run the production sequence in `docs/operations/rls-runtime-deployment.md`; every future direct `tenant_id` table must ship its RLS policy and runtime-role test in the same migration.
