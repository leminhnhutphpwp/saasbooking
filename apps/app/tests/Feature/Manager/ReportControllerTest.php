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
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReportControllerTest extends TestCase
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
        return Tenant::create([
            'name' => $slug,
            'slug' => $slug,
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
    }

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    private function court(Tenant $t, string $name = 'Sân 1'): Court
    {
        return Court::create([
            'tenant_id' => $t->id,
            'name' => $name,
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);
    }

    private function customer(Tenant $t, string $name = 'Khách A', string $phone = '0912345678'): Customer
    {
        return Customer::create([
            'tenant_id' => $t->id,
            'name' => $name,
            'phone' => $phone,
        ]);
    }

    private function openingRule(Tenant $t, Court $court, array $weekdays = [1, 2, 3, 4, 5, 6, 7], string $open = '06:00:00', string $close = '22:00:00'): OpeningRule
    {
        return OpeningRule::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'weekday' => $weekdays,
            'open_local' => $open,
            'close_local' => $close,
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-01-01',
            'effective_to' => null,
        ]);
    }

    private function createBookingWithSlots(Tenant $t, Court $court, Customer $customer, string $code, string $startAt, string $endAt, int $pricePerSlot, string $status = 'confirmed', string $holdStatus = 'committed'): Booking
    {
        $booking = Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $t->id,
            'code' => $code,
            'customer_id' => $customer->id,
            'status' => $status,
            'channel' => BookingChannel::OwnerManual,
            'total_amount' => $pricePerSlot,
            'deposit_amount' => $pricePerSlot,
            'payment_mode' => PaymentMode::Cash,
            'cancel_policy_snapshot' => [],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'price_snapshot' => $pricePerSlot,
            'hold_status' => $holdStatus,
        ]);

        return $booking;
    }

    public function test_tenant_isolation_revenue_only_shows_own_data(): void
    {
        $a = $this->venue('va');
        $b = $this->venue('vb');
        $courtA = $this->court($a);
        $courtB = $this->court($b);
        $customerA = $this->customer($a, 'A', '0911111111');
        $customerB = $this->customer($b, 'B', '0922222222');

        $this->createBookingWithSlots($a, $courtA, $customerA, 'SAN-A001', '2026-08-01 10:00:00', '2026-08-01 11:00:00', 100_000);
        $this->createBookingWithSlots($b, $courtB, $customerB, 'SAN-B001', '2026-08-01 10:00:00', '2026-08-01 11:00:00', 200_000);

        $response = $this->actingAs($this->owner($a))
            ->get('/manager/reports?from=2026-08-01&to=2026-08-01');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('summary.totalRevenue', 100_000)
        );
    }

    public function test_multi_slot_booking_revenue_uses_slot_prices_not_total(): void
    {
        $t = $this->venue('v1');
        $court = $this->court($t);
        $customer = $this->customer($t);

        $booking = Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $t->id,
            'code' => 'SAN-MULTI',
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => BookingChannel::OwnerManual,
            'total_amount' => 300_000,
            'deposit_amount' => 300_000,
            'payment_mode' => PaymentMode::Cash,
            'cancel_policy_snapshot' => [],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => '2026-08-01 10:00:00',
            'end_at' => '2026-08-01 11:00:00',
            'price_snapshot' => 60_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => '2026-08-01 11:00:00',
            'end_at' => '2026-08-01 12:00:00',
            'price_snapshot' => 80_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-01&to=2026-08-01');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('summary.totalRevenue', 140_000)
        );
    }

    public function test_occupancy_with_partial_hour_slot_overlap(): void
    {
        $t = $this->venue('v1');
        $court = $this->court($t);
        $customer = $this->customer($t);

        $this->openingRule($t, $court, [1, 2, 3, 4, 5, 6, 7], '06:00:00', '22:00:00');

        $this->createBookingWithSlots($t, $court, $customer, 'SAN-PART', '2026-08-03 10:30:00', '2026-08-03 11:30:00', 60_000);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-03&to=2026-08-03');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('occupancy.bookedMinutes', 60)
            ->where('occupancy.totalMinutes', 960)
        );
    }

    public function test_occupancy_subtracts_blackouts(): void
    {
        $t = $this->venue('v1');
        $court = $this->court($t);

        $this->openingRule($t, $court, [1, 2, 3, 4, 5, 6, 7], '06:00:00', '22:00:00');

        Blackout::create([
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'starts_at' => '2026-08-03 12:00:00',
            'ends_at' => '2026-08-03 14:00:00',
            'reason' => 'Maintenance',
        ]);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-03&to=2026-08-03');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('occupancy.bookedMinutes', 0)
            ->where('occupancy.totalMinutes', 840)
        );
    }

    public function test_occupancy_returns_zero_when_no_opening_rules(): void
    {
        $t = $this->venue('v1');
        $this->court($t);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-01&to=2026-08-01');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('occupancy.rate', 0)
            ->where('occupancy.bookedMinutes', 0)
            ->where('occupancy.totalMinutes', 0)
        );
    }

    public function test_reversed_date_range_is_handled(): void
    {
        $t = $this->venue('v1');
        $court = $this->court($t);
        $customer = $this->customer($t);

        $this->createBookingWithSlots($t, $court, $customer, 'SAN-REV', '2026-08-01 10:00:00', '2026-08-01 11:00:00', 50_000);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-05&to=2026-08-01');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('summary.totalRevenue', 50_000)
        );
    }

    public function test_revenue_by_day_groups_correctly(): void
    {
        $t = $this->venue('v1');
        $court = $this->court($t);
        $customer = $this->customer($t);

        $this->createBookingWithSlots($t, $court, $customer, 'SAN-D1', '2026-08-01 10:00:00', '2026-08-01 11:00:00', 60_000);
        $this->createBookingWithSlots($t, $court, $customer, 'SAN-D2', '2026-08-02 10:00:00', '2026-08-02 11:00:00', 80_000);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-01&to=2026-08-02');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('summary.totalRevenue', 140_000)
            ->has('revenueByDay', 2)
        );
    }

    public function test_only_confirmed_bookings_count_toward_revenue(): void
    {
        $t = $this->venue('v1');
        $court = $this->court($t);
        $customer = $this->customer($t);

        $this->createBookingWithSlots($t, $court, $customer, 'SAN-CONF', '2026-08-01 10:00:00', '2026-08-01 11:00:00', 60_000, 'confirmed');
        $this->createBookingWithSlots($t, $court, $customer, 'SAN-PEND', '2026-08-01 14:00:00', '2026-08-01 15:00:00', 60_000, 'pending_deposit');
        $this->createBookingWithSlots($t, $court, $customer, 'SAN-CANC', '2026-08-01 16:00:00', '2026-08-01 17:00:00', 60_000, 'cancelled');

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-01&to=2026-08-01');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('summary.totalRevenue', 60_000)
        );
    }

    public function test_top_customer_booking_count_not_inflated_by_slots(): void
    {
        $t = $this->venue('v-top');
        $court = $this->court($t);
        $customer = $this->customer($t, 'Khách top', '0900000001');

        $opening = $this->openingRule($t, $court);

        $make = function (string $code, array $slots) use ($t, $court, $customer) {
            $booking = Booking::forceCreate([
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $t->id,
                'code' => $code,
                'customer_id' => $customer->id,
                'status' => 'confirmed',
                'channel' => BookingChannel::OwnerManual,
                'total_amount' => 0,
                'deposit_amount' => 0,
                'payment_mode' => PaymentMode::Cash,
                'cancel_policy_snapshot' => [],
            ]);
            foreach ($slots as [$start, $end, $price]) {
                BookingSlot::create([
                    'tenant_id' => $t->id,
                    'booking_id' => $booking->id,
                    'court_id' => $court->id,
                    'start_at' => $start,
                    'end_at' => $end,
                    'price_snapshot' => $price,
                    'hold_status' => HoldStatus::Committed,
                ]);
            }

            return $booking;
        };

        // Two bookings: one with 2 slots, one with 1 slot, all on 2026-08-01.
        $make('SAN-T1', [
            ['2026-08-01 10:00:00', '2026-08-01 11:00:00', 60_000],
            ['2026-08-01 11:00:00', '2026-08-01 12:00:00', 60_000],
        ]);
        $make('SAN-T2', [
            ['2026-08-01 14:00:00', '2026-08-01 15:00:00', 60_000],
        ]);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-01&to=2026-08-01');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('topCustomers.0.booking_count', 2)
            ->where('topCustomers.0.total_spent', 180_000)
        );
    }

    public function test_venue_wide_blackout_subtracts_from_all_courts(): void
    {
        $t = $this->venue('v1');
        $court1 = $this->court($t, 'Sân 1');
        $court2 = $this->court($t, 'Sân 2');

        $this->openingRule($t, $court1, [1, 2, 3, 4, 5, 6, 7], '06:00:00', '22:00:00');
        $this->openingRule($t, $court2, [1, 2, 3, 4, 5, 6, 7], '06:00:00', '22:00:00');

        Blackout::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'starts_at' => '2026-08-03 12:00:00',
            'ends_at' => '2026-08-03 14:00:00',
            'reason' => 'Venue closed',
        ]);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/reports?from=2026-08-03&to=2026-08-03');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('occupancy.totalMinutes', 1680)
        );
    }
}
