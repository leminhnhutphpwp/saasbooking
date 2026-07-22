<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Models\Booking;
use App\Models\Court;
use App\Models\OpeningRule;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBookingTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Court $court;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Sân Cầu Lông A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        OpeningRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => $this->court->id, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '18:00:00', 'close_local' => '22:00:00', 'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => '2026-07-20', 'effective_to' => null,
        ]);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);
        TenantBankConfig::create([
            'tenant_id' => $this->tenant->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => '0123', 'account_name' => 'CHU SAN', 'webhook_secret' => 't', 'active' => true,
        ]);
    }

    public function test_show_renders_court_availability(): void
    {
        $this->get('/book/venue-a?date=2026-07-21')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/Booking/Show')
                ->where('tenant.slug', 'venue-a')
                ->has('courts', 1)
                ->has('courts.0.free'));
    }

    public function test_hold_creates_booking_payment_customer_and_redirects(): void
    {
        $response = $this->post('/book/venue-a/hold', [
            'name' => 'Nguyen Van A',
            'phone' => '0912345678',
            'court_id' => $this->court->id,
            'start_at' => '2026-07-21 18:00:00',
            'end_at' => '2026-07-21 19:00:00',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('customers', ['tenant_id' => $this->tenant->id, 'phone' => '0912345678']);
        $this->assertDatabaseHas('bookings', ['tenant_id' => $this->tenant->id, 'status' => 'pending_deposit']);
        $this->assertDatabaseHas('payments', ['tenant_id' => $this->tenant->id, 'method' => 'vietqr', 'status' => 'awaiting']);
    }

    public function test_status_page_shows_qr_and_booking(): void
    {
        $this->post('/book/venue-a/hold', [
            'name' => 'A', 'phone' => '0912345678', 'court_id' => $this->court->id,
            'start_at' => '2026-07-21 18:00:00', 'end_at' => '2026-07-21 19:00:00',
        ]);
        $code = Booking::where('tenant_id', $this->tenant->id)->value('code');

        $this->get("/book/venue-a/status/{$code}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/Booking/Status')
                ->where('booking.code', $code)
                ->where('booking.deposit', 60_000)
                ->whereType('qr', 'string'));
    }
}
