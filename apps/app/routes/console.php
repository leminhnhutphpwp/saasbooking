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
Schedule::job(new ExpireStaleHolds)->everyMinute()->withoutOverlapping(2);

// Materialise recurring-series occurrences as they enter the rolling horizon.
Schedule::job(new GenerateSeriesOccurrences)->dailyAt('01:00')->withoutOverlapping(5);

// Send Zalo ZNS reminders (1 day / 2 hours before), de-duped per booking.
Schedule::job(new SendBookingReminders)->everyTenMinutes()->withoutOverlapping(2);

// Daily database backup at 03:00 ICT (local time). The script runs pg_dump
// inside the db container and rotates old backups (keeps last 7 days).
// Requires Docker; the script uses `docker compose exec db pg_dump`.
if (app()->environment(['local', 'staging', 'production'])) {
    Schedule::exec('bash '.base_path('../scripts/backup.sh'))
        ->dailyAt('03:00')
        ->timezone('Asia/Ho_Chi_Minh');
}
