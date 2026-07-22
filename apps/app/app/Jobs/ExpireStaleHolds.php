<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Booking\BookingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Sweeper (Scheduler, every minute): expires pending holds past their TTL and frees the slots
 * so the exclusion constraint stops blocking that range (docs/07).
 */
class ExpireStaleHolds implements ShouldQueue
{
    use Queueable;

    public function handle(BookingService $bookings): void
    {
        $bookings->expireStaleHolds();
    }
}
