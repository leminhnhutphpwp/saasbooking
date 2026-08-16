<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Enums\CancelReason;
use App\Enums\HoldStatus;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Refund;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Payment\PaymentService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RefundControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }

        $this->tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000009', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
            'price_per_hour' => 60_000, 'priority' => 0,
        ]);
    }

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    public function test_refund_index_includes_booking_context(): void
    {
        $booking = Booking::create([
            'tenant_id' => $this->tenant->id, 'code' => 'SAN-CTX1', 'customer_id' => $this->customer->id,
            'status' => 'cancelled', 'channel' => 'zalo', 'total_amount' => 60_000,
            'deposit_amount' => 60_000, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);
        BookingSlot::create([
            'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'court_id' => $this->court->id,
            'start_at' => CarbonImmutable::parse('2026-08-11 18:00', 'Asia/Ho_Chi_Minh'),
            'end_at' => CarbonImmutable::parse('2026-08-11 19:30', 'Asia/Ho_Chi_Minh'),
            'price_snapshot' => 60_000, 'hold_status' => HoldStatus::Released,
        ]);
        $payment = Payment::create([
            'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'method' => 'vietqr',
            'amount' => 60_000, 'status' => 'orphaned', 'memo_ref' => 'SAN-CTX1',
        ]);
        Refund::create([
            'tenant_id' => $this->tenant->id, 'payment_id' => $payment->id, 'amount' => 60_000,
            'reason' => CancelReason::RaceLost, 'status' => RefundStatus::Requested,
        ]);

        $this->actingAs($this->owner($this->tenant))
            ->get('/manager/refunds')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Refunds/Index')
                ->has('refunds', 1)
                ->where('refunds.0.booking_code', 'SAN-CTX1')
                ->where('refunds.0.booking_uuid', $booking->uuid)
                ->where('refunds.0.customer_name', 'A')
                ->where('refunds.0.customer_phone', '0900000009')
                ->has('refunds.0.slot_summary', 1)
                ->where('refunds.0.amount', 60_000));
    }

    public function test_refund_index_slot_summary_contains_iso_timestamps(): void
    {
        $booking = Booking::create([
            'tenant_id' => $this->tenant->id, 'code' => 'SAN-SLOT1', 'customer_id' => $this->customer->id,
            'status' => 'cancelled', 'channel' => 'zalo', 'total_amount' => 60_000,
            'deposit_amount' => 60_000, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);
        BookingSlot::create([
            'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'court_id' => $this->court->id,
            'start_at' => CarbonImmutable::parse('2026-08-11 18:00', 'Asia/Ho_Chi_Minh'),
            'end_at' => CarbonImmutable::parse('2026-08-11 19:30', 'Asia/Ho_Chi_Minh'),
            'price_snapshot' => 60_000, 'hold_status' => HoldStatus::Released,
        ]);
        $payment = Payment::create([
            'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'method' => 'vietqr',
            'amount' => 60_000, 'status' => 'orphaned', 'memo_ref' => 'SAN-SLOT1',
        ]);
        Refund::create([
            'tenant_id' => $this->tenant->id, 'payment_id' => $payment->id, 'amount' => 60_000,
            'reason' => CancelReason::CustomerCancel, 'status' => RefundStatus::Requested,
        ]);

        $this->actingAs($this->owner($this->tenant))
            ->get('/manager/refunds')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Refunds/Index')
                ->has('refunds', 1)
                ->has('refunds.0.slot_summary.0.start_at')
                ->has('refunds.0.slot_summary.0.end_at'));
    }

    public function test_refund_index_scoped_by_tenant(): void
    {
        $otherTenant = Tenant::create(['name' => 'W', 'slug' => 'w', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'phone' => '0999999999', 'name' => 'Z']);
        $otherBooking = Booking::create([
            'tenant_id' => $otherTenant->id, 'code' => 'SAN-OTHER', 'customer_id' => $otherCustomer->id,
            'status' => 'cancelled', 'channel' => 'zalo', 'total_amount' => 60_000,
            'deposit_amount' => 60_000, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);
        $otherPayment = Payment::create([
            'tenant_id' => $otherTenant->id, 'booking_id' => $otherBooking->id, 'method' => 'vietqr',
            'amount' => 60_000, 'status' => 'orphaned', 'memo_ref' => 'SAN-OTHER',
        ]);
        Refund::create([
            'tenant_id' => $otherTenant->id, 'payment_id' => $otherPayment->id, 'amount' => 60_000,
            'reason' => CancelReason::RaceLost, 'status' => RefundStatus::Requested,
        ]);

        $this->actingAs($this->owner($this->tenant))
            ->get('/manager/refunds')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Refunds/Index')
                ->has('refunds', 0));
    }

    // ── Refund ledger conservation ───────────────────────────────────

    private function matchedPayment(string $code, int $amount = 60_000, string $status = 'matched'): Payment
    {
        $booking = Booking::create([
            'tenant_id' => $this->tenant->id, 'code' => $code, 'customer_id' => $this->customer->id,
            'status' => 'cancelled', 'channel' => 'zalo', 'total_amount' => $amount,
            'deposit_amount' => $amount, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);

        return Payment::create([
            'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'method' => 'vietqr',
            'amount' => $amount, 'status' => $status, 'memo_ref' => $code,
        ]);
    }

    public function test_refunds_cannot_exceed_the_original_payment_in_total(): void
    {
        $payment = $this->matchedPayment('SAN-LEDG1');
        $service = app(PaymentService::class);

        $service->requestRefund($payment, 40_000, CancelReason::CustomerCancel);

        // 40k already requested — only 20k of headroom remains on a 60k payment.
        $this->expectException(\RuntimeException::class);
        $service->requestRefund($payment, 40_000, CancelReason::CustomerCancel);
    }

    public function test_refund_cannot_be_requested_against_an_unpaid_payment(): void
    {
        $payment = $this->matchedPayment('SAN-LEDG2', status: 'awaiting');
        $service = app(PaymentService::class);

        $this->expectException(\RuntimeException::class);
        $service->requestRefund($payment, 10_000, CancelReason::CustomerCancel);
    }

    public function test_mark_refund_done_is_idempotent_and_preserves_the_first_resolution(): void
    {
        $payment = $this->matchedPayment('SAN-LEDG3');
        $service = app(PaymentService::class);
        $refund = $service->requestRefund($payment, 60_000, CancelReason::CustomerCancel);

        $service->markRefundDone($refund, 11);
        $refund->refresh();
        $firstResolvedAt = $refund->resolved_at;

        $service->markRefundDone($refund, 22);
        $refund->refresh();

        $this->assertSame(11, $refund->resolved_by);
        $this->assertEquals($firstResolvedAt, $refund->resolved_at);
    }
}
