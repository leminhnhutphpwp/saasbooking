<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;

/** Deposit reconciled → booking confirmed. Listeners (M5) send the Zalo ZNS afterCommit. */
class BookingConfirmed
{
    use Dispatchable;

    public function __construct(public Booking $booking) {}
}
