<?php

use App\Jobs\ExpireStaleHolds;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Free expired holds every minute so their court+time range becomes bookable again.
Schedule::job(new ExpireStaleHolds)->everyMinute();
