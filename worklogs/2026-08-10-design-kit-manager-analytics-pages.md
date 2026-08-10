# 2026-08-10 - Design-kit manager analytics pages

**Goal:** Migrate the scoped Manager analytics, customer, refund, and reconciliation pages to the canonical design kit without changing Inertia behavior.

**Changed:** `Pages/Manager/{Home,Reports,Customers,Refunds,Reconcile}` and `tasks/T49-design-kit-manager-analytics-pages.md`.

**Decisions:** Kept existing routes, forms, props, and real-data chart series; chart bars now use turf hierarchy, hatching, compact Vietnamese scales, and accessible value summaries. Mobile tables remain semantic tables on desktop and reflow into token-backed record lists below the small breakpoint.

**Next:** Browser QA remains blocked because no CDP endpoint is reachable at `http://127.0.0.1:9222`; verify the scoped pages at desktop and 360px once one is available.

**Verification:** `git diff --check` passed; `docker compose exec -T vite npm run build` passed (Vite deprecation warnings only); `docker compose exec -T app php artisan test --filter=Manager` passed (62 tests, 184 assertions).
