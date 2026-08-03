<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BookingConfirmed;
use App\Models\Booking;
use App\Notifications\BookingConfirmedNotification;
use App\Support\RlsTenantContext;
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
        RlsTenantContext::run($event->booking->tenant_id, function () use ($event): void {
            $booking = Booking::query()->with('customer')->findOrFail($event->booking->id);

            $booking->customer?->notify(new BookingConfirmedNotification($booking));
        });
    }
}
