<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Tenant $otherTenant;

    private Court $court;

    private Booking $booking;

    private Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Venue A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->otherTenant = Tenant::create(['name' => 'Venue B', 'slug' => 'venue-b', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Court 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000000', 'name' => 'Customer']);
        $this->booking = Booking::create([
            'tenant_id' => $this->tenant->id,
            'code' => 'SAN-INT01',
            'customer_id' => $customer->id,
            'status' => 'pending_deposit',
            'channel' => 'zalo',
            'hold_expires_at' => now()->addMinutes(10),
            'total_amount' => 100_000,
            'deposit_amount' => 100_000,
            'payment_mode' => 'deposit',
            'cancel_policy_snapshot' => [],
        ]);
        $this->payment = Payment::forceCreate([
            'tenant_id' => $this->tenant->id,
            'booking_id' => $this->booking->id,
            'method' => 'vietqr',
            'amount' => 100_000,
            'status' => 'matched',
            'memo_ref' => $this->booking->code,
        ]);
    }

    public function test_direct_writes_cannot_store_negative_money(): void
    {
        $pricingRule = PricingRule::create([
            'tenant_id' => $this->tenant->id,
            'weekday' => [1],
            'start_local' => '08:00',
            'end_local' => '09:00',
            'price_per_hour' => 100_000,
            'priority' => 0,
        ]);

        $this->assertConstraintViolation(fn () => DB::table('bookings')->where('id', $this->booking->id)->update(['total_amount' => -1]));
        $this->assertConstraintViolation(fn () => DB::table('pricing_rules')->where('id', $pricingRule->id)->update(['price_per_hour' => -1]));
        $this->assertConstraintViolation(fn () => DB::table('payments')->insert($this->paymentData(-1)));
        $this->assertConstraintViolation(fn () => DB::table('refunds')->insert($this->refundData(-1)));
    }

    public function test_direct_writes_cannot_store_invalid_slot_or_blackout_windows(): void
    {
        $this->assertConstraintViolation(fn () => DB::table('booking_slots')->insert([
            'tenant_id' => $this->tenant->id,
            'booking_id' => $this->booking->id,
            'court_id' => $this->court->id,
            'start_at' => '2026-08-10 19:00:00+07',
            'end_at' => '2026-08-10 18:00:00+07',
            'price_snapshot' => 100_000,
            'hold_status' => 'holding',
        ]));
        $this->assertConstraintViolation(fn () => DB::table('blackouts')->insert([
            'tenant_id' => $this->tenant->id,
            'court_id' => $this->court->id,
            'starts_at' => '2026-08-10 19:00:00+07',
            'ends_at' => '2026-08-10 18:00:00+07',
        ]));
    }

    public function test_direct_write_cannot_reference_a_payment_from_another_tenant(): void
    {
        $this->assertConstraintViolation(fn () => DB::table('refunds')->insert($this->refundData(10_000, $this->otherTenant->id)), '23503');
    }

    public function test_direct_write_cannot_change_a_payment_amount(): void
    {
        $this->assertConstraintViolation(fn () => DB::table('payments')->where('id', $this->payment->id)->update(['amount' => 90_000]));
    }

    public function test_direct_writes_cannot_refund_more_than_the_original_payment_in_total(): void
    {
        DB::table('refunds')->insert($this->refundData(60_000));

        $this->assertConstraintViolation(fn () => DB::table('refunds')->insert($this->refundData(50_000)));
    }

    /** @return array<string, int|string> */
    private function refundData(int $amount, ?int $tenantId = null): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId ?? $this->tenant->id,
            'payment_id' => $this->payment->id,
            'amount' => $amount,
            'reason' => 'customer_cancel',
        ];
    }

    /** @return array<string, int|string> */
    private function paymentData(int $amount): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'booking_id' => $this->booking->id,
            'method' => 'cash',
            'amount' => $amount,
            'status' => 'awaiting',
            'memo_ref' => $this->booking->code,
        ];
    }

    private function assertConstraintViolation(callable $write, string $sqlState = '23514'): void
    {
        try {
            DB::transaction($write);
            $this->fail('Expected PostgreSQL to reject the direct database write.');
        } catch (QueryException $exception) {
            $this->assertSame($sqlState, $exception->getCode());
        }
    }
}
