<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Enums\BookingStatus;
use App\Exceptions\SlotTakenException;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * THE #1 guarantee: one court cannot be double-booked for overlapping time. The Postgres
 * exclusion constraint is the arbiter, not app logic — so the loser gets SlotTakenException (409).
 */
class NoDoubleBookTest extends TestCase
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
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000001', 'name' => 'A']);
        PricingRule::create([
            'tenant_id' => $this->tenant->id, 'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5, 6, 7], 'start_local' => '06:00:00', 'end_local' => '23:00:00',
            'price_per_hour' => 60_000, 'priority' => 0,
        ]);
    }

    private function hold(string $start, string $end): Booking
    {
        return $this->svc->createHold($this->tenant, [
            'customer_id' => $this->customer->id,
            'channel' => 'zalo',
            'payment_mode' => 'deposit',
            'slots' => [[
                'court_id' => $this->court->id,
                'start_at' => CarbonImmutable::parse($start),
                'end_at' => CarbonImmutable::parse($end),
            ]],
        ]);
    }

    public function test_overlapping_hold_on_same_court_is_rejected(): void
    {
        $this->hold('2026-07-21 18:00', '2026-07-21 19:00');

        $this->expectException(SlotTakenException::class);
        $this->hold('2026-07-21 18:30', '2026-07-21 19:30');
    }

    public function test_losing_hold_leaves_no_orphan_booking(): void
    {
        $this->hold('2026-07-21 18:00', '2026-07-21 19:00');

        try {
            $this->hold('2026-07-21 18:30', '2026-07-21 19:30');
        } catch (SlotTakenException) {
            // expected — the whole transaction rolls back
        }

        $this->assertSame(1, Booking::count());
        $this->assertSame(1, BookingSlot::count());
    }

    public function test_adjacent_non_overlapping_slots_both_succeed(): void
    {
        $this->hold('2026-07-21 18:00', '2026-07-21 19:00');
        $this->hold('2026-07-21 19:00', '2026-07-21 20:00'); // [) ranges — no overlap

        $this->assertSame(2, BookingSlot::count());
    }

    public function test_released_slot_can_be_rebooked(): void
    {
        $first = $this->hold('2026-07-21 18:00', '2026-07-21 19:00');
        $this->svc->release($first);

        $second = $this->hold('2026-07-21 18:00', '2026-07-21 19:00');
        $this->assertNotNull($second->id);
    }

    public function test_hold_snapshots_price_and_starts_pending_with_ttl(): void
    {
        $booking = $this->hold('2026-07-21 18:00', '2026-07-21 19:00');

        $this->assertSame(BookingStatus::PendingDeposit, $booking->status);
        $this->assertSame(60_000, $booking->total_amount);
        $this->assertNotNull($booking->hold_expires_at);
        $this->assertStringStartsWith('SAN-', $booking->code);
        $this->assertSame(60_000, BookingSlot::first()->price_snapshot);
    }

    /**
     * A genuine two-CONNECTION race (two open transactions on separate PDO handles committing the
     * same overlapping range in parallel) is impractical in this harness, so we assert the DB
     * contract directly instead — as the task permits. Why the true race can't run here:
     *   - RefreshDatabase wraps each test in ONE uncommitted transaction on the default connection,
     *     so a second real connection cannot see the tenant/court/booking fixtures (never committed);
     *     committing fixtures on a side connection would leak rows RefreshDatabase can't roll back
     *     and force a forbidden manual wipe.
     *   - An EXCLUDE INSERT against a still-open first transaction BLOCKS synchronously until that
     *     transaction ends — single-threaded PHP cannot run the two truly in parallel.
     *
     * So this pins the exact database contract the concurrency guard depends on: a second
     * overlapping INSERT for the same court+range raises SQLSTATE 23P01 (exclusion_violation) at
     * the DB layer — the code ResourceTimeSlotDriver / confirmDeposit map to SlotTakenException
     * (409). The sequential-hold test above covers the service mapping; PublicBookingTest covers
     * the HTTP surface.
     */
    public function test_exclusion_constraint_raises_23_p01_at_the_database(): void
    {
        $booking = $this->hold('2026-07-21 18:00', '2026-07-21 19:00');

        try {
            // Raw INSERT of an OVERLAPPING holding slot for the same court+range. Wrapped in a
            // savepoint so the violation aborts only this nested transaction, not the outer
            // RefreshDatabase wrapper — leaving it usable for the assertion below.
            DB::transaction(function () use ($booking) {
                DB::insert(
                    'INSERT INTO booking_slots (tenant_id, booking_id, court_id, start_at, end_at, price_snapshot, hold_status)
                     VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$this->tenant->id, $booking->id, $this->court->id, '2026-07-21 18:30:00', '2026-07-21 19:30:00', 60_000, 'holding'],
                );
            });
            $this->fail('Expected an exclusion_violation (23P01) but the overlapping INSERT succeeded.');
        } catch (QueryException $e) {
            $this->assertSame('23P01', $e->getCode());
        }

        // The loser left no row — the winning hold is still the only slot.
        $this->assertSame(1, BookingSlot::count());
    }
}
