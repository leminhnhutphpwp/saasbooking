<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\PricingRule;
use App\Services\Tenant\VenueSettingsService;
use App\Support\Messages;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Resolves the price for a slot from the tenant's pricing rules (peak / off-peak).
 * Precedence: court-specific rule, venue-wide rule, then the tenant's default hourly price.
 *
 * The caller (BookingService) SNAPSHOTs this value onto the booking at creation — historical
 * bookings never re-read live pricing (docs/11 #1).
 */
class PricingService
{
    /** @var array<string, Collection<int, PricingRule>> */
    private array $rulesByCourt = [];

    public function __construct(private VenueSettingsService $venueSettings) {}

    /** @return int price in integer VND for the whole [$startAt, $endAt) slot */
    public function resolve(int $tenantId, int $courtId, CarbonInterface $startAt, CarbonInterface $endAt): int
    {
        $weekday = $startAt->dayOfWeekIso;           // 1..7
        $time = $startAt->format('H:i:s');           // local slot start

        $cacheKey = "{$tenantId}:{$courtId}";
        $rules = $this->rulesByCourt[$cacheKey] ??= PricingRule::query()
            ->where('tenant_id', $tenantId)
            ->where(fn ($query) => $query->where('court_id', $courtId)->orWhereNull('court_id'))
            ->get();

        $rule = $rules
            ->filter(fn (PricingRule $r) => in_array($weekday, $r->weekday, true)
                && $time >= $r->start_local
                && $time < $r->end_local)
            // Deterministic precedence (stable across deploys / DB row order):
            // 1) court-specific always outranks venue-wide, 2) higher priority,
            // 3) most-recent rule (higher id) as a tiebreaker so equal-priority
            //    overlaps never flip nondeterministically. Slot is priced by its
            //    START time (docs/11) — that policy is unchanged.
            ->sort(fn (PricingRule $a, PricingRule $b) => [
                $b->court_id !== null ? 1 : 0, $b->priority, $b->id,
            ] <=> [
                $a->court_id !== null ? 1 : 0, $a->priority, $a->id,
            ])
            ->first();

        if (! $rule) {
            $pricePerHour = $this->venueSettings->defaultPricePerHour($tenantId);
            if ($pricePerHour === null) {
                throw new RuntimeException(Messages::get('pricing_service', 'no_rule', ['time' => $startAt->toDateTimeString()]));
            }
        } else {
            $pricePerHour = $rule->price_per_hour;
        }

        $minutes = (int) round(abs($startAt->diffInMinutes($endAt)));

        return intdiv(($pricePerHour * $minutes) + 30, 60);
    }
}
