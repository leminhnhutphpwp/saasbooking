<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Enums\HoldStatus;
use App\Enums\SeriesStatus;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use App\Services\Booking\SeriesResult;
use App\Services\Booking\SeriesService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
