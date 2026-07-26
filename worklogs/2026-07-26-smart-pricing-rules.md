# 2026-07-26 — Smart pricing rules

**Goal:** Let managers configure pricing once for the venue, override only exceptional courts, and retain a safe default without weakening booking snapshots.

**Changed:** Added venue-wide pricing CRUD and UI scope switching; added tenant default hourly pricing in JSONB settings; centralized overlap validation/writes in `PricingRuleService`; serialized same-scope writes with PostgreSQL advisory locks; added time/value validation; exposed resolved half-hour prices on the manager calendar; redesigned opening rules as a full-width weekly operations timeline with separate effective-period cards; updated readiness and tests.

**Decisions:** Resolution order is court-specific rule → venue-wide rule → default hourly price. Same-priority overlaps in the same scope are rejected; higher-priority overlaps are intentional peak-price overrides. Booking still snapshots the resolved integer VND price at hold time. Pricing rules/defaults are cached only for the current service/request lifecycle.

**Next:** Browser-check the pricing tabs, venue default price input, and calendar price labels at desktop/mobile widths. Full suite has 209 passes; only the two pre-existing `ResourceCategoryTest` migration-backfill assertions fail.
