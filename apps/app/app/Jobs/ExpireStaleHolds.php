<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Booking\BookingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * Sweeper (Scheduler, every minute): expires pending holds past their TTL and frees the slots
 * so the exclusion constraint stops blocking that range (docs/07).
 */
class ExpireStaleHolds implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public bool $failOnTimeout = true;

    /** @return array<int, int> */
    public function backoff(): array
    {
        return [60, 300];
    }

    /** @return array<int, WithoutOverlapping> */
    public function middleware(): array
    {
        return [(new WithoutOverlapping('expire-stale-holds'))->dontRelease()->expireAfter(90)];
    }

    public function handle(BookingService $bookings): void
    {
        // `expireStaleHolds()` enumerates every tenant and sets RLS context per tenant internally,
        // so it is safe to call directly. (See BookingService / T72.)
        $bookings->expireStaleHolds();
    }
}
