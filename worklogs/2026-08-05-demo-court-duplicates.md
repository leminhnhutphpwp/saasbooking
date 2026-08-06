# 2026-08-05 - Demo court duplicates

**Goal:** Remove repeated demo courts from the manager calendar and prevent future duplicate seeds.
**Changed:** Added a repeat-seed regression test and natural-key lookup in `DemoSeeder`; removed duplicate demo court ids 11-14 and 22-25 from the development database.
**Decisions:** Retained ids 1-4 because they own all current booking slots. Deleted only duplicate rows with no booking, blackout, pricing-rule, or recurring-series dependencies; opening rules cascade with their court.
**Next:** Calendar popup now shows only Sân A-D; no database reset was used.
