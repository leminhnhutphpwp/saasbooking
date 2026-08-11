<?php

declare(strict_types=1);

namespace App\Services\Reporting;

use App\Enums\BookingStatus;
use App\Enums\CourtStatus;
use App\Enums\HoldStatus;
use App\Models\Blackout;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Services\Catalog\CatalogService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class OperationalMetricsService
{
    public function __construct(private CatalogService $catalog) {}

    public function revenueByDay(int $tenantId, CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return BookingSlot::query()
            ->join('bookings', 'bookings.id', '=', 'booking_slots.booking_id')
            ->where('bookings.tenant_id', $tenantId)
            ->where('bookings.status', BookingStatus::Confirmed)
            ->where('booking_slots.start_at', '>=', $from)
            ->where('booking_slots.start_at', '<=', $to)
            ->selectRaw('DATE(booking_slots.start_at) as date, SUM(booking_slots.price_snapshot) as total')
            ->groupByRaw('DATE(booking_slots.start_at)')
            ->orderBy('date')
            ->get()
            ->keyBy('date')
            ->map(fn ($r) => (int) $r->total);
    }

    public function totalRevenue(int $tenantId, CarbonImmutable $from, CarbonImmutable $to): int
    {
        return (int) BookingSlot::query()
            ->join('bookings', 'bookings.id', '=', 'booking_slots.booking_id')
            ->where('bookings.tenant_id', $tenantId)
            ->where('bookings.status', BookingStatus::Confirmed)
            ->where('booking_slots.start_at', '>=', $from)
            ->where('booking_slots.start_at', '<=', $to)
            ->sum('booking_slots.price_snapshot');
    }

    public function occupancy(int $tenantId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $courts = Court::forTenant($tenantId)->where('status', CourtStatus::Active)->get();

        if ($courts->isEmpty()) {
            return ['rate' => 0, 'bookedMinutes' => 0, 'totalMinutes' => 0, 'coverage' => 'none'];
        }

        $totalMinutes = 0;
        $bookedMinutes = 0;
        $hasAnyOpening = false;

        $cursor = $from->startOfDay();
        $end = $to->startOfDay();

        while ($cursor->lessThanOrEqualTo($end)) {
            foreach ($courts as $court) {
                $windows = $this->catalog->openingWindows($tenantId, $court->id, $cursor);

                if ($windows === []) {
                    continue;
                }

                $hasAnyOpening = true;

                $openIntervals = [];
                foreach ($windows as $w) {
                    $openIntervals[] = [
                        'start' => CarbonImmutable::parse($cursor->toDateString().' '.$w['open']),
                        'end' => CarbonImmutable::parse($cursor->toDateString().' '.$w['close']),
                    ];
                }

                $dayStart = $openIntervals[0]['start'];
                $dayEnd = $openIntervals[0]['end'];
                foreach ($openIntervals as $o) {
                    if ($o['start']->lessThan($dayStart)) {
                        $dayStart = $o['start'];
                    }
                    if ($o['end']->greaterThan($dayEnd)) {
                        $dayEnd = $o['end'];
                    }
                }

                $blackouts = Blackout::query()
                    ->where('tenant_id', $tenantId)
                    ->where(fn ($q) => $q->where('court_id', $court->id)->orWhereNull('court_id'))
                    ->where('starts_at', '<', $dayEnd)
                    ->where('ends_at', '>', $dayStart)
                    ->get();

                $blackoutIntervals = [];
                foreach ($blackouts as $b) {
                    $blackoutIntervals[] = [
                        'start' => $b->starts_at->toImmutable(),
                        'end' => $b->ends_at->toImmutable(),
                    ];
                }

                $netOpen = $this->subtractIntervals($openIntervals, $blackoutIntervals);

                foreach ($netOpen as $iv) {
                    $totalMinutes += $iv['start']->diffInMinutes($iv['end']);
                }

                $slots = BookingSlot::query()
                    ->where('tenant_id', $tenantId)
                    ->where('court_id', $court->id)
                    ->where('hold_status', HoldStatus::Committed)
                    ->where('start_at', '<', $dayEnd)
                    ->where('end_at', '>', $dayStart)
                    ->get();

                foreach ($slots as $slot) {
                    $slotStart = $slot->start_at->toImmutable();
                    $slotEnd = $slot->end_at->toImmutable();

                    foreach ($netOpen as $iv) {
                        $clipStart = $slotStart->greaterThan($iv['start']) ? $slotStart : $iv['start'];
                        $clipEnd = $slotEnd->lessThan($iv['end']) ? $slotEnd : $iv['end'];

                        if ($clipEnd->greaterThan($clipStart)) {
                            $bookedMinutes += $clipStart->diffInMinutes($clipEnd);
                        }
                    }
                }
            }

            $cursor = $cursor->addDay();
        }

        $rate = $totalMinutes > 0 ? (int) round($bookedMinutes / $totalMinutes * 100) : 0;

        return [
            'rate' => $rate,
            'bookedMinutes' => (int) $bookedMinutes,
            'totalMinutes' => (int) $totalMinutes,
            'coverage' => $hasAnyOpening ? 'full' : 'none',
        ];
    }

    public function utilization(int $tenantId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $courts = Court::forTenant($tenantId)->where('status', CourtStatus::Active)->get();

        if ($courts->isEmpty()) {
            return ['hourly' => [], 'coverage' => 'none'];
        }

        $hourlyBooked = array_fill(0, 24, 0);
        $hourlyAvailable = array_fill(0, 24, 0);
        $hasAnyOpening = false;

        $cursor = $from->startOfDay();
        $end = $to->startOfDay();

        while ($cursor->lessThanOrEqualTo($end)) {
            foreach ($courts as $court) {
                $windows = $this->catalog->openingWindows($tenantId, $court->id, $cursor);

                if ($windows === []) {
                    continue;
                }

                $hasAnyOpening = true;

                $openIntervals = [];
                foreach ($windows as $w) {
                    $openIntervals[] = [
                        'start' => CarbonImmutable::parse($cursor->toDateString().' '.$w['open']),
                        'end' => CarbonImmutable::parse($cursor->toDateString().' '.$w['close']),
                    ];
                }

                $dayStart = $openIntervals[0]['start'];
                $dayEnd = $openIntervals[0]['end'];
                foreach ($openIntervals as $o) {
                    if ($o['start']->lessThan($dayStart)) {
                        $dayStart = $o['start'];
                    }
                    if ($o['end']->greaterThan($dayEnd)) {
                        $dayEnd = $o['end'];
                    }
                }

                $blackouts = Blackout::query()
                    ->where('tenant_id', $tenantId)
                    ->where(fn ($q) => $q->where('court_id', $court->id)->orWhereNull('court_id'))
                    ->where('starts_at', '<', $dayEnd)
                    ->where('ends_at', '>', $dayStart)
                    ->get();

                $blackoutIntervals = [];
                foreach ($blackouts as $b) {
                    $blackoutIntervals[] = [
                        'start' => $b->starts_at->toImmutable(),
                        'end' => $b->ends_at->toImmutable(),
                    ];
                }

                $netOpen = $this->subtractIntervals($openIntervals, $blackoutIntervals);

                foreach ($netOpen as $iv) {
                    $h = $iv['start']->hour;
                    $endH = $iv['end']->hour;
                    $endM = $iv['end']->minute;

                    if ($endM === 0 && $iv['end']->greaterThan($iv['start'])) {
                        $endH--;
                    }

                    for ($hour = $h; $hour <= min($endH, 23); $hour++) {
                        $hourStart = CarbonImmutable::parse($cursor->toDateString().' '.str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00:00');
                        $hourEnd = $hourStart->addHour();

                        $clipStart = $iv['start']->greaterThan($hourStart) ? $iv['start'] : $hourStart;
                        $clipEnd = $iv['end']->lessThan($hourEnd) ? $iv['end'] : $hourEnd;

                        if ($clipEnd->greaterThan($clipStart)) {
                            $hourlyAvailable[$hour] += $clipStart->diffInMinutes($clipEnd);
                        }
                    }
                }

                $slots = BookingSlot::query()
                    ->where('tenant_id', $tenantId)
                    ->where('court_id', $court->id)
                    ->where('hold_status', HoldStatus::Committed)
                    ->where('start_at', '<', $dayEnd)
                    ->where('end_at', '>', $dayStart)
                    ->get();

                foreach ($slots as $slot) {
                    $slotStart = $slot->start_at->toImmutable();
                    $slotEnd = $slot->end_at->toImmutable();

                    foreach ($netOpen as $iv) {
                        $clipStart = $slotStart->greaterThan($iv['start']) ? $slotStart : $iv['start'];
                        $clipEnd = $slotEnd->lessThan($iv['end']) ? $slotEnd : $iv['end'];

                        if (!$clipEnd->greaterThan($clipStart)) {
                            continue;
                        }

                        $h = $clipStart->hour;
                        $endH = $clipEnd->hour;
                        $endM = $clipEnd->minute;

                        if ($endM === 0 && $clipEnd->greaterThan($clipStart)) {
                            $endH--;
                        }

                        for ($hour = $h; $hour <= min($endH, 23); $hour++) {
                            $hourStart = CarbonImmutable::parse($cursor->toDateString().' '.str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00:00');
                            $hourEnd = $hourStart->addHour();

                            $hClipStart = $clipStart->greaterThan($hourStart) ? $clipStart : $hourStart;
                            $hClipEnd = $clipEnd->lessThan($hourEnd) ? $clipEnd : $hourEnd;

                            if ($hClipEnd->greaterThan($hClipStart)) {
                                $hourlyBooked[$hour] += $hClipStart->diffInMinutes($hClipEnd);
                            }
                        }
                    }
                }
            }

            $cursor = $cursor->addDay();
        }

        $hourly = [];
        for ($h = 0; $h < 24; $h++) {
            if ($hourlyAvailable[$h] > 0) {
                $hourly[] = [
                    'hour' => $h,
                    'bookedMinutes' => $hourlyBooked[$h],
                    'availableMinutes' => $hourlyAvailable[$h],
                    'rate' => (int) round($hourlyBooked[$h] / $hourlyAvailable[$h] * 100),
                ];
            }
        }

        return [
            'hourly' => $hourly,
            'coverage' => $hasAnyOpening ? 'full' : 'none',
        ];
    }

    /**
     * @param  array<int, array{start: CarbonImmutable, end: CarbonImmutable}>  $opens
     * @param  array<int, array{start: CarbonImmutable, end: CarbonImmutable}>  $busy
     * @return array<int, array{start: CarbonImmutable, end: CarbonImmutable}>
     */
    private function subtractIntervals(array $opens, array $busy): array
    {
        $result = [];

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
                    $result[] = $seg;
                }
            }
        }

        return $result;
    }
}
