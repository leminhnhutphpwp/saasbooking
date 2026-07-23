<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\NotificationMessage;
use App\Notifications\BookingReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Scheduler (every ~10 min): remind confirmed bookings whose first slot starts within a window —
 * once at ~1 day out, once at ~2h out. De-dup is guaranteed by unique(booking_id, template) in
 * notification_messages, so re-runs never double-send (docs/12 DoD).
 *
 * Slot times are stored wall-as-UTC (venue wall-clock digits, no offset — single-tz Phase 1,
 * docs/11 #3), so the window is evaluated against the VENUE wall-clock "now" relabeled naive,
 * per booking, NOT against real UTC now().
 */
class SendBookingReminders implements ShouldQueue
{
    use Queueable;

    /** @var array<int, array{0:string,1:int}> template => minutes-before */
    private array $windows = [
        ['reminder_1day', 1440],
        ['reminder_2h', 120],
    ];

    public function handle(): void
    {
        foreach ($this->windows as [$template, $minutes]) {
            // Loose UTC prefilter (± a day) to bound the candidate set across any tenant tz; the
            // precise wall-clock window is applied per booking in PHP below.
            Booking::query()
                ->where('status', BookingStatus::Confirmed)
                ->whereHas('slots', fn ($q) => $q
                    ->where('start_at', '>', now()->subDay())
                    ->where('start_at', '<=', now()->addMinutes($minutes)->addDay()))
                ->with(['customer', 'slots', 'tenant'])
                ->each(function (Booking $booking) use ($template, $minutes) {
                    // Venue wall-clock "now" relabeled naive, compared to the naive-stored start_at.
                    $tz = $booking->tenant?->timezone ?: 'Asia/Ho_Chi_Minh';
                    $wallNow = CarbonImmutable::parse(CarbonImmutable::now($tz)->format('Y-m-d H:i:s'));
                    $windowEnd = $wallNow->addMinutes($minutes);

                    $inWindow = $booking->slots->contains(
                        fn ($slot) => $slot->start_at->greaterThan($wallNow)
                            && $slot->start_at->lessThanOrEqualTo($windowEnd),
                    );
                    if (! $inWindow) {
                        return;
                    }

                    $alreadySent = NotificationMessage::where('booking_id', $booking->id)
                        ->where('template', $template)
                        ->exists();
                    if ($alreadySent) {
                        return;
                    }
                    $booking->customer?->notify(new BookingReminderNotification($booking, $template));
                });
        }
    }
}
