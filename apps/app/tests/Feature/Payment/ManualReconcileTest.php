<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Booking\BookingService;
use App\Services\Payment\PaymentService;
use App\Services\Payment\ReconcileService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManualReconcileTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000009', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
            'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        TenantBankConfig::create([
            'tenant_id' => $this->tenant->id, 'provider' => 'sepay',
            'bank_bin' => '970422', 'account_number' => '0123', 'account_name' => 'CHU SAN',
            'webhook_secret' => 'secret-token', 'active' => true,
        ]);
    }

    /** @return array{0: Booking, 1: Payment} */
    private function holdAndInit(): array
    {
        $booking = app(BookingService::class)->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse('2026-07-21 18:00', 'Asia/Ho_Chi_Minh'),
                'end_at' => CarbonImmutable::parse('2026-07-21 19:00', 'Asia/Ho_Chi_Minh'),
            ]],
        ]);
        $payment = app(PaymentService::class)->initDeposit($booking)['payment'];

        return [$booking, $payment];
    }

    public function test_manual_match_confirms_booking(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        $inbox = BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-M1',
            'account_number' => '0123', 'amount' => 60_000,
            'memo' => "funds {$booking->code}",
        ]);

        app(ReconcileService::class)->manualMatch($inbox, $payment);

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);
        $this->assertSame('TX-M1', $payment->fresh()->bank_txn_id);
        $this->assertNotNull($inbox->fresh()->processed_at);
    }

    public function test_manual_match_dismisses_txn(): void
    {
        $inbox = BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-D1',
            'account_number' => '0123', 'amount' => 99_000,
            'memo' => 'random transfer',
        ]);

        app(ReconcileService::class)->dismissTxn($inbox);

        $this->assertNotNull($inbox->fresh()->processed_at);
        $this->assertSame('Dismissed by owner', $inbox->fresh()->note);
    }

    public function test_unmatched_page_shows_only_tenant_txns(): void
    {
        $this->markTestSkipped('Requires auth + controller routing — tested via Feature test with login.');
    }
}
