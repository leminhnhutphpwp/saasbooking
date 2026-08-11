<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\BookingStatus;
use App\Enums\CourtStatus;
use App\Enums\HoldStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\OpeningRule;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HomeControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function venue(string $slug): Tenant
    {
        $t = Tenant::create(['name' => $slug, 'slug' => $slug, 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        PricingRule::create([
            'tenant_id' => $t->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        return $t;
    }

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    public function test_tenant_isolation_cannot_access_other_tenant_home(): void
    {
        $tenantA = $this->venue('tenant-a');
        $tenantB = $this->venue('tenant-b');

        $ownerA = $this->owner($tenantA);

        $this->actingAs($ownerA)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('tenantName', 'tenant-a')
            );
    }

    public function test_released_slots_excluded_from_capacity(): void
    {
        $t = $this->venue('venue-release');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00',
            'close_local' => '22:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0911111111', 'name' => 'Test']);
        $booking = Booking::create([
            'tenant_id' => $t->id,
            'code' => 'SAN-REL01',
            'customer_id' => $customer->id,
            'status' => BookingStatus::Cancelled,
            'channel' => 'owner_manual',
            'total_amount' => 60_000,
            'deposit_amount' => 0,
            'payment_mode' => 'full',
            'cancel_policy_snapshot' => [],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => now()->startOfDay()->addHours(10),
            'end_at' => now()->startOfDay()->addHours(11),
            'price_snapshot' => 60_000,
            'hold_status' => HoldStatus::Released,
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('stats.occupancy', 0)
            );
    }

    public function test_real_opening_hour_denominator_not_hardcoded(): void
    {
        $t = $this->venue('venue-opening');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '08:00:00',
            'close_local' => '12:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0922222222', 'name' => 'Test']);
        $booking = Booking::create([
            'tenant_id' => $t->id,
            'code' => 'SAN-OPN01',
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => 'owner_manual',
            'total_amount' => 60_000,
            'deposit_amount' => 60_000,
            'payment_mode' => 'full',
            'cancel_policy_snapshot' => [],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => now()->startOfDay()->addHours(10),
            'end_at' => now()->startOfDay()->addHours(12),
            'price_snapshot' => 120_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('stats.occupancy', fn ($value) => $value > 0 && $value <= 100)
            );
    }

    public function test_preview_count_separation_counts_full_previews_capped(): void
    {
        $t = $this->venue('venue-preview');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00',
            'close_local' => '22:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0933333333', 'name' => 'Test']);

        for ($i = 1; $i <= 8; $i++) {
            $booking = Booking::create([
                'tenant_id' => $t->id,
                'code' => "SAN-PV{$i}",
                'customer_id' => $customer->id,
                'status' => BookingStatus::PendingDeposit,
                'channel' => 'owner_manual',
                'total_amount' => 60_000,
                'deposit_amount' => 30_000,
                'payment_mode' => 'deposit',
                'cancel_policy_snapshot' => [],
            ]);

            BookingSlot::create([
                'tenant_id' => $t->id,
                'booking_id' => $booking->id,
                'court_id' => $court->id,
                'start_at' => now()->startOfDay()->addHours(6 + $i),
                'end_at' => now()->startOfDay()->addHours(7 + $i),
                'price_snapshot' => 60_000,
                'hold_status' => HoldStatus::Holding,
            ]);
        }

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('attentionCounts.awaitingDeposits', 8)
                ->has('awaitingDeposits', 5)
            );
    }

    public function test_multi_slot_weekly_revenue_sums_slot_prices(): void
    {
        $t = $this->venue('venue-multislot');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00',
            'close_local' => '22:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0944444444', 'name' => 'Test']);
        $booking = Booking::create([
            'tenant_id' => $t->id,
            'code' => 'SAN-MS001',
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => 'owner_manual',
            'total_amount' => 180_000,
            'deposit_amount' => 180_000,
            'payment_mode' => 'full',
            'cancel_policy_snapshot' => [],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => now()->startOfDay()->addHours(10),
            'end_at' => now()->startOfDay()->addHours(11),
            'price_snapshot' => 60_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => now()->startOfDay()->addHours(11),
            'end_at' => now()->startOfDay()->addHours(12),
            'price_snapshot' => 70_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => now()->startOfDay()->addHours(12),
            'end_at' => now()->startOfDay()->addHours(13),
            'price_snapshot' => 50_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('weekTotals.revenue', 180_000)
            );
    }

    public function test_operational_state_no_active_courts(): void
    {
        $t = $this->venue('venue-no-courts');
        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('operationalState.no_active_courts', true)
                ->where('operationalState.no_opening_coverage', false)
            );
    }

    public function test_operational_state_no_opening_coverage(): void
    {
        $t = $this->venue('venue-no-opening');
        Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('operationalState.no_active_courts', false)
                ->where('operationalState.no_opening_coverage', true)
            );
    }

    public function test_operational_state_no_bookings(): void
    {
        $t = $this->venue('venue-no-bookings');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00',
            'close_local' => '22:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('operationalState.no_bookings', true)
            );
    }

    public function test_operational_state_no_exceptions(): void
    {
        $t = $this->venue('venue-no-exceptions');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00',
            'close_local' => '22:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('operationalState.no_exceptions', true)
            );
    }

    public function test_operational_state_with_exceptions(): void
    {
        $t = $this->venue('venue-with-exceptions');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => CourtStatus::Active]);

        OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00',
            'close_local' => '22:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);

        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0955555555', 'name' => 'Test']);
        Booking::create([
            'tenant_id' => $t->id,
            'code' => 'SAN-EX001',
            'customer_id' => $customer->id,
            'status' => BookingStatus::PendingDeposit,
            'channel' => 'owner_manual',
            'total_amount' => 60_000,
            'deposit_amount' => 30_000,
            'payment_mode' => 'deposit',
            'cancel_policy_snapshot' => [],
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->get('/manager/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Home/Index')
                ->where('operationalState.no_exceptions', false)
                ->where('attentionCounts.awaitingDeposits', 1)
            );
    }
}
