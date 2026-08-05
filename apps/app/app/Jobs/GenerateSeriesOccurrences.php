<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant;
use App\Services\Booking\SeriesService;
use App\Support\RlsTenantContext;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * Rolling-horizon generator (Scheduler, daily): materialises series occurrences as they enter
 * the 4-week window — series are never generated to infinity (docs/11 #5).
 */
class GenerateSeriesOccurrences implements ShouldQueue
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
        return [(new WithoutOverlapping('generate-series-occurrences'))->dontRelease()->expireAfter(90)];
    }

    public function handle(SeriesService $series): void
    {
        Tenant::query()->select('id')->eachById(
            fn (Tenant $tenant) => RlsTenantContext::run($tenant->id, fn () => $series->extendHorizon()),
        );
    }
}
