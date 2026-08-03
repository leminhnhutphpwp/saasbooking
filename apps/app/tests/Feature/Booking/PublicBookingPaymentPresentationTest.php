<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBookingPaymentPresentationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_status_exposes_only_booking_payment_and_policy_snapshots(): void
    {
        $tenant = Tenant::create(['name' => 'Sân A', 'slug' => 'san-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $customer = Customer::create(['tenant_id' => $tenant->id, 'name' => 'Nguyễn An', 'phone' => '0912345678']);
        $booking = Booking::forceCreate([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'code' => 'SAN-PAYUX',
            'status' => 'pending_deposit',
            'channel' => 'zalo',
            'total_amount' => 150_000,
            'deposit_amount' => 50_000,
            'payment_mode' => 'deposit',
            'hold_expires_at' => now()->addMinutes(10),
            'cancel_policy_snapshot' => ['refund_before_hours' => 24, 'refund_pct' => 50],
        ]);

        $token = hash_hmac('sha256', "{$booking->code}:{$customer->code}", config('app.key'));

        $this->get("/book/{$tenant->slug}/status/{$booking->code}?token={$token}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/Booking/Status')
                ->where('booking.total', 150_000)
                ->where('booking.deposit', 50_000)
                ->where('booking.balance_due', 100_000)
                ->whereType('booking.hold_expires_at', 'string')
                ->where('booking.cancel_policy.refund_before_hours', 24)
                ->where('booking.cancel_policy.refund_pct', 50));
    }
}
