<?php

declare(strict_types=1);

namespace Tests\Feature\Payment;

use App\Enums\BookingStatus;
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

    private function seedAndHold(): string
    {
        $tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $court = Court::create(['tenant_id' => $tenant->id, 'name' => 'S', 'court_type' => 'pickleball', 'status' => 'active']);
        $customer = Customer::create(['tenant_id' => $tenant->id, 'phone' => '0900000010', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        TenantBankConfig::create([
            'tenant_id' => $tenant->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => '0123', 'account_name' => 'CHU SAN', 'webhook_secret' => 'secret-token', 'active' => true,
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

        return $booking->code;
    }

    private function payload(string $code, int $amount = 60_000): array
    {
        return [
            'id' => 998877, 'accountNumber' => '0123', 'transferAmount' => $amount,
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
}
