<?php

declare(strict_types=1);

namespace Tests\Feature\Catalog;

use App\Models\Court;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Services\Catalog\PricingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private PricingService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new PricingService;
    }

    private function tenant(): Tenant
    {
        return Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
    }

    private function court(Tenant $t): Court
    {
        return Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
    }

    private function rule(Tenant $t, ?int $courtId, string $start, string $end, int $perHour, int $priority): void
    {
        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => $courtId,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => $start,
            'end_local' => $end,
            'price_per_hour' => $perHour,
            'priority' => $priority,
        ]);
    }

    public function test_peak_rule_overrides_offpeak_by_priority(): void
    {
        $t = $this->tenant();
        $c = $this->court($t);
        $this->rule($t, null, '06:00:00', '23:00:00', 60_000, 0);   // off-peak all day
        $this->rule($t, null, '17:00:00', '22:00:00', 120_000, 10); // peak evening

        $evening = CarbonImmutable::parse('2026-07-21 19:00:00');
        $this->assertSame(120_000, $this->svc->resolve($t->id, $c->id, $evening, $evening->addHour()));

        $morning = CarbonImmutable::parse('2026-07-21 09:00:00');
        $this->assertSame(60_000, $this->svc->resolve($t->id, $c->id, $morning, $morning->addHour()));
    }

    public function test_court_specific_rule_beats_venue_wide(): void
    {
        $t = $this->tenant();
        $c = $this->court($t);
        $this->rule($t, null, '06:00:00', '23:00:00', 60_000, 50);  // venue-wide, high priority
        $this->rule($t, $c->id, '06:00:00', '23:00:00', 80_000, 0);  // court-specific, low priority

        $slot = CarbonImmutable::parse('2026-07-21 10:00:00');
        $this->assertSame(80_000, $this->svc->resolve($t->id, $c->id, $slot, $slot->addHour()));
    }

    public function test_price_prorates_by_duration(): void
    {
        $t = $this->tenant();
        $c = $this->court($t);
        $this->rule($t, null, '06:00:00', '23:00:00', 60_000, 0);

        $slot = CarbonImmutable::parse('2026-07-21 10:00:00');
        $this->assertSame(30_000, $this->svc->resolve($t->id, $c->id, $slot, $slot->addMinutes(30)));
    }
}
