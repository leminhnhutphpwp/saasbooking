<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Models\Blackout;
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
        $date = $this->bookingDate();

        $response = $this->post('/book/venue-a/hold', [
            'name' => 'Nguyen Van A',
            'phone' => '0912345678',
            'court_id' => $this->court->id,
            'start_at' => "{$date} 18:00:00",
            'end_at' => "{$date} 19:00:00",
        ]);

        $response->assertRedirect()->assertSessionDoesntHaveErrors();
        $this->assertDatabaseHas('customers', ['tenant_id' => $this->tenant->id, 'phone' => '0912345678']);
        $this->assertDatabaseHas('bookings', ['tenant_id' => $this->tenant->id, 'status' => 'pending_deposit']);
        $this->assertDatabaseHas('payments', ['tenant_id' => $this->tenant->id, 'method' => 'vietqr', 'status' => 'awaiting']);
    }

    public function test_status_page_shows_qr_and_booking(): void
    {
        $date = $this->bookingDate();

        $this->post('/book/venue-a/hold', [
            'name' => 'An', 'phone' => '0912345678', 'court_id' => $this->court->id,
            'start_at' => "{$date} 18:00:00", 'end_at' => "{$date} 19:00:00",
        ]);
        $code = Booking::where('tenant_id', $this->tenant->id)->value('code');

        // Get customer code for token generation
        $booking = Booking::with('customer')->where('tenant_id', $this->tenant->id)
            ->where('code', $code)->first();
        $customerCode = $booking->customer->code;

        // Generate HMAC token
        $token = hash_hmac('sha256', "{$code}:{$customerCode}", config('app.key'));

        $this->get("/book/venue-a/status/{$code}?token={$token}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Public/Booking/Status')
                ->where('booking.code', $code)
                ->where('booking.deposit', 60_000)
                ->whereType('qr', 'string'));
    }

    public function test_hold_on_a_taken_slot_redirects_back_with_error_and_creates_no_second_booking(): void
    {
        $date = $this->bookingDate();

        // First player holds 18:00–19:00.
        $this->post('/book/venue-a/hold', [
            'name' => 'Nguyen Van A', 'phone' => '0912345678', 'court_id' => $this->court->id,
            'start_at' => "{$date} 18:00:00", 'end_at' => "{$date} 19:00:00",
        ])->assertRedirect();

        $this->assertSame(1, Booking::where('tenant_id', $this->tenant->id)->count());

        // Second player tries an OVERLAPPING slot on the same court. createHold loses the race
        // (SlotTakenException); the controller catches it and redirects back with an 'error' flash —
        // no exception leaks and the booking row rolls back, so there is still exactly one booking.
        $response = $this->post('/book/venue-a/hold', [
            'name' => 'Tran Thi B', 'phone' => '0900000002', 'court_id' => $this->court->id,
            'start_at' => "{$date} 18:00:00", 'end_at' => "{$date} 19:00:00",
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertSame(1, Booking::where('tenant_id', $this->tenant->id)->count());
    }

    public function test_hold_rejects_slots_that_are_not_bookable(): void
    {
        $date = $this->bookingDate();
        Blackout::create([
            'tenant_id' => $this->tenant->id,
            'court_id' => $this->court->id,
            'starts_at' => "{$date} 19:00:00",
            'ends_at' => "{$date} 20:00:00",
            'reason' => 'Bảo trì',
        ]);

        foreach ([
            ['start' => "{$date} 17:00:00", 'end' => "{$date} 18:00:00"],
            ['start' => "{$date} 19:00:00", 'end' => "{$date} 20:00:00"],
            ['start' => "{$date} 18:00:00", 'end' => "{$date} 19:30:00"],
            ['start' => "{$date} 18:30:00", 'end' => "{$date} 19:30:00"],
            ['start' => now($this->tenant->timezone)->subHour()->format('Y-m-d H:i:s'), 'end' => now($this->tenant->timezone)->addHour()->format('Y-m-d H:i:s')],
        ] as $slot) {
            $this->post('/book/venue-a/hold', [
                'name' => 'Nguyen Van A',
                'phone' => '0912345678',
                'court_id' => $this->court->id,
                'start_at' => $slot['start'],
                'end_at' => $slot['end'],
            ])->assertSessionHasErrors('start_at');
        }

        $this->assertDatabaseCount('bookings', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_hold_rejects_a_non_active_court(): void
    {
        $this->court->update(['status' => 'maintenance']);
        $date = $this->bookingDate();

        $this->post('/book/venue-a/hold', [
            'name' => 'Nguyen Van A',
            'phone' => '0912345678',
            'court_id' => $this->court->id,
            'start_at' => "{$date} 18:00:00",
            'end_at' => "{$date} 19:00:00",
        ])->assertSessionHasErrors('court_id');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_customer_history_is_not_available_without_authenticated_or_signed_access(): void
    {
        $this->get('/book/venue-a/cus-KH0001')->assertNotFound();
    }

    private function bookingDate(): string
    {
        return now($this->tenant->timezone)->addDay()->toDateString();
    }
}
