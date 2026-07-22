<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;

class BookingCancelled
{
    use Dispatchable;

    public function __construct(public Booking $booking) {}
}
