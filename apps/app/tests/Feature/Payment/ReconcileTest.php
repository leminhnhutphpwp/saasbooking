<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Refund;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Booking\BookingService;
use App\Services\Payment\PaymentService;
use App\Services\Payment\ReconcileService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconcileTest extends TestCase
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

    private function txn(string $bankId, int $amount, string $memo): array
    {
        return [
            'provider' => 'sepay', 'bank_txn_id' => $bankId, 'account_number' => '0123',
            'amount' => $amount, 'memo' => $memo,
        ];
    }

    public function test_reconcile_confirms_deposit_within_ttl(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        app(ReconcileService::class)->ingest($this->txn('TX1', 60_000, "chuyen tien {$booking->code}"), $this->tenant->id);

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);
        $this->assertSame('TX1', $payment->fresh()->bank_txn_id);
    }

    public function test_duplicate_webhook_confirms_exactly_once(): void
    {
        [$booking, $payment] = $this->holdAndInit();
        $txn = $this->txn('TX1', 60_000, "chuyen tien {$booking->code}");

        app(ReconcileService::class)->ingest($txn, $this->tenant->id);
        app(ReconcileService::class)->ingest($txn, $this->tenant->id);   // redelivered

        $this->assertSame(1, BankTxnInbox::count());
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(ReconcileService::STATUS_MATCHED, BankTxnInbox::first()->status);
        $this->assertNotNull(BankTxnInbox::first()->processed_at);
    }

    public function test_duplicate_manual_match_does_not_settle_a_payment_twice(): void
    {
        [$booking, $payment] = $this->holdAndInit();
        $inbox = BankTxnInbox::create([
            'tenant_id' => $this->tenant->id,
            'provider' => 'sepay',
            'bank_txn_id' => 'TX-MANUAL',
            'account_number' => '0123',
            'amount' => 60_000,
            'memo' => $booking->code,
        ]);

        $reconcile = app(ReconcileService::class);
        $reconcile->manualMatch($inbox, $payment);
        $reconcile->manualMatch($inbox, $payment);

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);
        $this->assertSame(ReconcileService::STATUS_MATCHED, $inbox->fresh()->status);
        $this->assertSame('TX-MANUAL', $payment->fresh()->bank_txn_id);
    }

    public function test_grace_reconfirm_after_expiry_when_slot_free(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        // Hold expires and the sweeper releases the slot — but nobody else took it.
        $booking->update(['hold_expires_at' => now()->subMinute()]);
        app(BookingService::class)->expireStaleHolds();
        $this->assertSame(BookingStatus::Expired, $booking->fresh()->status);

        app(ReconcileService::class)->ingest($this->txn('TX2', 60_000, $booking->code), $this->tenant->id);

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);
    }

    public function test_orphaned_with_refund_when_slot_lost(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        // Hold expires + released, then someone else grabs the same slot.
        $booking->update(['hold_expires_at' => now()->subMinute()]);
        app(BookingService::class)->expireStaleHolds();
        app(BookingService::class)->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse('2026-07-21 18:00', 'Asia/Ho_Chi_Minh'),
                'end_at' => CarbonImmutable::parse('2026-07-21 19:00', 'Asia/Ho_Chi_Minh'),
            ]],
        ]);

        app(ReconcileService::class)->ingest($this->txn('TX3', 60_000, $booking->code), $this->tenant->id);

        $this->assertSame(PaymentStatus::Orphaned, $payment->fresh()->status);
        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertSame(1, Refund::where('payment_id', $payment->id)->where('status', RefundStatus::Requested)->count());
    }

    public function test_reconciliation_after_cancellation_orphans_the_awaiting_deposit_without_mutating_its_amount(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        // This deterministically represents cancellation acquiring the booking lock before a webhook
        // can settle the awaiting payment. A later payment must be refunded, not revive the booking.
        app(BookingService::class)->cancel($booking, CancelReason::CustomerCancel);
        app(ReconcileService::class)->ingest($this->txn('TX-CANCELLED', 60_000, $booking->code), $this->tenant->id);

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Orphaned, $payment->fresh()->status);
        $this->assertSame(60_000, $payment->fresh()->amount);
        $this->assertSame(1, Refund::where('payment_id', $payment->id)->where('status', RefundStatus::Requested)->count());
    }

    public function test_underpaid_does_not_auto_confirm(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        app(ReconcileService::class)->ingest($this->txn('TX4', 30_000, $booking->code), $this->tenant->id); // < 60k

        $this->assertSame(BookingStatus::PendingDeposit, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Awaiting, $payment->fresh()->status);
        $this->assertNotNull(BankTxnInbox::first()->note);
    }

    public function test_overpaid_does_not_auto_confirm(): void
    {
        [$booking, $payment] = $this->holdAndInit();

        app(ReconcileService::class)->ingest($this->txn('TX-OVER', 70_000, $booking->code), $this->tenant->id);

        $this->assertSame(BookingStatus::PendingDeposit, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Awaiting, $payment->fresh()->status);
        $this->assertSame(ReconcileService::STATUS_UNMATCHED, BankTxnInbox::first()->status);
        $this->assertSame($payment->id, BankTxnInbox::first()->payment_id);
    }

    /**
     * Recovery (#2). A webhook that arrives before the deposit exists (or otherwise can't settle) is
     * RECORDED but LEFT UNPROCESSED (processed_at = NULL, status 'unmatched') so a later redelivery
     * re-runs it — rather than being ACKed and lost forever. Once the deposit exists, redelivery
     * confirms exactly once; a further redelivery of the now-processed row is dropped (idempotency).
     */
    public function test_unprocessed_txn_is_reprocessed_on_redelivery_then_stays_idempotent(): void
    {
        // Webhook arrives BEFORE initDeposit: the booking exists (so we know its code) but there is
        // no awaiting payment yet.
        $booking = app(BookingService::class)->createHold($this->tenant, [
            'customer_id' => $this->customer->id, 'channel' => 'zalo', 'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse('2026-07-21 18:00', 'Asia/Ho_Chi_Minh'),
                'end_at' => CarbonImmutable::parse('2026-07-21 19:00', 'Asia/Ho_Chi_Minh'),
            ]],
        ]);
        $txn = $this->txn('TX-REC', 60_000, "chuyen tien {$booking->code}");

        // 1) First delivery: no awaiting payment → recorded UNMATCHED but LEFT UNPROCESSED.
        app(ReconcileService::class)->ingest($txn, $this->tenant->id);
        $inbox = BankTxnInbox::first();
        $this->assertSame(ReconcileService::STATUS_UNMATCHED, $inbox->status);
        $this->assertNull($inbox->processed_at);
        $this->assertSame(BookingStatus::PendingDeposit, $booking->fresh()->status);

        // Deposit is initialised late (player finally opens the QR page).
        $payment = app(PaymentService::class)->initDeposit($booking)['payment'];

        // 2) Redelivery re-processes the still-unprocessed row → confirm, exactly once.
        app(ReconcileService::class)->ingest($txn, $this->tenant->id);
        $this->assertSame(1, BankTxnInbox::count());
        $this->assertSame(ReconcileService::STATUS_MATCHED, $inbox->fresh()->status);
        $this->assertNotNull($inbox->fresh()->processed_at);
        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);

        // 3) A further redelivery of the now-processed txn is dropped — still confirmed exactly once.
        app(ReconcileService::class)->ingest($txn, $this->tenant->id);
        $this->assertSame(1, BankTxnInbox::count());
        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(PaymentStatus::Matched, $payment->fresh()->status);
        $this->assertSame('TX-REC', $payment->fresh()->bank_txn_id);
    }
}
