<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingConfirmed;
use App\Notifications\BookingConfirmedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * On deposit confirmation, send the customer a Zalo ZNS confirmation. Queued + afterCommit so a
 * failed send never rolls back the booking (docs/08 §5).
 */
class SendBookingConfirmation implements ShouldQueue
{
    public bool $afterCommit = true;

    public function handle(BookingConfirmed $event): void
    {
        $booking = $event->booking->loadMissing('customer');

        $booking->customer?->notify(new BookingConfirmedNotification($booking));
    }
}
