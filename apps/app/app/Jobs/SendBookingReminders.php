<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\NotificationMessage;
use App\Notifications\BookingReminderNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Scheduler (every ~10 min): remind confirmed bookings whose first slot starts within a window —
 * once at ~1 day out, once at ~2h out. De-dup is guaranteed by unique(booking_id, template) in
 * notification_messages, so re-runs never double-send (docs/12 DoD).
 *
 * NOTE (wire-up): slot times are stored venue-wall-clock; when Zalo goes live, offset the window
 * by the tenant timezone (docs/11 #3, single-tz for now).
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
            $until = now()->addMinutes($minutes);

            Booking::query()
                ->where('status', BookingStatus::Confirmed)
                ->whereHas('slots', fn ($q) => $q->where('start_at', '>', now())->where('start_at', '<=', $until))
                ->with('customer')
                ->each(function (Booking $booking) use ($template) {
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
