<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\OpeningRule;
use App\Models\Tenant;
use App\Services\Booking\AvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private string $tz = 'Asia/Ho_Chi_Minh';

    public function test_free_intervals_exclude_committed_slots(): void
    {
        $tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => $this->tz, 'status' => 'active']);
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $date = CarbonImmutable::parse('2026-07-21', $this->tz);

        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'open_local' => '18:00:00', 'close_local' => '22:00:00',
            'tz' => $this->tz, 'effective_from' => $date->subDay()->toDateString(), 'effective_to' => null,
        ]);

        // A confirmed booking holds 19:00–20:00.
        $customer = Customer::create(['tenant_id' => $tenant->id, 'phone' => '0900000004', 'name' => 'A']);
        $booking = Booking::create([
            'tenant_id' => $tenant->id, 'code' => 'SAN-AAAAA', 'customer_id' => $customer->id,
            'status' => 'confirmed', 'channel' => 'zalo', 'total_amount' => 0, 'deposit_amount' => 0,
            'payment_mode' => 'full', 'cancel_policy_snapshot' => [],
        ]);
        BookingSlot::create([
            'tenant_id' => $tenant->id, 'booking_id' => $booking->id, 'court_id' => $court->id,
            'start_at' => CarbonImmutable::parse('2026-07-21 19:00:00', $this->tz),
            'end_at' => CarbonImmutable::parse('2026-07-21 20:00:00', $this->tz),
            'price_snapshot' => 0, 'hold_status' => 'committed',
        ]);

        $result = app(AvailabilityService::class)->search($tenant->id, $date);

        $this->assertCount(1, $result);
        $free = $result[0]['free'];

        // 18:00–22:00 minus 19:00–20:00 → [18:00–19:00] + [20:00–22:00]
        $this->assertCount(2, $free);
        $this->assertStringContainsString('18:00:00', $free[0]['start']);
        $this->assertStringContainsString('19:00:00', $free[0]['end']);
        $this->assertStringContainsString('20:00:00', $free[1]['start']);
        $this->assertStringContainsString('22:00:00', $free[1]['end']);
    }

    public function test_duration_cut_produces_fixed_slots(): void
    {
        $tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => $this->tz, 'status' => 'active']);
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $date = CarbonImmutable::parse('2026-07-21', $this->tz);

        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'open_local' => '18:00:00', 'close_local' => '20:00:00',
            'tz' => $this->tz, 'effective_from' => $date->subDay()->toDateString(), 'effective_to' => null,
        ]);

        $result = app(AvailabilityService::class)->search($tenant->id, $date, null, 60);

        // 18–20 cut into 60' slots → 18–19, 19–20
        $this->assertCount(2, $result[0]['free']);
    }
}
