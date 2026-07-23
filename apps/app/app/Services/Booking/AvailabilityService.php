<?php

declare(strict_types=1);

namespace App\Services\Booking;

use App\Enums\CourtStatus;
use App\Enums\HoldStatus;
use App\Models\Blackout;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Services\Catalog\CatalogService;
use Carbon\CarbonImmutable;

/**
 * Compute-on-read availability across all courts: opening windows − blackouts − held/committed
 * slots. Nothing is materialised (docs/11 #4); correctness of the actual hold is guaranteed by
 * the exclusion constraint at write time — this read only needs to be near-accurate (cache 30–60s).
 */
class AvailabilityService
{
    public function __construct(private CatalogService $catalog) {}

    /**
     * @return array<int, array{court_id:int, court_uuid:string, court_name:string,
     *   free: array<int, array{start:string, end:string}>}>
     */
    public function search(int $tenantId, CarbonImmutable $date, ?string $courtType = null, ?int $durationMin = null): array
    {
        return Court::forTenant($tenantId)
            ->where('status', CourtStatus::Active)
            ->when($courtType, fn ($q) => $q->where('court_type', $courtType))
            ->orderBy('name')
            ->get()
            ->map(function (Court $court) use ($tenantId, $date, $durationMin) {
                $free = $this->freeIntervals($tenantId, $court, $date);
                if ($durationMin) {
                    $free = $this->cutIntoSlots($free, $durationMin);
                }

                return [
                    'court_id' => $court->id,
                    'court_uuid' => $court->uuid,
                    'court_name' => $court->name,
                    'free' => array_map(fn (array $i) => [
                        'start' => $i['start']->toIso8601String(),
                        'end' => $i['end']->toIso8601String(),
                    ], $free),
                ];
            })
            ->all();
    }

    /** @return array<int, array{start:CarbonImmutable, end:CarbonImmutable}> */
    private function freeIntervals(int $tenantId, Court $court, CarbonImmutable $date): array
    {
        // Wall-as-UTC convention (single-tz Phase 1): booking_slots store the venue wall-clock digits
        // with no offset (Laravel formats without one). Parse opening windows NAIVELY the same way so
        // both sides align; the exclusion constraint guarantees the write. Real multi-tz handling is a
        // later concern (docs/11 #3).
        $open = [];
        foreach ($this->catalog->openingWindows($tenantId, $court->id, $date) as $w) {
            $open[] = [
                'start' => CarbonImmutable::parse($date->toDateString().' '.$w['open']),
                'end' => CarbonImmutable::parse($date->toDateString().' '.$w['close']),
            ];
        }
        if ($open === []) {
            return [];
        }

        return $this->subtract($open, $this->busyIntervals($tenantId, $court, $open));
    }

    /** @return array<int, array{start:CarbonImmutable, end:CarbonImmutable}> */
    private function busyIntervals(int $tenantId, Court $court, array $open): array
    {
        $dayStart = $open[0]['start'];
        $dayEnd = $open[0]['end'];
        foreach ($open as $o) {
            $dayStart = $o['start']->lessThan($dayStart) ? $o['start'] : $dayStart;
            $dayEnd = $o['end']->greaterThan($dayEnd) ? $o['end'] : $dayEnd;
        }

        $busy = [];

        $slots = BookingSlot::query()
            ->where('tenant_id', $tenantId)
            ->where('court_id', $court->id)
            ->whereIn('hold_status', [HoldStatus::Holding->value, HoldStatus::Committed->value])
            ->where('start_at', '<', $dayEnd)
            ->where('end_at', '>', $dayStart)
            ->get();
        foreach ($slots as $s) {
            $busy[] = ['start' => $s->start_at->toImmutable(), 'end' => $s->end_at->toImmutable()];
        }

        $blackouts = Blackout::query()
            ->where('tenant_id', $tenantId)
            ->where(fn ($q) => $q->where('court_id', $court->id)->orWhereNull('court_id'))
            ->where('starts_at', '<', $dayEnd)
            ->where('ends_at', '>', $dayStart)
            ->get();
        foreach ($blackouts as $b) {
            $busy[] = ['start' => $b->starts_at->toImmutable(), 'end' => $b->ends_at->toImmutable()];
        }

        return $busy;
    }

    /**
     * Subtract busy intervals from open intervals.
     *
     * @return array<int, array{start:CarbonImmutable, end:CarbonImmutable}>
     */
    private function subtract(array $opens, array $busy): array
    {
        $free = [];

        foreach ($opens as $open) {
            $segments = [$open];
            foreach ($busy as $b) {
                $next = [];
                foreach ($segments as $seg) {
                    if ($b['end']->lessThanOrEqualTo($seg['start']) || $b['start']->greaterThanOrEqualTo($seg['end'])) {
                        $next[] = $seg;

                        continue;
                    }
                    if ($b['start']->greaterThan($seg['start'])) {
                        $next[] = ['start' => $seg['start'], 'end' => $b['start']];
                    }
                    if ($b['end']->lessThan($seg['end'])) {
                        $next[] = ['start' => $b['end'], 'end' => $seg['end']];
                    }
                }
                $segments = $next;
            }
            foreach ($segments as $seg) {
                if ($seg['end']->greaterThan($seg['start'])) {
                    $free[] = $seg;
                }
            }
        }

        return $free;
    }

    /** @return array<int, array{start:CarbonImmutable, end:CarbonImmutable}> */
    private function cutIntoSlots(array $free, int $durationMin): array
    {
        $slots = [];
        foreach ($free as $iv) {
            for ($cursor = $iv['start']; $cursor->addMinutes($durationMin)->lessThanOrEqualTo($iv['end']); $cursor = $cursor->addMinutes($durationMin)) {
                $slots[] = ['start' => $cursor, 'end' => $cursor->addMinutes($durationMin)];
            }
        }

        return $slots;
    }
}
