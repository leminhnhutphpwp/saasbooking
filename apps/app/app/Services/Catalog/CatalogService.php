<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\OpeningRule;
use Carbon\CarbonImmutable;

/**
 * Read-side of the catalog: the opening windows for a court on a given date, from the
 * versioned opening rules (local time + tz). Blackout subtraction happens in the availability
 * layer (M3, docs/07). Nothing here mutates inventory.
 */
class CatalogService
{
    /**
     * @return array<int, array{open: string, close: string, tz: string}>
     */
    public function openingWindows(int $tenantId, int $courtId, CarbonImmutable $date): array
    {
        $weekday = $date->dayOfWeekIso;
        $day = $date->toDateString();

        return OpeningRule::query()
            ->where('tenant_id', $tenantId)
            ->where('court_id', $courtId)
            ->whereDate('effective_from', '<=', $day)
            ->where(fn ($q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $day))
            ->get()
            ->filter(fn (OpeningRule $r) => in_array($weekday, $r->weekday, true))
            ->map(fn (OpeningRule $r) => [
                'open' => $r->open_local,
                'close' => $r->close_local,
                'tz' => $r->tz,
            ])
            ->values()
            ->all();
    }
}
