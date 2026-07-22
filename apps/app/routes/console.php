<?php

use App\Jobs\ExpireStaleHolds;
use App\Jobs\GenerateSeriesOccurrences;
use App\Jobs\SendBookingReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Free expired holds every minute so their court+time range becomes bookable again.
Schedule::job(new ExpireStaleHolds)->everyMinute();

// Materialise recurring-series occurrences as they enter the rolling horizon.
Schedule::job(new GenerateSeriesOccurrences)->dailyAt('01:00');

// Send Zalo ZNS reminders (1 day / 2 hours before), de-duped per booking.
Schedule::job(new SendBookingReminders)->everyTenMinutes();
