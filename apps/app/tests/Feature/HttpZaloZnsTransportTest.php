<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\NotificationMessage;
use App\Models\Tenant;
use App\Services\Notification\HttpZaloZnsTransport;
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
        config(['zalo.oa.access_token' => 'test-token-123']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => 0, 'error_message' => 'success'],
            ], 200),
        ]);

        $message = ['template' => 'booking_confirmation', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('sent', $record->status);
        $this->assertSame('zalo_zns', $record->channel);
        $this->assertSame('booking_confirmation', $record->template);
        $this->assertSame($this->customer->phone, $record->recipient);
        $this->assertNotNull($record->sent_at);
    }

    public function test_records_failed_when_zalo_api_returns_error_code(): void
    {
        config(['zalo.oa.access_token' => 'test-token-123']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => -216, 'error_message' => 'Invalid template'],
            ], 200),
        ]);

        $message = ['template' => 'booking_confirmation', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('failed', $record->status);
        $this->assertNull($record->sent_at);
        $this->assertArrayHasKey('error', $record->payload);
        $this->assertStringContainsString('-216', $record->payload['error']);
    }

    public function test_records_failed_when_zalo_returns_403(): void
    {
        config(['zalo.oa.access_token' => 'expired-token']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => -216, 'error_message' => 'Token expired'],
            ], 403),
        ]);

        $message = ['template' => 'booking_confirmation', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('failed', $record->status);
        $this->assertSame('token_expired', $record->payload['error']);
        $this->assertNull($record->sent_at);
    }

    public function test_records_failed_when_access_token_missing(): void
    {
        config(['zalo.oa.access_token' => null]);

        $message = ['template' => 'booking_confirmation', 'params' => ['code' => 'SAN-123']];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        $record = NotificationMessage::where('customer_id', $this->customer->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('failed', $record->status);
        $this->assertSame('missing_access_token', $record->payload['error']);
        $this->assertNull($record->sent_at);
    }

    public function test_sends_correct_payload_to_zalo_api(): void
    {
        config(['zalo.oa.access_token' => 'test-token-123']);
        Http::fake([
            'business.openapi.zalo.me/*' => Http::response([
                'data' => ['error_code' => 0],
            ], 200),
        ]);

        $message = [
            'template' => 'booking_confirmation',
            'params' => ['code' => 'SAN-123', 'customer_name' => 'Test'],
        ];
        $this->transport->send($this->customer, $this->customer->phone, $message);

        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->url() === 'https://business.openapi.zalo.me/message/template'
                && $request->hasHeader('access_token', 'test-token-123')
                && $body['recipient']['user_id'] === $this->customer->phone
                && $body['template_id'] === 'booking_confirmation'
                && $body['template_data']['code'] === 'SAN-123';
        });
    }
}
