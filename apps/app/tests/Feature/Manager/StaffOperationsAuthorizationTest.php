<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\HoldStatus;
use App\Enums\PaymentMode;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StaffOperationsAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function venue(): Tenant
    {
        return Tenant::create([
            'name' => 'Venue',
            'slug' => 'venue',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
    }

    private function staff(Tenant $tenant): User
    {
        $staff = User::factory()->create(['tenant_id' => $tenant->id]);
        $staff->assignRole('staff');
        $staff->tenants()->attach($tenant->id, ['role' => 'staff']);

        return $staff;
    }

    private function booking(Tenant $tenant): Booking
    {
        $court = Court::create([
            'tenant_id' => $tenant->id,
            'name' => 'San 1',
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);
        $customer = Customer::create([
            'tenant_id' => $tenant->id,
            'name' => 'Customer',
            'phone' => sprintf('091234%04d', Customer::where('tenant_id', $tenant->id)->count() + 5678),
        ]);
        $start = CarbonImmutable::tomorrow()->setHour(10)->setMinute(0);
        $booking = Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'code' => 'SAN-'.Str::upper(Str::random(8)),
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => BookingChannel::OwnerManual,
            'total_amount' => 60_000,
            'deposit_amount' => 60_000,
            'payment_mode' => PaymentMode::Cash,
            'cancel_policy_snapshot' => [],
        ]);
        \DB::table('booking_slots')->insert([
            'tenant_id' => $tenant->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => $start,
            'end_at' => $start->addHour(),
            'price_snapshot' => 60_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        return $booking;
    }

    public function test_active_staff_membership_can_access_reception_operations(): void
    {
        $tenant = $this->venue();
        $staff = $this->staff($tenant);
        $booking = $this->booking($tenant);

        $this->actingAs($staff)->get('/manager/home')->assertOk();
        $this->actingAs($staff)->get('/manager/calendar')->assertOk();
        $this->actingAs($staff)->get('/manager/bookings')->assertOk();
        $this->actingAs($staff)->get("/manager/bookings/{$booking->uuid}")->assertOk();

        $court = Court::where('tenant_id', $tenant->id)->firstOrFail();
        PricingRule::create([
            'tenant_id' => $tenant->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '00:00:00',
            'end_local' => '23:59:59',
            'price_per_hour' => 60_000,
            'priority' => 0,
        ]);
        $walkInStart = CarbonImmutable::tomorrow()->setHour(14)->setMinute(0);
        $this->actingAs($staff)
            ->post('/manager/bookings', [
                'name' => 'Walk-in Customer',
                'phone' => '0922222222',
                'court_id' => $court->id,
                'start_at' => $walkInStart->toIso8601String(),
                'end_at' => $walkInStart->addHour()->toIso8601String(),
                'payment_mode' => 'cash',
            ])
            ->assertRedirect();
        $this->actingAs($staff)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'complete'])
            ->assertRedirect();

        $checkIn = $this->booking($tenant);
        $this->actingAs($staff)
            ->patch("/manager/bookings/{$checkIn->uuid}/status", ['action' => 'check_in'])
            ->assertRedirect();

        $noShow = $this->booking($tenant);
        $this->actingAs($staff)
            ->patch("/manager/bookings/{$noShow->uuid}/status", ['action' => 'no_show'])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::Completed->value,
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $noShow->id,
            'status' => BookingStatus::NoShow->value,
        ]);
    }

    public function test_staff_without_current_tenant_membership_is_forbidden(): void
    {
        $tenant = $this->venue();
        $staff = User::factory()->create(['tenant_id' => $tenant->id]);
        $staff->assignRole('staff');

        $this->actingAs($staff)->get('/manager/calendar')->assertForbidden();
    }

    public function test_staff_cannot_switch_to_a_tenant_without_membership(): void
    {
        $tenant = $this->venue();
        $otherTenant = Tenant::create([
            'name' => 'Other Venue',
            'slug' => 'other-venue',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
        $staff = $this->staff($tenant);

        $this->actingAs($staff)
            ->post('/switch-tenant', ['tenant_id' => $otherTenant->id])
            ->assertNotFound();
    }

    public function test_staff_cannot_access_owner_or_financial_operations(): void
    {
        $tenant = $this->venue();
        $staff = $this->staff($tenant);

        foreach ([
            '/manager/courts',
            '/manager/branding',
            '/manager/venue',
            '/manager/refunds',
            '/manager/reconcile',
            '/manager/reports',
            '/manager/series',
        ] as $uri) {
            $this->actingAs($staff)->get($uri)->assertForbidden();
        }

        $this->actingAs($staff)->post('/manager/courts')->assertForbidden();
    }

    public function test_staff_cannot_cancel_a_booking_through_lifecycle_actions(): void
    {
        $tenant = $this->venue();
        $staff = $this->staff($tenant);
        $booking = $this->booking($tenant);

        $this->actingAs($staff)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'cancel'])
            ->assertForbidden();
    }
}
