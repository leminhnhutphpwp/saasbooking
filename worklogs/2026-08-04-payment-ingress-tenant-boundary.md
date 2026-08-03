# 2026-08-04 - Payment ingress tenant boundary

**Goal:** close the remaining payment-table RLS exception without weakening authenticated webhook account resolution.

**Changed:** enabled runtime-role RLS for tenant bank configuration and attributed inbox rows, added a single-purpose account-to-tenant resolver, persisted attribution at inbox insert, and added tenant-paired payment/config/inbox constraints and runtime-role coverage.

**Decisions:** identity, queue, cache, and global catalog tables remain context-less/bootstrap exceptions. The resolver is the sole justified payment ingress exception because recipient account resolution must precede verified tenant context; it returns only a tenant ID and is not a general table grant.

**Next:** deploy the migration through the migrator connection and run the updated runtime-role SQL and webhook smoke checks.
