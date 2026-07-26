# Service registration and multi-tenant memberships

**Goal:** Replace hardcoded business-service selection with a platform catalog and make every service registration create one isolated tenant.

**Changed:** Added `platform_services`, required `tenants.service_id`, and `memberships`; added two-step account/service registration; allowed one account to register multiple service-specific tenants; extended `WorkingTenant` and the manager topbar for membership-bound cookie switching; seeded Pickleball and Badminton services.

**Decisions:** Commercial service and inventory vertical are separate concepts. Pickleball and Badminton are separate services sharing `vertical_key=racket_court`. One tenant belongs to exactly one service. Billing fields are reserved data only; no billing or commission enforcement was added. Platform service administration remains backend/seeder-only.

**Verification:** Vite production build passed; Pint passed; 13 focused PostgreSQL tests passed with 30 assertions. Full suite reached 200/208 passing; remaining results are baseline failures from missing unmerged T29/T30 Inertia pages and two pre-existing ResourceCategory migration tests.

**Next:** Browser-check registration and mobile tenant switching, then review and merge `feat/service-registration`. A later task may remove the legacy `users.tenant_id` fallback after every access path uses memberships.
