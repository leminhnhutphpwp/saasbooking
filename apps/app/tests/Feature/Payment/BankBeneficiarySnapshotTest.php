<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Booking\BookingService;
use App\Services\Payment\PaymentService;
use App\Support\VietQr;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankBeneficiarySnapshotTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    private TenantBankConfig $oldConfig;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Sân A', 'slug' => 'san-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000001', 'name' => 'Nguyen Van A']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        $this->oldConfig = TenantBankConfig::create([
            'tenant_id' => $this->tenant->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => '0123', 'account_name' => 'OLD RECIPIENT', 'webhook_secret' => 'old-webhook-secret', 'active' => true,
        ]);
    }

    public function test_rotated_bank_config_keeps_pending_qr_stable_and_new_deposits_use_new_recipient(): void
    {
        $oldBooking = $this->createBooking(18);
        $oldPayment = app(PaymentService::class)->initDeposit($oldBooking)['payment'];

        $this->oldConfig->update(['active' => false]);
        $newConfig = TenantBankConfig::create([
            'tenant_id' => $this->tenant->id, 'provider' => 'sepay', 'bank_bin' => '970407',
            'account_number' => '9876', 'account_name' => 'NEW RECIPIENT', 'webhook_secret' => 'new-webhook-secret', 'active' => true,
        ]);
        $newBooking = $this->createBooking(19);
        $newPayment = app(PaymentService::class)->initDeposit($newBooking)['payment'];

        $this->assertSame($this->oldConfig->id, $oldPayment->recipient_bank_config_id);
        $this->assertSame('0123', $oldPayment->recipient_account_number);
        $this->assertSame('9876', $newPayment->recipient_account_number);
        $this->assertSame($newConfig->id, $newPayment->recipient_bank_config_id);
        $this->assertArrayNotHasKey('webhook_secret', $oldPayment->getAttributes());

        $this->assertStatusRecipient($oldBooking, '0123', 'OLD RECIPIENT', '970422');
        $this->assertStatusRecipient($newBooking, '9876', 'NEW RECIPIENT', '970407');

        // The old account remains reconcilable only for this awaiting snapshot after rotation.
        $this->withHeaders(['Authorization' => 'Bearer old-webhook-secret'])
            ->postJson('/api/webhooks/sepay', [
                'id' => 'old-account-txn', 'accountNumber' => '0123', 'transferAmount' => 60_000,
                'transferType' => 'in', 'content' => "transfer {$oldBooking->code}",
            ])
            ->assertOk();

        $this->assertSame(BookingStatus::Confirmed, $oldBooking->fresh()->status);
    }

    public function test_legacy_payment_safely_falls_back_to_the_current_active_recipient(): void
    {
        $booking = $this->createBooking(18);
        Payment::forceCreate([
            'tenant_id' => $this->tenant->id,
            'booking_id' => $booking->id,
            'method' => PaymentMethod::VietQr,
            'amount' => 60_000,
            'status' => PaymentStatus::Awaiting,
            'memo_ref' => $booking->code,
        ]);

        $this->assertStatusRecipient($booking, '0123', 'OLD RECIPIENT', '970422');
    }

    private function createBooking(int $hour): Booking
    {
        $start = CarbonImmutable::now('Asia/Ho_Chi_Minh')->addDay()->setTime($hour, 0);

        return app(BookingService::class)->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => $start,
                'end_at' => $start->addHour(),
            ]],
        ]);
    }

    private function assertStatusRecipient(Booking $booking, string $number, string $name, string $bankBin): void
    {
        $booking->load('customer');
        $token = hash_hmac('sha256', "{$booking->code}:{$booking->customer->code}", config('app.key'));

        $this->get("/book/{$this->tenant->slug}/status/{$booking->code}?token={$token}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('account.number', $number)
                ->where('account.name', $name)
                ->where('qr', VietQr::payload($bankBin, $number, 60_000, $booking->code)));
    }
}
