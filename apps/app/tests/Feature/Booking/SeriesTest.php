<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\HoldStatus;
use App\Enums\SeriesStatus;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\PricingRule;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use App\Services\Booking\SeriesResult;
use App\Services\Booking\SeriesService;
use App\Support\RlsTenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SeriesTest extends TestCase
{
    use RefreshDatabase;

    private SeriesService $svc;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    private string $tz = 'Asia/Ho_Chi_Minh';

    protected function setUp(): void
    {
        parent::setUp();

        $this->svc = app(SeriesService::class);
        $this->tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => $this->tz, 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000003', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
            'price_per_hour' => 60_000, 'priority' => 0,
        ]);
    }

    private function createSeries(): SeriesResult
    {
        $today = CarbonImmutable::now($this->tz)->startOfDay();

        return $this->svc->create($this->tenant, [
            'customer_id' => $this->customer->id,
            'court_id' => $this->court->id,
            'weekday' => $today->dayOfWeekIso,
            'start_local' => '18:00:00',
            'end_local' => '19:00:00',
            'start_date' => $today->toDateString(),
            'end_date' => $today->addWeeks(3)->toDateString(),   // 4 occurrences within the 4-week horizon
            'payment_mode' => 'full',
        ]);
    }

    public function test_generates_confirmed_weekly_occurrences(): void
    {
        $result = $this->createSeries();

        $this->assertCount(4, $result->generated);
        $this->assertEmpty($result->conflicts);
        $this->assertSame(60_000, $result->series->price_per_session_snapshot);

        foreach ($result->generated as $booking) {
            $this->assertSame(BookingStatus::Confirmed, $booking->fresh()->status);
            $this->assertSame($result->series->id, $booking->series_id);
        }
        $this->assertSame(4, BookingSlot::where('hold_status', HoldStatus::Committed)->count());
    }

    public function test_cancel_one_occurrence_keeps_series_and_others(): void
    {
        $result = $this->createSeries();
        $first = $result->generated[0];

        $this->svc->cancelOccurrence($first);

        $this->assertSame(BookingStatus::Cancelled, $first->fresh()->status);
        $this->assertSame(SeriesStatus::Active, $result->series->fresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $result->generated[1]->fresh()->status);
    }

    public function test_taken_date_becomes_a_conflict_not_a_failure(): void
    {
        $today = CarbonImmutable::now($this->tz)->startOfDay();

        // A one-off already holds today's 18:00–19:00 slot on the same court.
        app(BookingService::class)->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse($today->toDateString().' 18:00:00', $this->tz),
                'end_at' => CarbonImmutable::parse($today->toDateString().' 19:00:00', $this->tz),
            ]],
        ]);

        $result = $this->createSeries();

        $this->assertContains($today->toDateString(), $result->conflicts);
        $this->assertCount(3, $result->generated);   // the other three dates still generated
    }

    public function test_extend_horizon_retries_a_date_whose_conflict_was_later_freed(): void
    {
        $today = CarbonImmutable::now($this->tz)->startOfDay();
        // A date one week past the current horizon, so only extendHorizon can reach it.
        $blockedDate = $today->addWeeks(5);

        $blocker = app(BookingService::class)->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse($blockedDate->toDateString().' 18:00:00', $this->tz),
                'end_at' => CarbonImmutable::parse($blockedDate->toDateString().' 19:00:00', $this->tz),
            ]],
        ]);

        $series = $this->svc->create($this->tenant, [
            'customer_id' => $this->customer->id,
            'court_id' => $this->court->id,
            'weekday' => $today->dayOfWeekIso,
            'start_local' => '18:00:00',
            'end_local' => '19:00:00',
            'start_date' => $today->toDateString(),
            'end_date' => $today->addWeeks(6)->toDateString(),
            'payment_mode' => 'full',
        ])->series;

        // Roll the clock forward so the blocked date falls inside the rolling horizon.
        $this->travelTo(CarbonImmutable::now($this->tz)->addWeeks(2));
        $this->svc->extendHorizon();

        // The blocked date must NOT be silently skipped past: it is still unfulfilled.
        $this->assertDatabaseMissing('bookings', [
            'series_id' => $series->id,
            'status' => BookingStatus::Confirmed->value,
            'code' => $blocker->code,
        ]);
        $this->assertTrue(
            $series->fresh()->generated_through->lessThan($blockedDate),
            'generated_through must not advance past a date that failed to generate.'
        );

        // The blocker goes away; the next horizon run must fill the missed session.
        app(BookingService::class)->cancel($blocker, CancelReason::CustomerCancel);
        $this->svc->extendHorizon();

        $filled = BookingSlot::where('tenant_id', $this->tenant->id)
            ->where('court_id', $this->court->id)
            ->whereIn('hold_status', [HoldStatus::Holding, HoldStatus::Committed])
            ->whereDate('start_at', $blockedDate->toDateString())
            ->exists();

        $this->assertTrue($filled, 'A previously conflicted occurrence must be retried once free.');
    }

    /**
     * Regression for the RLS cross-tenant gap (T72). The runtime role `san_app` is NOBYPASSRLS, so a
     * context-less cross-tenant query against a tenant-scoped table returns ZERO rows — the rolling
     * horizon would silently no-op in production. This runs the service on the RLS-enforced `pgsql`
     * connection and asserts occurrences are generated. It would fail on the pre-fix code (which
     * returns 0 rows under RLS).
     */
    public function test_extend_horizon_generates_under_rls_per_tenant(): void
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
            // `tenants` has no RLS policy, so this create works without context.
            $tenant = Tenant::create([
                'name' => 'RLS-V', 'slug' => 'rls-v', 'timezone' => $this->tz, 'status' => 'active',
            ]);

            // Tenant-scoped rows need app.tenant_id set (RLS WITH CHECK).
            RlsTenantContext::run($tenant->id, function () use ($tenant) {
                $court = Court::create([
                    'tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active',
                ]);
                $customer = Customer::create([
                    'tenant_id' => $tenant->id, 'phone' => '0900000099', 'name' => 'A',
                ]);
                PricingRule::create([
                    'tenant_id' => $tenant->id, 'court_id' => null,
                    'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
                    'price_per_hour' => 60_000, 'priority' => 0,
                ]);
                $today = CarbonImmutable::now($this->tz)->startOfDay();
                RecurringSeries::create([
                    'tenant_id' => $tenant->id, 'customer_id' => $customer->id, 'court_id' => $court->id,
                    'weekday' => $today->dayOfWeekIso, 'start_local' => '18:00:00', 'end_local' => '19:00:00',
                    'tz' => $this->tz, 'start_date' => $today->toDateString(),
                    'end_date' => $today->addWeeks(2)->toDateString(),
                    'price_per_session_snapshot' => 60_000, 'deposit_per_session' => 0,
                    'status' => SeriesStatus::Active->value, 'generated_through' => null,
                ]);
            });

            // The seeding above set app.tenant_id inside its own RlsTenantContext; clear it so the
            // call below is truly context-less until the service sets it per tenant. Without this,
            // the value leaks and masks the RLS gap.
            DB::connection('pgsql')->select("SELECT set_config('app.tenant_id', '', true)");

            // The fixed extendHorizon enumerates tenants and sets context per tenant.
            $created = app(SeriesService::class)->extendHorizon();

            $this->assertGreaterThan(0, $created, 'extendHorizon must generate occurrences under RLS');
        } finally {
            DB::connection('pgsql')->rollBack();
            config(['database.default' => $previousDefault, 'database.connections.pgsql.database' => $previousDb]);
        }
    }
}
