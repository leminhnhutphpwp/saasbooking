# 2026-08-05 - Customer profile RLS route

**Goal:** Fix the booking-detail customer profile link returning 404 under the runtime RLS role.
**Changed:** Replaced implicit customer binding in show/update with controller-side UUID resolution after RLS context.
**Decisions:** Kept WorkingTenant ownership checks and changed both routes to prevent the same middleware-order failure during profile updates.
**Next:** Browser verified the profile link now opens Trần Thị B; change remains uncommitted pending approval.
