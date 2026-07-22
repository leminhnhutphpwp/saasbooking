<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\Booking;
use Carbon\CarbonInterface;

/**
 * The per-inventory-shape engine behind BookingService. Phase 1 has ResourceTimeSlotDriver
 * (courts); capacity/session (golf tee-time) is a reserved door — add a driver + a config
 * entry, never edit the core (docs/08 §0, docs/09).
 */
interface InventoryDriver
{
    /**
     * Hold the given slots for the booking. MUST be atomic and throw SlotTakenException when a
     * slot loses the race (Postgres exclusion constraint is the arbiter — no check-then-act).
     *
     * @param  array<int, array{court_id:int, start_at:CarbonInterface, end_at:CarbonInterface, price_snapshot:int}>  $slots
     */
    public function hold(Booking $booking, array $slots): void;

    /** Free the booking's slots (expired / cancelled) so their range is bookable again. */
    public function release(Booking $booking): void;

    /** Commit the booking's slots (deposit confirmed). */
    public function commit(Booking $booking): void;
}
