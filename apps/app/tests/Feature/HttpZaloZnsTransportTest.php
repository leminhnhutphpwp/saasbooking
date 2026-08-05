<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\NotificationMessage;
use App\Models\Tenant;
use App\Models\ZaloOaConfig;
use App\Services\Notification\HttpZaloZnsTransport;
use App\Services\Notification\ZaloZnsDeliveryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HttpZaloZnsTransportTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Customer $customer;

    private HttpZaloZnsTransport $transport;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
        $this->customer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Customer',
            'phone' => '0901234567',
            'email' => 'test@example.com',
        ]);
        $this->transport = new HttpZaloZnsTransport;
    }

    public function test_records_sent_when_zalo_api_success(): void
    {
        $this->configureTenant('tenant-a-token', ['booking_confirmed' => 'tenant-a-confirmation']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => 0, 'error_message' => 'success'],
            ], 200),
        ]);

        $message = ['template' => 'booking_confirmed', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('sent', $record->status);
        $this->assertSame('zalo_zns', $record->channel);
        $this->assertSame('booking_confirmed', $record->template);
        $this->assertSame($this->customer->phone, $record->recipient);
        $this->assertNotNull($record->sent_at);
    }

    public function test_records_failed_when_zalo_api_returns_error_code(): void
    {
        $this->configureTenant('tenant-a-token', ['booking_confirmed' => 'tenant-a-confirmation']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => -216, 'error_message' => 'Invalid template'],
            ], 200),
        ]);

        $message = ['template' => 'booking_confirmed', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('failed', $record->status);
        $this->assertNull($record->sent_at);
        $this->assertSame('provider_rejected', $record->failure_reason);
        $this->assertSame(1, $record->attempts);
    }

    public function test_records_failed_when_zalo_returns_403(): void
    {
        $this->configureTenant('expired-token', ['booking_confirmed' => 'tenant-a-confirmation']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => -216, 'error_message' => 'Token expired'],
            ], 403),
        ]);

        $message = ['template' => 'booking_confirmed', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('failed', $record->status);
        $this->assertSame('provider_http_403', $record->failure_reason);
        $this->assertNull($record->sent_at);
    }

    public function test_records_unavailable_when_tenant_configuration_is_missing(): void
    {
        $message = ['template' => 'booking_confirmed', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('failed', $record->status);
        $this->assertSame('configuration_missing', $record->failure_reason);
        $this->assertNull($record->sent_at);
        Http::assertNothingSent();
    }

    public function test_uses_only_the_notifiable_tenant_configuration_and_mapping(): void
    {
        $this->configureTenant('tenant-a-token', ['booking_confirmed' => 'tenant-a-confirmation']);
        $tenantB = Tenant::create([
            'name' => 'Tenant B',
            'slug' => 'tenant-b',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
        ZaloOaConfig::create([
            'tenant_id' => $tenantB->id,
            'oa_id' => 'tenant-b-oa',
            'access_token' => 'tenant-b-token',
            'templates' => ['booking_confirmed' => 'tenant-b-confirmation'],
            'active' => true,
        ]);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => 0],
            ], 200),
        ]);

        $message = [
            'template' => 'booking_confirmed',
            'params' => ['code' => 'SAN-123', 'customer_name' => 'Test'],
        ];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        Http::assertSent(function ($request) {
            $this->assertSame('https://business.openapi.zalo.me/message/template', $request->url());
            $this->assertTrue($request->hasHeader('access_token', 'tenant-a-token'));
            $this->assertSame($this->customer->phone, $request->data()['recipient']['user_id']);
            $this->assertSame('tenant-a-confirmation', $request->data()['template_id']);
            $this->assertSame('SAN-123', $request->data()['template_data']['code']);

            return true;
        });
    }

    public function test_records_inactive_and_incomplete_tenant_configuration_without_calling_zalo(): void
    {
        $config = $this->configureTenant('tenant-a-token', ['booking_confirmed' => 'tenant-a-confirmation'], active: false);
        $this->transport->send($this->customer, $this->customer->phone, ['template' => 'booking_confirmed']);

        $this->assertSame('configuration_inactive', NotificationMessage::firstOrFail()->failure_reason);
        Http::assertNothingSent();

        $config->update(['active' => true, 'templates' => []]);
        $this->transport->send($this->customer, $this->customer->phone, ['template' => 'reminder_2h']);

        $this->assertSame('configuration_incomplete', NotificationMessage::where('template', 'reminder_2h')->firstOrFail()->failure_reason);
        Http::assertNothingSent();
    }

    public function test_transient_provider_failures_are_recorded_for_each_queued_retry(): void
    {
        $this->configureTenant('tenant-a-token', ['booking_confirmed' => 'tenant-a-confirmation']);
        Http::fake(['business.openapi.zalo.me/*' => Http::response([], 500)]);

        foreach (range(1, 3) as $attempt) {
            try {
                $this->transport->send($this->customer, $this->customer->phone, ['template' => 'booking_confirmed']);
                $this->fail('Expected transient Zalo provider failure to be rethrown for the queue.');
            } catch (ZaloZnsDeliveryException) {
                // Laravel applies the notification's bounded retry/backoff policy.
            }
        }

        $record = NotificationMessage::firstOrFail();
        $this->assertSame('failed', $record->status);
        $this->assertSame('provider_http_500', $record->failure_reason);
        $this->assertSame(3, $record->attempts);
    }

    /** @param  array<string, string>  $templates */
    private function configureTenant(string $accessToken, array $templates, bool $active = true): ZaloOaConfig
    {
        return ZaloOaConfig::create([
            'tenant_id' => $this->tenant->id,
            'oa_id' => 'tenant-a-oa',
            'access_token' => $accessToken,
            'templates' => $templates,
            'active' => $active,
        ]);
    }
}
