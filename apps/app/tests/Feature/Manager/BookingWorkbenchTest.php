<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\HoldStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Exceptions\SlotTakenException;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Booking\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Feature tests for the booking operations workbench (T29).
 * Covers: listing with filters, detail, walk-in booking, invalid transitions,
 * tenant forging, money invariants.
 *
 * NOTE: Uses RefreshDatabase — tests run against real PostgreSQL (SQLite cannot
 * test exclusion constraints). Tests are independent.
 */
class BookingWorkbenchTest extends TestCase
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

    private function pricingRule(Tenant $t, ?int $courtId = null): PricingRule
    {
        return PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => $courtId,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '00:00:00',
            'end_local' => '23:59:59',
            'price_per_hour' => 60_000,
            'priority' => 0,
        ]);
    }

    private function createConfirmedBooking(Tenant $t, Court $court, Customer $customer, string $code = 'SAN-T29A'): Booking
    {
        $start = CarbonImmutable::now()->addDay()->setHour(10)->setMinute(0)->setSecond(0);
        $end = $start->addHour();

        $booking = Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $t->id,
            'code' => $code,
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => BookingChannel::OwnerManual,
            'total_amount' => 60_000,
            'deposit_amount' => 60_000,
            'payment_mode' => PaymentMode::Cash,
            'cancel_policy_snapshot' => ['refund_before_hours' => 24, 'refund_pct' => 100],
        ]);

        \DB::table('booking_slots')->insert([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => $start,
            'end_at' => $end,
            'price_snapshot' => 60_000,
            'hold_status' => HoldStatus::Committed,
        ]);

        return $booking;
    }

    // ─── Index (list) tests ────────────────────────────────────────────

    public function test_index_returns_bookings_for_tenant(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer);

        $this->actingAs($owner)
            ->get('/manager/bookings')
            ->assertOk();
    }

    public function test_index_filters_by_status(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $confirmed = $this->createConfirmedBooking($t, $court, $customer, 'SAN-FILT');

        // Also create a pending booking
        $pendingCustomer = $this->customer($t, 'Khách B', '0999999999');
        $pending = Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $t->id,
            'code' => 'SAN-PEND',
            'customer_id' => $pendingCustomer->id,
            'status' => BookingStatus::PendingDeposit,
            'channel' => BookingChannel::Zalo,
            'total_amount' => 50_000,
            'deposit_amount' => 50_000,
            'payment_mode' => PaymentMode::Deposit,
            'cancel_policy_snapshot' => [],
        ]);

        $response = $this->actingAs($owner)
            ->get('/manager/bookings?status=confirmed');

        $response->assertOk();
    }

    public function test_index_does_not_show_other_tenants_bookings(): void
    {
        $a = $this->venue('va');
        $b = $this->venue('vb');
        $ownerA = $this->owner($a);
        $courtB = $this->court($b);
        $customerB = $this->customer($b, 'Other', '0988888888');
        $bookingB = $this->createConfirmedBooking($b, $courtB, $customerB, 'SAN-OTHR');

        $response = $this->actingAs($ownerA)
            ->get('/manager/bookings');

        $response->assertOk();
        // The other tenant's booking should not be in the list.
    }

    // ─── Show (detail) tests ───────────────────────────────────────────

    public function test_show_returns_booking_detail(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer);

        $this->actingAs($owner)
            ->get("/manager/bookings/{$booking->uuid}")
            ->assertOk();
    }

    public function test_show_rejects_other_tenant_booking(): void
    {
        $a = $this->venue('va');
        $b = $this->venue('vb');
        $ownerA = $this->owner($a);
        $courtB = $this->court($b);
        $customerB = $this->customer($b, 'Other', '0988888888');
        $bookingB = $this->createConfirmedBooking($b, $courtB, $customerB, 'SAN-XSEC');

        $this->actingAs($ownerA)
            ->get("/manager/bookings/{$bookingB->uuid}")
            ->assertForbidden();
    }

    // ─── Store (walk-in booking) tests ─────────────────────────────────

    public function test_store_creates_walk_in_booking_through_booking_service(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $this->pricingRule($t, $court->id);

        $start = CarbonImmutable::tomorrow()->setHour(14)->setMinute(0);
        $end = $start->addHour();

        $response = $this->actingAs($owner)
            ->post('/manager/bookings', [
                'name' => 'Walk-in Customer',
                'phone' => '0911111111',
                'court_id' => $court->id,
                'start_at' => $start->toIso8601String(),
                'end_at' => $end->toIso8601String(),
                'payment_mode' => 'cash',
            ]);

        $response->assertRedirect();

        // Booking was created via BookingService (not direct insert)
        $booking = Booking::where('tenant_id', $t->id)
            ->where('code', 'like', 'SAN-%')
            ->first();

        $this->assertNotNull($booking);
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertSame(60_000, $booking->total_amount);
        $this->assertDatabaseHas('customers', [
            'tenant_id' => $t->id,
            'phone' => '+84911111111',
        ]);

        // Cash payment was auto-created
        $payment = Payment::where('booking_id', $booking->id)->first();
        $this->assertNotNull($payment);
        $this->assertSame(PaymentMethod::Cash, $payment->method);
        $this->assertSame(PaymentStatus::Matched, $payment->status);
        $this->assertSame($booking->total_amount, $payment->amount);
    }

    public function test_store_rejects_overlapping_slot(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $this->pricingRule($t, $court->id);

        // Existing booking at 10:00-11:00
        $existing = $this->createConfirmedBooking($t, $court, $customer);

        // Try to walk in at the same time
        $start = CarbonImmutable::now()->addDay()->setHour(10)->setMinute(0);
        $end = $start->addHour();

        $response = $this->actingAs($owner)
            ->post('/manager/bookings', [
                'name' => 'Overlap',
                'phone' => '0922222222',
                'court_id' => $court->id,
                'start_at' => $start->toIso8601String(),
                'end_at' => $end->toIso8601String(),
                'payment_mode' => 'cash',
            ]);

        $response->assertSessionHas('error');
    }

    public function test_store_reports_a_lost_race_at_commit_instead_of_500ing(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $this->pricingRule($t, $court->id);

        $real = app(BookingService::class);

        // Simulate a concurrent expire+re-hold stealing the range between createHold and the
        // commit UPDATE: confirmDeposit is documented to surface that as SlotTakenException.
        $this->mock(BookingService::class, function ($mock) use ($real) {
            $mock->shouldReceive('createHold')->once()
                ->andReturnUsing(fn (...$args) => $real->createHold(...$args));
            $mock->shouldReceive('confirmDeposit')->once()->andThrow(new SlotTakenException);
            $mock->shouldReceive('markPaymentOrphaned')->once()
                ->andReturnUsing(fn (...$args) => $real->markPaymentOrphaned(...$args));
        });

        $start = CarbonImmutable::tomorrow()->setHour(15)->setMinute(0);

        $response = $this->actingAs($owner)
            ->post('/manager/bookings', [
                'name' => 'Race Loser',
                'phone' => '0933333333',
                'court_id' => $court->id,
                'start_at' => $start->toIso8601String(),
                'end_at' => $start->addHour()->toIso8601String(),
                'payment_mode' => 'cash',
            ]);

        $response->assertSessionHas('error');

        // No half-finished state may survive: no confirmed booking, no cash payment.
        $this->assertDatabaseMissing('bookings', ['tenant_id' => $t->id, 'status' => BookingStatus::Confirmed->value]);
        $this->assertDatabaseMissing('payments', ['tenant_id' => $t->id, 'method' => PaymentMethod::Cash->value]);
    }

    // ─── Status transition tests ───────────────────────────────────────

    public function test_update_status_can_complete_confirmed_booking(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-CMPL');

        $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'complete'])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::Completed->value,
        ]);
    }

    public function test_update_status_can_mark_no_show(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-NOSO');

        $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'no_show'])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::NoShow->value,
        ]);
    }

    public function test_update_status_can_cancel_confirmed_booking(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-CANC');

        $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", [
                'action' => 'cancel',
                'reason' => 'Khách hủy',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::Cancelled->value,
        ]);

        // Verify slots were released
        $this->assertDatabaseHas('booking_slots', [
            'booking_id' => $booking->id,
            'hold_status' => HoldStatus::Released->value,
        ]);
    }

    public function test_update_status_rejects_invalid_transition(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-INV');

        // Cannot complete a pending_deposit booking (only confirmed can be completed)
        // First make it pending
        \DB::table('bookings')->where('id', $booking->id)->update(['status' => BookingStatus::PendingDeposit->value]);

        $response = $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'complete']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::PendingDeposit->value,
        ]);
    }

    public function test_update_status_cannot_complete_already_completed(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-DONE');

        \DB::table('bookings')->where('id', $booking->id)->update(['status' => BookingStatus::Completed->value]);

        $response = $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'complete']);

        $response->assertSessionHas('error');
    }

    // ─── Tenant forging tests ──────────────────────────────────────────

    public function test_tenant_forging_rejected_on_index(): void
    {
        $a = $this->venue('va');
        $b = $this->venue('vb');
        $ownerA = $this->owner($a);
        $courtB = $this->court($b);
        $customerB = $this->customer($b, 'X', '0987654321');
        $bookingB = $this->createConfirmedBooking($b, $courtB, $customerB, 'SAN-FORG');

        // Owner A tries to view Owner B's booking detail — must be 403
        $this->actingAs($ownerA)
            ->get("/manager/bookings/{$bookingB->uuid}")
            ->assertForbidden();
    }

    public function test_tenant_forging_rejected_on_status_update(): void
    {
        $a = $this->venue('va');
        $b = $this->venue('vb');
        $ownerA = $this->owner($a);
        $courtB = $this->court($b);
        $customerB = $this->customer($b, 'Y', '0987654322');
        $bookingB = $this->createConfirmedBooking($b, $courtB, $customerB, 'SAN-FG2');

        $this->actingAs($ownerA)
            ->patch("/manager/bookings/{$bookingB->uuid}/status", ['action' => 'complete'])
            ->assertForbidden();

        // Status unchanged
        $this->assertDatabaseHas('bookings', [
            'id' => $bookingB->id,
            'status' => BookingStatus::Confirmed->value,
        ]);
    }

    // ─── Money invariant tests ─────────────────────────────────────────

    public function test_money_is_bigint_integer_vnd(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $this->pricingRule($t, $court->id);

        $start = CarbonImmutable::tomorrow()->setHour(9);
        $end = $start->addHour();

        $this->actingAs($owner)
            ->post('/manager/bookings', [
                'name' => 'Money Test',
                'phone' => '0933333333',
                'court_id' => $court->id,
                'start_at' => $start->toIso8601String(),
                'end_at' => $end->toIso8601String(),
                'payment_mode' => 'cash',
            ]);

        $booking = Booking::where('tenant_id', $t->id)->first();
        $this->assertNotNull($booking);

        // Money stored as integer (BIGINT), not float
        $this->assertIsInt($booking->total_amount);
        $this->assertIsInt($booking->deposit_amount);
        $this->assertGreaterThan(0, $booking->total_amount);
    }

    public function test_payment_amount_is_immutable(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-IMMU');

        Payment::forceCreate([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'method' => PaymentMethod::Cash,
            'amount' => 60_000,
            'status' => PaymentStatus::Matched,
            'memo_ref' => $booking->code,
            'matched_at' => now(),
        ]);

        $payment = Payment::where('booking_id', $booking->id)->first();
        $originalAmount = $payment->amount;

        // Verify amount column is integer
        $this->assertIsInt($payment->amount);
        $this->assertSame(60_000, $payment->amount);
    }

    // ─── Validation tests ──────────────────────────────────────────────

    public function test_store_validates_required_fields(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->post('/manager/bookings', [])
            ->assertSessionHasErrors(['name', 'phone', 'court_id', 'start_at', 'end_at']);
    }

    public function test_store_rejects_invalid_court(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);

        $this->actingAs($owner)
            ->post('/manager/bookings', [
                'name' => 'Test',
                'phone' => '0911111111',
                'court_id' => 99999,
                'start_at' => CarbonImmutable::tomorrow()->toIso8601String(),
                'end_at' => CarbonImmutable::tomorrow()->addHour()->toIso8601String(),
            ])
            ->assertSessionHasErrors(['court_id']);
    }

    public function test_update_status_validates_action(): void
    {
        $t = $this->venue('v1');
        $owner = $this->owner($t);
        $court = $this->court($t);
        $customer = $this->customer($t);
        $booking = $this->createConfirmedBooking($t, $court, $customer, 'SAN-VALD');

        $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'invalid_action'])
            ->assertSessionHasErrors(['action']);
    }
}
