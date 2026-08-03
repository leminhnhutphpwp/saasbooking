<?php

declare(strict_types=1);

namespace Tests\Feature\Operations;

use App\Jobs\ExpireStaleHolds;
use App\Jobs\GenerateSeriesOccurrences;
use App\Jobs\SendBookingReminders;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OperationalReliabilityTest extends TestCase
{
    public function test_critical_jobs_have_bounded_retry_timeout_and_overlap_policies(): void
    {
        foreach ([new ExpireStaleHolds, new GenerateSeriesOccurrences, new SendBookingReminders] as $job) {
            $this->assertSame(3, $job->tries);
            $this->assertSame(60, $job->timeout);
            $this->assertTrue($job->failOnTimeout);
            $this->assertSame([60, 300], $job->backoff());

            $middleware = $job->middleware()[0];
            $this->assertInstanceOf(WithoutOverlapping::class, $middleware);
            $this->assertNull($middleware->releaseAfter);
            $this->assertSame(90, $middleware->expiresAfter);
        }
    }

    public function test_critical_schedules_use_overlap_mutexes(): void
    {
        $events = collect(app(Schedule::class)->events());

        foreach ([ExpireStaleHolds::class => 2, GenerateSeriesOccurrences::class => 5, SendBookingReminders::class => 2] as $job => $expiresAt) {
            $event = $events->first(fn ($event) => $event->description === $job);

            $this->assertNotNull($event);
            $this->assertTrue($event->withoutOverlapping);
            $this->assertSame($expiresAt, $event->expiresAt);
        }
    }

    public function test_readiness_returns_ready_when_database_and_queue_are_available(): void
    {
        DB::shouldReceive('connection->getPdo')->once()->andReturnTrue();
        Queue::shouldReceive('connection->size')->once()->andReturn(0);

        $this->getJson('/api/ready')
            ->assertOk()
            ->assertExactJson(['status' => 'ready']);
    }

    public function test_readiness_hides_dependency_failures(): void
    {
        DB::shouldReceive('connection->getPdo')->once()->andThrow(new \RuntimeException('database unavailable'));

        $this->getJson('/api/ready')
            ->assertServiceUnavailable()
            ->assertExactJson(['status' => 'not_ready']);
    }
}
