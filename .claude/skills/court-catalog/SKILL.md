---
name: court-catalog
description: Court catalog — pricing rules, opening rules, blackouts, court types, and how to extend them
---

# Court Catalog — SÂN

Manages what is sold (courts) and when/how much it costs (opening rules, blackouts, pricing rules). The catalog is the *reference data* that the booking engine reads at hold time and snapshots.

## Tables owned

| Table | Purpose | Key columns |
|---|---|---|
| `courts` | Venue's courts | `tenant_id`, `court_type`, `name`, `status` |
| `opening_rules` | When courts are available per weekday | `weekday[]`, `open_local`, `close_local`, `court_id` (nullable = venue-wide) |
| `blackouts` | Days/hours a court is unavailable | `starts_at`, `ends_at`, `court_id` (nullable = venue-wide) |
| `pricing_rules` | Hourly price by day-of-week + time window | `weekday[]`, `start_local`, `end_local`, `price_per_hour`, `priority`, `court_id` (nullable = venue-wide) |

All tables are tenant-scoped (`tenant_id` on every row). A `court_id` of `NULL` means the rule applies venue-wide (fallback).

## PricingService — how price is resolved

```php
PricingService::resolve(int $tenantId, int $courtId, CarbonInterface $startAt, CarbonInterface $endAt): int
// Returns: integer VND for the entire [startAt, endAt) slot
```

### Resolution algorithm

1. Load all `pricing_rules` for the tenant.
2. Filter: `weekday` contains `$startAt->dayOfWeekIso` AND `start_local <= slot_start < end_local`.
3. Sort by precedence (deterministic):
   - Court-specific beats venue-wide (`court_id IS NOT NULL` > `NULL`)
   - Higher `priority` wins
   - Higher `id` wins as tiebreaker (most-recent rule)
4. First match = winner. No match → `RuntimeException` (invariant: pricing rules MUST cover full opening hours).
5. Price = `round($rule->price_per_hour * $minutes / 60)`.

### Why price can be 0 (and how to prevent)

If `pricing_rules.end_local` < `opening_rules.close_local`, the trailing gap gets no rule match → `price = 0` → "Từ 0 vnđ" bug.

**Fix:** ensure `pricing_rules.end_local` >= `opening_rules.close_local` for every weekday. DemoSeeder seeds pricing rules covering 06:00–23:00.

### Court-specific vs venue-wide

```php
// Venue-wide rule (applies to all courts)
PricingRule::forceCreate([
    'court_id' => null,
    'weekday' => [1,2,3,4,5,6,7],
    'start_local' => '06:00:00',
    'end_local' => '17:00:00',
    'price_per_hour' => 80000,
    'priority' => 0,
]);

// Court-specific rule (overrides venue-wide for one court)
PricingRule::forceCreate([
    'court_id' => $courtId,
    'weekday' => [6,7], // weekend only
    'start_local' => '17:00:00',
    'end_local' => '23:00:00',
    'price_per_hour' => 120000,
    'priority' => 1, // higher than venue-wide
]);
```

## OpeningRules — when courts are available

```php
CatalogService::openingWindows(int $tenantId, int $courtId, CarbonImmutable $date): array
// Returns: [['open' => '06:00', 'close' => '23:00'], ...]
```

- Each rule covers one weekday with `open_local` / `close_local`.
- Multiple windows per day are allowed (e.g. morning + evening sessions).
- `court_id = null` → venue-wide fallback; `court_id` set → court-specific override.

## Blackouts — temporary unavailability

```php
Blackout::forceCreate([
    'tenant_id' => $tenantId,
    'court_id' => $courtId, // null = venue-wide
    'starts_at' => '2026-01-01 00:00:00',
    'ends_at' => '2026-01-02 23:59:59',
]);
```

Blackouts are subtracted from opening windows in `AvailabilityService::busyIntervals()`.

## Court types — extending for new sports

The `CourtType` PHP enum (`app/Enums/CourtType.php`) determines court type. Adding a new sport is a **config-only change**:

```php
// app/Enums/CourtType.php
enum CourtType: string
{
    case CauLong = 'cau_long';
    case Pickleball = 'pickleball';
    case Tennis = 'tennis';       // add new case
    case Khac = 'khac';
}
```

Then seed `pricing_rules` and `opening_rules` for the new type. **No schema change, no code change in the booking engine.**

## Multi-vertical note

Court type is a **label + pricing** differentiator only. It does NOT change the inventory engine. All racket sports (`cau_long`, `pickleball`, `tennis`, `futsal`) use `resource_time_slot` mode via `racket_court` vertical. See `vertical-dispatch` skill for how verticals select drivers.

## When to use

- Adding a new court type (sport) → add enum case + seed rules.
- Changing pricing logic → modify `PricingService::resolve()`.
- Debugging "price is 0" → check pricing_rules cover full opening hours.
- Adding opening hours for a new venue → seed `opening_rules`.

## Related docs

- `docs/08-thiet-ke-module-chi-tiet.md` §2 — court-catalog module design
- `docs/06-erd.md` — `courts`, `pricing_rules`, `opening_rules`, `blackouts` schema
- `docs/09-kien-truc-mo-rong.md` — adding new court types = config-only
