<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\HoldStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Booking\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CancellationTest extends TestCase
{
    use RefreshDatabase;

    private BookingService $bookings;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bookings = app(BookingService::class);
        $this->tenant = Tenant::create(['name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Court 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'name' => 'Player', 'phone' => '0912345678']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => $this->court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '00:00:00', 'end_local' => '23:00:00',
            'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        Role::create(['name' => 'owner', 'guard_name' => 'web']);
    }

    public function test_cancellation_uses_the_policy_snapshot_and_creates_one_requested_refund_for_a_matched_payment(): void
    {
        $booking = $this->confirmedBooking(['refund_before_hours' => 24, 'refund_pct' => 50]);
        $payment = $this->matchedPayment($booking);

        $this->bookings->cancel($booking, CancelReason::CustomerCancel);
        $this->bookings->cancel($booking, CancelReason::CustomerCancel);

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertSame(HoldStatus::Released, BookingSlot::where('booking_id', $booking->id)->firstOrFail()->hold_status);
        $this->assertDatabaseCount('refunds', 1);
        $this->assertDatabaseHas('refunds', [
            'payment_id' => $payment->id,
            'amount' => 30_000,
            'reason' => CancelReason::CustomerCancel->value,
            'status' => RefundStatus::Requested->value,
        ]);
        $this->assertSame(60_000, $payment->fresh()->amount);
    }

    public function test_late_cancellation_releases_inventory_without_a_refund_when_snapshot_is_not_eligible(): void
    {
        $booking = $this->confirmedBooking(['refund_before_hours' => 24, 'refund_pct' => 100], CarbonImmutable::now()->addHours(2));
        $this->matchedPayment($booking);

        $this->bookings->cancel($booking, CancelReason::OwnerCancel);

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertSame(HoldStatus::Released, BookingSlot::where('booking_id', $booking->id)->firstOrFail()->hold_status);
        $this->assertDatabaseCount('refunds', 0);
    }

    public function test_signed_public_status_link_cancels_and_exposes_the_requested_refund(): void
    {
        $booking = $this->confirmedBooking(['refund_before_hours' => 24, 'refund_pct' => 100]);
        $this->matchedPayment($booking);
        $token = hash_hmac('sha256', "{$booking->code}:{$this->customer->code}", config('app.key'));

        $this->post("/book/venue/status/{$booking->code}/cancel?token={$token}")
            ->assertRedirect("/book/venue/status/{$booking->code}?token={$token}");

        $this->get("/book/venue/status/{$booking->code}?token={$token}")
            ->assertInertia(fn ($page) => $page
                ->where('booking.status', BookingStatus::Cancelled->value)
                ->where('booking.refund.amount', 60_000)
                ->where('booking.refund.status', RefundStatus::Requested->value));

        $other = $this->confirmedBooking(['refund_before_hours' => 24, 'refund_pct' => 100], CarbonImmutable::now()->addDays(3));
        $this->post("/book/venue/status/{$other->code}/cancel?token=invalid")->assertForbidden();
        $this->assertSame(BookingStatus::Confirmed, $other->fresh()->status);
    }

    public function test_manager_cancellation_uses_the_same_snapshot_refund_flow(): void
    {
        $booking = $this->confirmedBooking(['refund_before_hours' => 24, 'refund_pct' => 100]);
        $payment = $this->matchedPayment($booking);
        $owner = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $owner->assignRole('owner');

        $this->actingAs($owner)
            ->patch("/manager/bookings/{$booking->uuid}/status", ['action' => 'cancel', 'reason' => 'Venue cancellation'])
            ->assertRedirect();

        $this->assertDatabaseHas('refunds', [
            'payment_id' => $payment->id,
            'amount' => 60_000,
            'reason' => CancelReason::OwnerCancel->value,
            'status' => RefundStatus::Requested->value,
        ]);
    }

    /** @param array{refund_before_hours:int, refund_pct:int} $policy */
    private function confirmedBooking(array $policy, ?CarbonImmutable $start = null): Booking
    {
        $start ??= CarbonImmutable::now()->addDays(2)->startOfHour();
        $booking = $this->bookings->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [['court_id' => $this->court->id, 'start_at' => $start, 'end_at' => $start->addHour()]],
        ]);
        $booking->forceFill(['cancel_policy_snapshot' => $policy])->save();
        $this->bookings->confirmDeposit($booking);

        return $booking->fresh();
    }

    private function matchedPayment(Booking $booking): Payment
    {
        return Payment::forceCreate([
            'tenant_id' => $booking->tenant_id,
            'booking_id' => $booking->id,
            'method' => PaymentMethod::VietQr,
            'amount' => $booking->deposit_amount,
            'status' => PaymentStatus::Matched,
            'memo_ref' => $booking->code,
            'matched_at' => now(),
        ]);
    }
}
