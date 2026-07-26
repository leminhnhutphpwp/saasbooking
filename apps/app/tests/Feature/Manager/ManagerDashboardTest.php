<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Refund;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ManagerDashboardTest extends TestCase
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

    public function test_owner_books_walk_in_as_confirmed_cash(): void
    {
        $t = $this->venue('venue-a');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);

        $this->actingAs($this->owner($t))
            ->post('/manager/calendar/walk-in', [
                'name' => 'Khách A', 'phone' => '0912345678', 'court_id' => $court->id,
                'start_at' => '2026-07-21 18:00:00', 'end_at' => '2026-07-21 19:00:00',
            ])
            ->assertRedirect();

        $booking = Booking::where('tenant_id', $t->id)->first();
        $this->assertSame(BookingStatus::Confirmed, $booking->status);
        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id, 'method' => PaymentMethod::Cash->value, 'status' => PaymentStatus::Matched->value,
        ]);
        $this->assertDatabaseHas('customers', [
            'tenant_id' => $t->id, 'phone' => '+84912345678',
        ]);
    }

    public function test_refund_queue_lists_and_marks_done(): void
    {
        $t = $this->venue('venue-a');
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'S', 'court_type' => 'pickleball', 'status' => 'active']);
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0911111111', 'name' => 'A']);
        $booking = Booking::create([
            'tenant_id' => $t->id, 'code' => 'SAN-RF001', 'customer_id' => $customer->id, 'status' => 'cancelled',
            'channel' => 'zalo', 'total_amount' => 60_000, 'deposit_amount' => 60_000, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);
        $payment = Payment::create([
            'tenant_id' => $t->id, 'booking_id' => $booking->id, 'method' => 'vietqr', 'amount' => 60_000,
            'status' => 'orphaned', 'memo_ref' => 'SAN-RF001',
        ]);
        $refund = Refund::create([
            'tenant_id' => $t->id, 'payment_id' => $payment->id, 'amount' => 60_000,
            'reason' => CancelReason::RaceLost, 'status' => RefundStatus::Requested,
        ]);

        $owner = $this->owner($t);

        $this->actingAs($owner)->get('/manager/refunds')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Manager/Refunds/Index')->has('refunds', 1));

        $this->actingAs($owner)->post("/manager/refunds/{$refund->uuid}/done")->assertRedirect();
        $this->assertSame(RefundStatus::Done, $refund->fresh()->status);
    }

    public function test_owner_cannot_mark_done_other_tenants_refund(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $customer = Customer::create(['tenant_id' => $b->id, 'phone' => '0922222222', 'name' => 'B']);
        $booking = Booking::create([
            'tenant_id' => $b->id, 'code' => 'SAN-RF002', 'customer_id' => $customer->id, 'status' => 'cancelled',
            'channel' => 'zalo', 'total_amount' => 60_000, 'deposit_amount' => 60_000, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);
        $payment = Payment::create([
            'tenant_id' => $b->id, 'booking_id' => $booking->id, 'method' => 'vietqr', 'amount' => 60_000,
            'status' => 'orphaned', 'memo_ref' => 'SAN-RF002',
        ]);
        $refundB = Refund::create([
            'tenant_id' => $b->id, 'payment_id' => $payment->id, 'amount' => 60_000,
            'reason' => CancelReason::RaceLost, 'status' => RefundStatus::Requested,
        ]);

        $this->actingAs($this->owner($a))
            ->post("/manager/refunds/{$refundB->uuid}/done")
            ->assertForbidden();

        $this->assertSame(RefundStatus::Requested, $refundB->fresh()->status);
    }
}
