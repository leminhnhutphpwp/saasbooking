<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\HoldStatus;
use App\Events\BookingCancelled;
use App\Events\BookingConfirmed;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use App\Support\RlsTenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BookingLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private BookingService $svc;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->svc = app(BookingService::class);
        $this->tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000002', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
            'price_per_hour' => 60_000, 'priority' => 0,
        ]);
    }

    private function hold(): Booking
    {
        return $this->svc->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse('2026-07-21 18:00'),
                'end_at' => CarbonImmutable::parse('2026-07-21 19:00'),
            ]],
        ]);
    }

    public function test_confirm_deposit_commits_slots_and_fires_event(): void
    {
        Event::fake([BookingConfirmed::class]);
        $booking = $this->hold();

        $this->svc->confirmDeposit($booking);

        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertNull($booking->fresh()->hold_expires_at);
        $this->assertSame(HoldStatus::Committed, BookingSlot::first()->hold_status);
        Event::assertDispatched(BookingConfirmed::class);
    }

    public function test_expire_stale_holds_releases_slot_and_frees_range(): void
    {
        $booking = $this->hold();
        $booking->update(['hold_expires_at' => now()->subMinute()]);

        $freed = $this->svc->expireStaleHolds();

        $this->assertSame(1, $freed);
        $this->assertSame(BookingStatus::Expired, $booking->fresh()->status);
        $this->assertSame(HoldStatus::Released, BookingSlot::first()->hold_status);

        // freed range is bookable again
        $again = $this->hold();
        $this->assertSame(BookingStatus::PendingDeposit, $again->status);
    }

    public function test_expiry_does_not_release_a_booking_confirmed_after_it_became_stale(): void
    {
        $booking = $this->hold();
        $booking->update(['hold_expires_at' => now()->subMinute()]);

        $this->svc->confirmDeposit($booking);

        $this->assertSame(0, $this->svc->expireStaleHolds());
        $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
        $this->assertSame(HoldStatus::Committed, BookingSlot::first()->hold_status);
    }

    public function test_cancel_releases_slot_and_fires_event(): void
    {
        Event::fake([BookingCancelled::class]);
        $booking = $this->hold();

        $this->svc->cancel($booking, CancelReason::CustomerCancel);

        $this->assertSame(BookingStatus::Cancelled, $booking->fresh()->status);
        $this->assertSame(HoldStatus::Released, BookingSlot::first()->hold_status);
        Event::assertDispatched(BookingCancelled::class);
    }

    public function test_mark_no_show_updates_booking(): void
    {
        $booking = $this->hold();

        $this->svc->markNoShow($booking);

        $this->assertSame(BookingStatus::NoShow, $booking->fresh()->status);
    }

    /**
     * Regression for the RLS cross-tenant gap (T72). `expireStaleHolds()` enumerates tenant-scoped
     * tables; under the runtime role `san_app` (NOBYPASSRLS) a context-less query returns ZERO rows,
     * so stale holds would never be released in production. Runs on the RLS-enforced `pgsql`
     * connection and asserts the hold IS expired. Fails on the pre-fix code (returns 0 under RLS).
     */
    public function test_expire_stale_holds_runs_under_rls_per_tenant(): void
    {
        if (! DB::connection('pgsql')->selectOne('SELECT 1 FROM pg_roles WHERE rolname = ?', ['san_app'])) {
            $this->markTestSkipped('san_app role not provisioned');
        }

        $previousDefault = config('database.default');
        $previousDb = config('database.connections.pgsql.database');
        config(['database.default' => 'pgsql', 'database.connections.pgsql.database' => 'san_test']);

        // Manual transaction so the seeded rows are ROLLED BACK (DB::transaction would commit and
        // pollute the shared san_test database for the other tests).
        DB::connection('pgsql')->beginTransaction();
        try {
            $tenant = Tenant::create(['name' => 'RLS-V', 'slug' => 'rls-v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);

            $bookingId = RlsTenantContext::run($tenant->id, function () use ($tenant) {
                $court = Court::create([
                    'tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active',
                ]);
                $customer = Customer::create([
                    'tenant_id' => $tenant->id, 'phone' => '0900000098', 'name' => 'A',
                ]);
                PricingRule::create([
                    'tenant_id' => $tenant->id, 'court_id' => null,
                    'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
                    'price_per_hour' => 60_000, 'priority' => 0,
                ]);

                $booking = $this->svc->createHold($tenant, [
                    'customer_id' => $customer->id,
                    'channel' => 'zalo',
                    'payment_mode' => 'deposit',
                    'slots' => [[
                        'court_id' => $court->id,
                        'start_at' => CarbonImmutable::parse('2026-07-21 18:00'),
                        'end_at' => CarbonImmutable::parse('2026-07-21 19:00'),
                    ]],
                ]);
                $booking->update(['hold_expires_at' => now()->subMinute()]);

                return $booking->id;
            });

            // Clear the leaked context so the call below is context-less until the service sets it.
            DB::connection('pgsql')->select("SELECT set_config('app.tenant_id', '', true)");

            $count = $this->svc->expireStaleHolds();

            $status = Booking::find($bookingId)->status;

            $this->assertSame(1, $count, 'expireStaleHolds must release the stale hold under RLS');
            $this->assertSame(BookingStatus::Expired, $status);
        } finally {
            DB::connection('pgsql')->rollBack();
            config(['database.default' => $previousDefault, 'database.connections.pgsql.database' => $previousDb]);
        }
    }
}
