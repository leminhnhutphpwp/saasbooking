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
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RecurrenceOperationsTest extends TestCase
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

    private function makeBooking(Tenant $t, RecurringSeries $series, string|BookingStatus $status = 'confirmed'): Booking
    {
        $statusValue = $status instanceof BookingStatus ? $status->value : $status;

        $booking = Booking::forceCreate([
            'tenant_id' => $t->id,
            'code' => 'SAN-'. strtoupper(bin2hex(random_bytes(3))),
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
            'start_at' => CarbonImmutable::parse('2026-08-04 18:00:00'),
            'end_at' => CarbonImmutable::parse('2026-08-04 19:00:00'),
            'price_snapshot' => 60_000,
            'hold_status' => 'committed',
        ]);

        return $booking;
    }

    // ── Cancel one occurrence ────────────────────────────────────────

    public function test_cancel_occurrence_cancels_booking_and_leaves_series_active(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $booking = $this->makeBooking($t, $series);

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$booking->uuid}")
            ->assertRedirect();

        $this->assertSame(BookingStatus::Cancelled->value, $booking->fresh()->status->value);
        $this->assertSame(SeriesStatus::Active->value, $series->fresh()->status->value);
    }

    public function test_cancel_occurrence_rejects_non_series_booking(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0999999999', 'name' => 'Lẻ']);
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 2', 'court_type' => 'pickleball', 'status' => 'active']);

        // One-off booking (no series).
        $booking = Booking::forceCreate([
            'tenant_id' => $t->id,
            'code' => 'SAN-ONEOFF',
            'customer_id' => $customer->id,
            'series_id' => null,
            'status' => BookingStatus::Confirmed,
            'channel' => 'owner_manual',
            'total_amount' => 60_000,
            'deposit_amount' => 60_000,
            'payment_mode' => 'full',
            'cancel_policy_snapshot' => ['refund_before_hours' => 24, 'refund_pct' => 100],
        ]);

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$booking->uuid}")
            ->assertStatus(422);
    }

    public function test_cancel_occurrence_rejects_already_cancelled_booking(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $booking = $this->makeBooking($t, $series, 'cancelled');

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$booking->uuid}")
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_cancel_occurrence_rejects_cross_tenant(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $seriesB = $this->makeSeries($b);
        $bookingB = $this->makeBooking($b, $seriesB);

        $this->actingAs($this->owner($a))
            ->post("/manager/series/{$seriesB->uuid}/cancel-occurrence/{$bookingB->uuid}")
            ->assertForbidden();
    }

    // ── End remaining series ─────────────────────────────────────────

    public function test_end_series_sets_ended_and_cancels_pending_bookings(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $confirmed = $this->makeBooking($t, $series, 'confirmed');

        // Create a pending_deposit future occurrence.
        $pending = Booking::forceCreate([
            'tenant_id' => $t->id,
            'code' => 'SAN-PEND1',
            'customer_id' => $series->customer_id,
            'series_id' => $series->id,
            'status' => BookingStatus::PendingDeposit,
            'channel' => 'owner_manual',
            'total_amount' => 60_000,
            'deposit_amount' => 60_000,
            'payment_mode' => 'full',
            'cancel_policy_snapshot' => ['refund_before_hours' => 24, 'refund_pct' => 100],
        ]);

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/end")
            ->assertRedirect();

        $this->assertSame(SeriesStatus::Ended, $series->fresh()->status);
        $this->assertSame(BookingStatus::Cancelled, $pending->fresh()->status);
        // Confirmed booking should be untouched.
        $this->assertSame(BookingStatus::Confirmed, $confirmed->fresh()->status);
    }

    public function test_end_series_rejects_already_ended_series(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $series->forceFill(['status' => SeriesStatus::Ended])->save();

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/end")
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_end_series_rejects_cross_tenant(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $seriesB = $this->makeSeries($b);

        $this->actingAs($this->owner($a))
            ->post("/manager/series/{$seriesB->uuid}/end")
            ->assertForbidden();
    }

    // ── Invalid transitions ──────────────────────────────────────────

    public function test_cannot_cancel_occurrence_on_cancelled_series(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $booking = $this->makeBooking($t, $series);

        // Cancel the entire series first.
        $series->forceFill(['status' => SeriesStatus::Cancelled])->save();

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$booking->uuid}")
            ->assertStatus(422);
    }

    public function test_cannot_cancel_completed_booking(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);
        $booking = $this->makeBooking($t, $series, BookingStatus::Completed);

        $this->actingAs($this->owner($t))
            ->post("/manager/series/{$series->uuid}/cancel-occurrence/{$booking->uuid}")
            ->assertRedirect()
            ->assertSessionHas('error');
    }
}
