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
use App\Models\User;
use App\Services\Booking\BookingService;
use App\Services\Payment\PaymentService;
use App\Services\Payment\ReconcileService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
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

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    /** A second venue with its OWN receiving bank account (different account_number). */
    private function venueB(): Tenant
    {
        $b = Tenant::create(['name' => 'W', 'slug' => 'w', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        TenantBankConfig::create([
            'tenant_id' => $b->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => '9999', 'account_name' => 'CHU SAN B', 'webhook_secret' => 's', 'active' => true,
        ]);

        return $b;
    }

    public function test_unmatched_page_shows_only_tenant_txns(): void
    {
        $this->venueB();

        // Pending txn into tenant A's account (processed_at NULL, note NULL) — must appear.
        BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-A', 'account_number' => '0123',
            'amount' => 60_000, 'memo' => 'chuyen khoan A',
        ]);
        // Pending txn into tenant B's account — must NOT leak onto A's queue.
        BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-B', 'account_number' => '9999',
            'amount' => 70_000, 'memo' => 'chuyen khoan B',
        ]);

        $this->actingAs($this->owner($this->tenant))
            ->get('/manager/reconcile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Reconcile/Unmatched')
                ->has('txns', 1)
                ->where('txns.0.memo', 'chuyen khoan A'));
    }

    public function test_unmatched_queue_excludes_dismissed_and_matched_but_keeps_pending(): void
    {
        // (a) Pending, NULL note → appears.
        BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-P', 'account_number' => '0123',
            'amount' => 60_000, 'memo' => 'pending one',
        ]);

        // (b) Dismissed → processed_at set, status 'dismissed' → excluded.
        $dismissed = BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-DIS', 'account_number' => '0123',
            'amount' => 11_000, 'memo' => 'junk',
        ]);
        app(ReconcileService::class)->dismissTxn($dismissed);

        // (c) Manually matched → processed_at set, status 'matched' → excluded.
        [$booking, $payment] = $this->holdAndInit();
        $matched = BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-MT', 'account_number' => '0123',
            'amount' => 60_000, 'memo' => "funds {$booking->code}",
        ]);
        app(ReconcileService::class)->manualMatch($matched, $payment);

        $this->actingAs($this->owner($this->tenant))
            ->get('/manager/reconcile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('txns', 1)
                ->where('txns.0.memo', 'pending one'));
    }

    public function test_owner_cannot_match_or_dismiss_another_tenants_txn(): void
    {
        $this->venueB();
        $foreign = BankTxnInbox::create([
            'provider' => 'sepay', 'bank_txn_id' => 'TX-FOR', 'account_number' => '9999',
            'amount' => 60_000, 'memo' => 'tenant B money',
        ]);
        // A valid pending booking for tenant A, so match validation passes and the 403 is proven to
        // come from the txn-ownership check rather than from input validation.
        [$bookingA] = $this->holdAndInit();

        $ownerA = $this->owner($this->tenant);

        // Dismissing another tenant's txn → 403.
        $this->actingAs($ownerA)
            ->post("/manager/reconcile/{$foreign->id}/dismiss")
            ->assertForbidden();

        // Matching another tenant's txn (even to A's own booking) → 403.
        $this->actingAs($ownerA)
            ->post('/manager/reconcile/match', [
                'txn_id' => $foreign->id, 'booking_uuid' => $bookingA->uuid,
            ])
            ->assertForbidden();

        // The foreign txn is untouched.
        $this->assertNull($foreign->fresh()->processed_at);
        $this->assertSame(ReconcileService::STATUS_PENDING, $foreign->fresh()->status);
    }
}
