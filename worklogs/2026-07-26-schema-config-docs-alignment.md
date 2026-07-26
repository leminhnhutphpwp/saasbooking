# 2026-07-26 — Schema, config, and architecture docs alignment

**Goal:** Align notification tenant isolation, PostgreSQL/Zalo configuration examples, and architecture docs with the deployed schema.
**Changed:** Added an alter migration for tenant-scoped notification foreign keys, scoped reminder dedupe by tenant, added PostgreSQL regressions, corrected config examples and confirmed stale schema names/fields in `docs/05`, `docs/06`, and the worklog index.
**Decisions:** Kept the deployed notification create migration and `UNIQUE (booking_id, template)` immutable. The parent tables have `UNIQUE (tenant_id, id)`, nullable references are valid under PostgreSQL `MATCH SIMPLE`, and deployed data has no invalid tenant references.
**Next:** Apply `2026_07_26_210000_add_tenant_foreign_keys_to_notification_messages` in each deployed environment after checking for invalid tenant references.
