<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Enums\BookingStatus;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\Booking\BookingService;
use App\Services\Payment\PaymentService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    private ?Tenant $lastTenant = null;

    private function seedAndHold(string $slug = 'v', string $accountNumber = '0123', string $secret = 'secret-token'): string
    {
        $tenant = Tenant::create(['name' => 'V '.$slug, 'slug' => $slug, 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'S', 'court_type' => 'pickleball', 'status' => 'active']);
        $customer = Customer::create(['tenant_id' => $tenant->id, 'phone' => '0900000010', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        TenantBankConfig::create([
            'tenant_id' => $tenant->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => $accountNumber, 'account_name' => 'CHU SAN', 'webhook_secret' => $secret, 'active' => true,
        ]);

        $booking = app(BookingService::class)->createHold($tenant, [
            'customer_id' => $customer->id, 'channel' => 'zalo', 'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $court->id,
                'start_at' => CarbonImmutable::parse('2026-07-21 18:00', 'Asia/Ho_Chi_Minh'),
                'end_at' => CarbonImmutable::parse('2026-07-21 19:00', 'Asia/Ho_Chi_Minh'),
            ]],
        ]);
        app(PaymentService::class)->initDeposit($booking);
        $this->lastTenant = $tenant;

        return $booking->code;
    }

    private function payload(string $code, int $amount = 60_000, string $accountNumber = '0123'): array
    {
        return [
            'id' => 998877, 'accountNumber' => $accountNumber, 'transferAmount' => $amount,
            'transferType' => 'in', 'content' => "chuyen tien {$code}",
        ];
    }

    public function test_valid_token_reconciles_and_confirms(): void
    {
        $code = $this->seedAndHold();

        $this->withHeaders(['Authorization' => 'Bearer secret-token'])
            ->postJson('/api/webhooks/sepay', $this->payload($code))
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertSame(BookingStatus::Confirmed, Booking::where('code', $code)->first()->status);
    }

    public function test_invalid_token_is_rejected(): void
    {
        $code = $this->seedAndHold();

        $this->withHeaders(['Authorization' => 'Bearer wrong'])
            ->postJson('/api/webhooks/sepay', $this->payload($code))
            ->assertStatus(401);

        $this->assertSame(BookingStatus::PendingDeposit, Booking::where('code', $code)->first()->status);
    }

    public function test_unsigned_callback_is_rejected_when_a_tenant_credential_is_configured(): void
    {
        $code = $this->seedAndHold();

        $this->postJson('/api/webhooks/sepay', $this->payload($code))
            ->assertStatus(401);

        $this->assertSame(0, BankTxnInbox::count());
        $this->assertSame(BookingStatus::PendingDeposit, Booking::where('code', $code)->first()->status);
    }

    public function test_duplicate_callback_is_acknowledged_without_a_second_settlement(): void
    {
        $code = $this->seedAndHold();
        $payload = $this->payload($code);

        $this->withHeaders(['Authorization' => 'Bearer secret-token'])->postJson('/api/webhooks/sepay', $payload)->assertOk();
        $this->withHeaders(['Authorization' => 'Bearer secret-token'])->postJson('/api/webhooks/sepay', $payload)->assertOk();

        $this->assertSame(1, BankTxnInbox::count());
        $this->assertSame(BookingStatus::Confirmed, Booking::where('code', $code)->first()->status);
    }

    public function test_authenticated_account_cannot_match_a_pending_payment_from_another_tenant(): void
    {
        $this->seedAndHold('san-a', '0123', 'secret-a');
        $tenantA = $this->lastTenant;
        $codeB = $this->seedAndHold('san-b', '0456', 'secret-b');

        $this->withHeaders(['Authorization' => 'Bearer secret-a'])
            ->postJson('/api/webhooks/sepay', $this->payload($codeB, accountNumber: '0123'))
            ->assertOk();

        $this->assertSame(BookingStatus::PendingDeposit, Booking::where('code', $codeB)->first()->status);
        $this->assertDatabaseHas('bank_txn_inbox', [
            'tenant_id' => $tenantA->id,
            'bank_txn_id' => '998877',
            'status' => 'unmatched',
        ]);
    }

    public function test_invalid_payload_is_rejected_before_any_inbox_audit_record_is_written(): void
    {
        $code = $this->seedAndHold();

        $this->withHeaders(['Authorization' => 'Bearer secret-token'])
            ->postJson('/api/webhooks/sepay', $this->payload($code, 0))
            ->assertUnprocessable();

        $this->assertSame(0, BankTxnInbox::count());
    }

    public function test_inbox_audit_payload_is_limited_to_normalized_provider_fields(): void
    {
        $code = $this->seedAndHold();
        $payload = $this->payload($code);
        $payload['unexpected'] = 'do-not-store';

        $this->withHeaders(['Authorization' => 'Bearer secret-token'])
            ->postJson('/api/webhooks/sepay', $payload)
            ->assertOk();

        $this->assertArrayNotHasKey('unexpected', BankTxnInbox::firstOrFail()->payload);
    }
}
