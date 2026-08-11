<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\BookingStatus;
use App\Enums\SeriesStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SeriesControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function venue(string $slug): Tenant
    {
        return Tenant::create(['name' => $slug, 'slug' => $slug, 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
    }

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    private function makeSeries(Tenant $t): RecurringSeries
    {
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0912345678', 'name' => 'Khách']);
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);

        return RecurringSeries::create([
            'tenant_id' => $t->id,
            'customer_id' => $customer->id,
            'court_id' => $court->id,
            'weekday' => 1,
            'start_local' => '18:00',
            'end_local' => '19:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'start_date' => '2026-08-01',
            'end_date' => '2026-12-31',
            'price_per_session_snapshot' => 60_000,
            'deposit_per_session' => 60_000,
            'status' => SeriesStatus::Active,
        ]);
    }

    private function makeBooking(Tenant $t, RecurringSeries $series, CarbonImmutable $startAt, string|BookingStatus $status = 'confirmed'): Booking
    {
        $statusValue = $status instanceof BookingStatus ? $status->value : $status;

        $booking = Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $t->id,
            'code' => 'SAN-'.strtoupper(bin2hex(random_bytes(3))),
            'customer_id' => $series->customer_id,
            'series_id' => $series->id,
            'status' => $statusValue,
            'channel' => 'owner_manual',
            'total_amount' => 60_000,
            'deposit_amount' => 60_000,
            'payment_mode' => 'full',
            'cancel_policy_snapshot' => ['refund_before_hours' => 24, 'refund_pct' => 100],
        ]);

        BookingSlot::forceCreate([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $series->court_id,
            'start_at' => $startAt,
            'end_at' => $startAt->addHour(),
            'price_snapshot' => 60_000,
            'hold_status' => 'committed',
        ]);

        return $booking;
    }

    public function test_destroy_sets_series_cancelled(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $this->actingAs($this->owner($t))
            ->delete("/manager/series/{$series->uuid}")
            ->assertRedirect();

        $this->assertSame(SeriesStatus::Cancelled, $series->fresh()->status);
    }

    public function test_owner_cannot_cancel_other_tenants_series(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $seriesB = $this->makeSeries($b);

        $this->actingAs($this->owner($a))
            ->delete("/manager/series/{$seriesB->uuid}")
            ->assertForbidden();

        $this->assertSame(SeriesStatus::Active, $seriesB->fresh()->status);
    }

    public function test_series_with_no_matching_weekday_in_window_is_rejected(): void
    {
        $t = $this->venue('venue-a');
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0912345678', 'name' => 'Khách']);
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);

        $start = Carbon::today()->addDays(2);
        $end = $start->copy()->addDay();
        $used = [$start->dayOfWeekIso, $end->dayOfWeekIso];
        $badWeekday = collect(range(1, 7))->first(fn (int $d): bool => ! in_array($d, $used, true));

        $this->actingAs($this->owner($t))
            ->from('/manager/series')
            ->post('/manager/series', [
                'customer_id' => $customer->id,
                'court_id' => $court->id,
                'weekday' => $badWeekday,
                'start_local' => '18:00',
                'end_local' => '19:00',
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'deposit_per_session' => 60_000,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors(['end_date']);

        $this->assertSame(0, RecurringSeries::where('tenant_id', $t->id)->count());
    }

    public function test_index_returns_occurrence_props_for_upcoming_bookings(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $futureStart = CarbonImmutable::now()->addWeek()->startOfDay()->setHour(18);
        $confirmed = $this->makeBooking($t, $series, $futureStart, BookingStatus::Confirmed);

        $pendingStart = $futureStart->addWeek();
        $pending = $this->makeBooking($t, $series, $pendingStart, BookingStatus::PendingDeposit);

        $pastStart = CarbonImmutable::now()->subWeek()->startOfDay()->setHour(18);
        $this->makeBooking($t, $series, $pastStart, BookingStatus::Completed);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/series')
            ->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->has('series.0.occurrences', 2)
            ->where('series.0.occurrences.0.uuid', $confirmed->uuid)
            ->where('series.0.occurrences.0.status', 'confirmed')
            ->where('series.0.occurrences.0.can_cancel', true)
            ->where('series.0.occurrences.1.uuid', $pending->uuid)
            ->where('series.0.occurrences.1.status', 'pending_deposit')
            ->where('series.0.occurrences.1.can_cancel', true)
        );
    }

    public function test_index_occurrences_excludes_past_bookings(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $pastStart = CarbonImmutable::now()->subDay()->startOfDay()->setHour(18);
        $this->makeBooking($t, $series, $pastStart, BookingStatus::Confirmed);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/series')
            ->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->has('series.0.occurrences', 0)
        );
    }

    public function test_index_does_not_expose_other_tenants_series(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $this->makeSeries($b);

        $response = $this->actingAs($this->owner($a))
            ->get('/manager/series')
            ->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->has('series', 0)
        );
    }

    public function test_index_occurrence_can_cancel_false_for_completed_booking(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $futureStart = CarbonImmutable::now()->addWeek()->startOfDay()->setHour(18);
        $this->makeBooking($t, $series, $futureStart, BookingStatus::Completed);

        $response = $this->actingAs($this->owner($t))
            ->get('/manager/series')
            ->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->has('series.0.occurrences', 1)
            ->where('series.0.occurrences.0.can_cancel', false)
            ->where('series.0.occurrences.0.status', 'completed')
        );
    }

    public function test_end_series_sets_status_ended_and_keeps_confirmed(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $futureStart = CarbonImmutable::now()->addWeek()->startOfDay()->setHour(18);
        $confirmed = $this->makeBooking($t, $series, $futureStart, BookingStatus::Confirmed);

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/end")
            ->assertRedirect();

        $this->assertSame(SeriesStatus::Ended, $series->fresh()->status);
        $this->assertSame(BookingStatus::Confirmed, $confirmed->fresh()->status);
    }

    public function test_cancel_occurrence_invalid_for_completed_booking(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $futureStart = CarbonImmutable::now()->addWeek()->startOfDay()->setHour(18);
        $completed = $this->makeBooking($t, $series, $futureStart, BookingStatus::Completed);

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$completed->uuid}")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame(BookingStatus::Completed, $completed->fresh()->status);
    }

    public function test_price_snapshot_unchanged_after_occurrence_cancel(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $futureStart = CarbonImmutable::now()->addWeek()->startOfDay()->setHour(18);
        $booking = $this->makeBooking($t, $series, $futureStart, BookingStatus::Confirmed);

        $originalTotal = $booking->total_amount;
        $originalDeposit = $booking->deposit_amount;

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$booking->uuid}")
            ->assertRedirect();

        $fresh = $booking->fresh();
        $this->assertSame($originalTotal, $fresh->total_amount);
        $this->assertSame($originalDeposit, $fresh->deposit_amount);
    }
}
