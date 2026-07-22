<?php

declare(strict_types=1);

namespace App\Services\Booking\Drivers;

use App\Contracts\InventoryDriver;
use App\Enums\HoldStatus;
use App\Exceptions\SlotTakenException;
use App\Models\Booking;
use App\Models\BookingSlot;
use Illuminate\Database\QueryException;

/**
 * Courts / spa (resource-time-slot). Anti-double-book = the Postgres EXCLUDE constraint
 * `no_double_book` on booking_slots. A SQLSTATE 23P01 (exclusion_violation) means the slot
 * was lost — surfaced as SlotTakenException (HTTP 409). No SELECT-then-INSERT anywhere.
 */
class ResourceTimeSlotDriver implements InventoryDriver
{
    public function hold(Booking $booking, array $slots): void
    {
        try {
            foreach ($slots as $slot) {
                BookingSlot::create([
                    'tenant_id' => $booking->tenant_id,
                    'booking_id' => $booking->id,
                    'court_id' => $slot['court_id'],
                    'start_at' => $slot['start_at'],
                    'end_at' => $slot['end_at'],
                    'price_snapshot' => $slot['price_snapshot'],
                    'hold_status' => HoldStatus::Holding,
                ]);
            }
        } catch (QueryException $e) {
            if ($e->getCode() === '23P01') {           // exclusion_violation
                throw new SlotTakenException;
            }
            throw $e;
        }
    }

    public function release(Booking $booking): void
    {
        $booking->slots()->update(['hold_status' => HoldStatus::Released]);
    }

    public function commit(Booking $booking): void
    {
        $booking->slots()->update(['hold_status' => HoldStatus::Committed]);
    }
}
