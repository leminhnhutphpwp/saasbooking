<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Booking\SeriesService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Rolling-horizon generator (Scheduler, daily): materialises series occurrences as they enter
 * the 4-week window — series are never generated to infinity (docs/11 #5).
 */
class GenerateSeriesOccurrences implements ShouldQueue
{
    use Queueable;

    public function handle(SeriesService $series): void
    {
        $series->extendHorizon();
    }
}
