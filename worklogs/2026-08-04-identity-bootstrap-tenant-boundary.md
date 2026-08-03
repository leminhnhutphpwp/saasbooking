# 2026-08-04 - Identity bootstrap tenant boundary

**Goal:** Close stale primary-tenant access after membership revocation without applying RLS before tenant context exists.
**Changed:** Added a PostgreSQL membership-delete trigger, identity-boundary regressions, and the operational boundary documentation.
**Decisions:** Keep `users.tenant_id` as the documented legacy primary/fallback to preserve manager behavior; revoke it atomically when its membership is removed. Identity/bootstrap tables remain outside tenant RLS because they establish `WorkingTenant` first.
**Next:** Apply the migration with the normal migrator deployment path.
