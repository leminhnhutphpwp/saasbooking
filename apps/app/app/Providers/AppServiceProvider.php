<?php

namespace App\Providers;

use App\Contracts\ZaloZnsTransport;
use App\Events\BookingConfirmed;
use App\Listeners\SendBookingConfirmation;
use App\Services\Notification\LogZaloZnsTransport;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Phase-1 ZNS transport = log/record. Swap for an HTTP transport at Zalo wire-up time.
        $this->app->bind(ZaloZnsTransport::class, LogZaloZnsTransport::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Event::listen(BookingConfirmed::class, SendBookingConfirmation::class);
    }
}
