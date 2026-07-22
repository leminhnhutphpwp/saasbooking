<?php

declare(strict_types=1);

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\RecurringSeries;

/**
 * Outcome of generating a series' occurrences: the ones that were held+confirmed, and the
 * dates that couldn't be held (slot already taken) for the owner to resolve by hand.
 */
final class SeriesResult
{
    /**
     * @param  array<int, Booking>  $generated
     * @param  array<int, string>  $conflicts  ISO dates (Y-m-d)
     */
    public function __construct(
        public readonly RecurringSeries $series,
        public readonly array $generated,
        public readonly array $conflicts,
    ) {}
}
