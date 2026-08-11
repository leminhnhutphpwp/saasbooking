<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\HoldStatus;
use App\Enums\PaymentMode;
use App\Models\Blackout;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\OpeningRule;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'owner', 'guard_name' => 'web']);
    }

    public function test_calendar_exposes_resolved_half_hour_prices(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21&duration=60')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('availability')
                ->where('duration', 60));
    }

    public function test_calendar_tenant_isolation(): void
    {
        $tenantA = Tenant::create([
            'name' => 'Venue A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $tenantB = Tenant::create([
            'name' => 'Venue B', 'slug' => 'venue-b', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $ownerA = User::factory()->create(['tenant_id' => $tenantA->id]);
        $ownerA->assignRole('owner');
        $ownerB = User::factory()->create(['tenant_id' => $tenantB->id]);
        $ownerB->assignRole('owner');

        $courtA = Court::create(['tenant_id' => $tenantA->id, 'name' => 'Sân A', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenantA->id, 'court_id' => $courtA->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenantA->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($ownerA)
            ->get('/manager/calendar?date=2026-07-21')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('courts', 1)
                ->where('courts.0.uuid', $courtA->uuid));
    }

    public function test_calendar_opening_window_aware_availability(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '08:00:00', 'close_local' => '20:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '08:00:00', 'end_local' => '20:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21&duration=60')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('availability')
                ->where('availability.'.$court->uuid.'.opening_windows.0.open', '08:00:00')
                ->where('availability.'.$court->uuid.'.opening_windows.0.close', '20:00:00'));
    }

    public function test_calendar_blackout_subtraction(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        Blackout::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id,
            'starts_at' => '2026-07-21 10:00:00', 'ends_at' => '2026-07-21 12:00:00',
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21&duration=60')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('availability')
                ->has('availability.'.$court->uuid.'.free_intervals'));
    }

    public function test_calendar_held_committed_slot_exclusion(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $customer = Customer::create(['tenant_id' => $tenant->id, 'name' => 'Test', 'phone' => '0901234567']);
        $booking = Booking::forceCreate([
            'tenant_id' => $tenant->id, 'code' => 'TEST-001', 'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed, 'channel' => BookingChannel::OwnerManual,
            'payment_mode' => PaymentMode::Cash, 'total_amount' => 60000, 'deposit_amount' => 0,
            'cancel_policy_snapshot' => ['type' => 'none'],
        ]);
        BookingSlot::create([
            'tenant_id' => $tenant->id, 'booking_id' => $booking->id, 'court_id' => $court->id,
            'start_at' => '2026-07-21 14:00:00', 'end_at' => '2026-07-21 15:00:00',
            'price_snapshot' => 60000, 'hold_status' => HoldStatus::Committed,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21&duration=60')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('availability')
                ->has('availability.'.$court->uuid.'.booked_slots', 1)
                ->where('availability.'.$court->uuid.'.booked_slots.0.start', '14:00')
                ->where('availability.'.$court->uuid.'.booked_slots.0.end', '15:00'));
    }

    public function test_calendar_duration_constraint(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21&duration=90')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->where('duration', 90)
                ->has('availability')
                ->has('availability.'.$court->uuid.'.free_intervals'));
    }

    public function test_calendar_booking_uuid_prop(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $customer = Customer::create(['tenant_id' => $tenant->id, 'name' => 'Test Customer', 'phone' => '0901234567']);
        $booking = Booking::forceCreate([
            'tenant_id' => $tenant->id, 'code' => 'TEST-002', 'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed, 'channel' => BookingChannel::OwnerManual,
            'payment_mode' => PaymentMode::Cash, 'total_amount' => 60000, 'deposit_amount' => 0,
            'cancel_policy_snapshot' => ['type' => 'none'],
        ]);
        BookingSlot::create([
            'tenant_id' => $tenant->id, 'booking_id' => $booking->id, 'court_id' => $court->id,
            'start_at' => '2026-07-21 10:00:00', 'end_at' => '2026-07-21 11:00:00',
            'price_snapshot' => 60000, 'hold_status' => HoldStatus::Committed,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('availability.'.$court->uuid.'.booked_slots', 1)
                ->where('availability.'.$court->uuid.'.booked_slots.0.uuid', $booking->uuid)
                ->where('availability.'.$court->uuid.'.booked_slots.0.customer', 'Test Customer')
                ->where('availability.'.$court->uuid.'.booked_slots.0.status', 'confirmed')
                ->where('availability.'.$court->uuid.'.booked_slots.0.code', 'TEST-002')
                ->where('availability.'.$court->uuid.'.booked_slots.0.amount', 60000)
                ->where('availability.'.$court->uuid.'.booked_slots.0.channel', 'owner_manual'));
    }

    public function test_calendar_resolved_pricing(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $tenant->id, 'court_id' => $court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00:00', 'close_local' => '23:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
        ]);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 80_000, 'priority' => 0,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21&duration=60')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->has('availability')
                ->has('availability.'.$court->uuid.'.free_intervals')
                ->where('availability.'.$court->uuid.'.free_intervals.0.price', 80000));
    }
}
