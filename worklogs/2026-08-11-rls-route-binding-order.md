# 2026-08-11 - RLS route binding order

**Goal:** Restore canonical court action URLs while retaining runtime PostgreSQL RLS isolation.
**Changed:** Prioritized `ResolveWorkingTenant` and `ApplyRlsTenantContext` ahead of Laravel `SubstituteBindings`; added a database-migrated HTTP feature test for opening and pricing pages under the runtime role, including foreign-court denial.
**Decisions:** Kept authentication ahead of tenant resolution, left RLS policies intact, and retained existing controller-level 403 responses for a resolved foreign court.
**Next:** Review T59 with the related canonical URL work in T58.
