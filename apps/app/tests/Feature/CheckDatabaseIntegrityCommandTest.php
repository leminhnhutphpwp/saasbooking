<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckDatabaseIntegrityCommandTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Tenant $otherTenant;

    private Booking $booking;

    private Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Venue A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->otherTenant = Tenant::create(['name' => 'Venue B', 'slug' => 'venue-b', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Court 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000000', 'name' => 'Customer']);
        $this->booking = Booking::create([
            'tenant_id' => $this->tenant->id,
            'code' => 'SAN-PREFLIGHT',
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

        PricingRule::create([
            'tenant_id' => $this->tenant->id,
            'weekday' => [1],
            'start_local' => '08:00',
            'end_local' => '09:00',
            'price_per_hour' => 100_000,
            'priority' => 0,
        ]);
        DB::table('bank_txn_inbox')->insert([
            'tenant_id' => $this->tenant->id,
            'provider' => 'sepay',
            'bank_txn_id' => 'safe-preflight-transaction',
            'account_number' => 'SENSITIVE-BANK-ACCOUNT',
            'amount' => 100_000,
            'memo' => 'SAN-PREFLIGHT',
        ]);
    }

    public function test_clean_data_passes_without_disclosing_bank_details(): void
    {
        $this->artisan('db:preflight-integrity')
            ->expectsOutput('Auditing all tenant rows. This command performs no writes.')
            ->expectsOutput('No integrity violations found across all tenants. Both T09 triggers are enabled.')
            ->doesntExpectOutput('SENSITIVE-BANK-ACCOUNT')
            ->assertExitCode(Command::SUCCESS);
    }

    public function test_invalid_legacy_rows_are_grouped_by_tenant_and_fail_the_preflight(): void
    {
        DB::statement('ALTER TABLE payments DROP CONSTRAINT payments_amount_nonnegative');
        DB::statement('ALTER TABLE payments DISABLE TRIGGER payments_amount_immutable');
        DB::table('payments')->where('id', $this->payment->id)->update(['amount' => -1]);
        DB::statement('ALTER TABLE payments ENABLE TRIGGER payments_amount_immutable');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_amount_nonnegative CHECK (amount >= 0) NOT VALID');

        DB::statement('ALTER TABLE refunds DROP CONSTRAINT refunds_tenant_payment_id_foreign');
        DB::table('refunds')->insert([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->otherTenant->id,
            'payment_id' => $this->payment->id,
            'amount' => 10_000,
            'reason' => 'customer_cancel',
        ]);
        DB::statement('ALTER TABLE refunds ADD CONSTRAINT refunds_tenant_payment_id_foreign FOREIGN KEY (tenant_id, payment_id) REFERENCES payments (tenant_id, id) ON DELETE CASCADE NOT VALID');

        DB::statement('ALTER TABLE refunds DISABLE TRIGGER refunds_total_amount_within_payment');
        DB::table('refunds')->insert([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'payment_id' => $this->payment->id,
            'amount' => 110_000,
            'reason' => 'customer_cancel',
        ]);
        DB::statement('ALTER TABLE refunds ENABLE TRIGGER refunds_total_amount_within_payment');

        $this->artisan('db:preflight-integrity')
            ->expectsOutput('payments_amount_nonnegative: tenant #'.$this->tenant->id.' (venue-a), 1 violation(s)')
            ->expectsOutput('refunds_tenant_payment_id_foreign: tenant #'.$this->otherTenant->id.' (venue-b), 1 violation(s)')
            ->expectsOutput('refunds_total_amount_within_payment: tenant #'.$this->tenant->id.' (venue-a), 1 violation(s)')
            ->assertExitCode(Command::FAILURE);
    }
}
