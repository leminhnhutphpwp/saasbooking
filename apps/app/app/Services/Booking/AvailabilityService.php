<?php

declare(strict_types=1);

namespace App\Services\Booking;

use App\Enums\CourtStatus;
use App\Enums\HoldStatus;
use App\Models\Blackout;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\OpeningRule;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;

/**
 * Compute-on-read availability across all courts: opening windows − blackouts − held/committed
 * slots. Nothing is materialised (docs/11 #4); correctness of the actual hold is guaranteed by
 * the exclusion constraint at write time — this read only needs to be near-accurate (cache 30–60s).
 */
class AvailabilityService
{
    /**
     * @return array<int, array{court_id:int, court_uuid:string, court_name:string,
     *   free: array<int, array{start:string, end:string}>}>
     */
    public function search(int $tenantId, CarbonImmutable $date, ?string $courtType = null, ?int $durationMin = null): array
    {
        $courts = Court::forTenant($tenantId)
            ->where('status', CourtStatus::Active)
            ->when($courtType, fn ($q) => $q->where('court_type', $courtType))
            ->orderBy('name')
            ->get();

        if ($courts->isEmpty()) {
            return [];
        }

        $courtIds = $courts->pluck('id')->all();
        $weekday = $date->dayOfWeekIso;
        $day = $date->toDateString();

        // One query for every court's opening rules (replaces one query per court).
        $rulesByCourt = OpeningRule::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('court_id', $courtIds)
            ->whereDate('effective_from', '<=', $day)
            ->where(fn ($q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $day))
            ->get()
            ->groupBy('court_id');

        // One query for every court's busy slots, date-bounded (replaces one query per court).
        $from = $date->startOfDay()->subDay();
        $to = $date->endOfDay()->addDay();
        $slotsByCourt = BookingSlot::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('court_id', $courtIds)
            ->whereIn('hold_status', [HoldStatus::Holding->value, HoldStatus::Committed->value])
            ->where('start_at', '<', $to)
            ->where('end_at', '>', $from)
            ->get()
            ->groupBy('court_id');

        // One query for blackouts (court-specific + venue-wide), date-bounded.
        $blackouts = Blackout::query()
            ->where('tenant_id', $tenantId)
            ->where(fn ($q) => $q->whereIn('court_id', $courtIds)->orWhereNull('court_id'))
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from)
            ->get();
        $venueBlackouts = $blackouts->whereNull('court_id');

        return $courts->map(function (Court $court) use ($date, $durationMin, $weekday, $rulesByCourt, $slotsByCourt, $blackouts, $venueBlackouts) {
            $windows = ($rulesByCourt->get($court->id) ?? new Collection)
                ->filter(fn (OpeningRule $r) => in_array($weekday, (array) $r->weekday, true))
                ->map(fn (OpeningRule $r) => ['open' => $r->open_local, 'close' => $r->close_local, 'tz' => $r->tz])
                ->values()
                ->all();

            $free = $this->freeIntervals(
                $date,
                $windows,
                $slotsByCourt->get($court->id, new Collection),
                $blackouts->where('court_id', $court->id)->concat($venueBlackouts),
            );

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
        })->all();
    }

    /** @return array<int, array{start:CarbonImmutable, end:CarbonImmutable}> */
    private function freeIntervals(CarbonImmutable $date, array $windows, Collection $slots, Collection $blackouts): array
    {
        // Wall-as-UTC convention (single-tz Phase 1): booking_slots store the venue wall-clock digits
        // with no offset (Laravel formats without one). Parse opening windows NAIVELY the same way so
        // both sides align; the exclusion constraint guarantees the write. Real multi-tz handling is a
        // later concern (docs/11 #3).
        $open = [];
        foreach ($windows as $w) {
            $open[] = [
                'start' => CarbonImmutable::parse($date->toDateString().' '.$w['open']),
                'end' => CarbonImmutable::parse($date->toDateString().' '.$w['close']),
            ];
        }
        if ($open === []) {
            return [];
        }

        return $this->subtract($open, $this->busyIntervals($open, $slots, $blackouts));
    }

    /** @return array<int, array{start:CarbonImmutable, end:CarbonImmutable}> */
    private function busyIntervals(array $open, Collection $slots, Collection $blackouts): array
    {
        $dayStart = $open[0]['start'];
        $dayEnd = $open[0]['end'];
        foreach ($open as $o) {
            $dayStart = $o['start']->lessThan($dayStart) ? $o['start'] : $dayStart;
            $dayEnd = $o['end']->greaterThan($dayEnd) ? $o['end'] : $dayEnd;
        }

        $busy = [];

        foreach ($slots as $s) {
            if ($s->start_at->greaterThanOrEqualTo($dayEnd) || $s->end_at->lessThanOrEqualTo($dayStart)) {
                continue;
            }
            $busy[] = ['start' => $s->start_at->toImmutable(), 'end' => $s->end_at->toImmutable()];
        }

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
