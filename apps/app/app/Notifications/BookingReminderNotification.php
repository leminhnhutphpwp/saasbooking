<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Channels\ZaloZnsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BookingReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param  string  $template  reminder_1day | reminder_2h */
    public function __construct(public Booking $booking, public string $template)
    {
        $this->afterCommit = true;
    }

    public function via(object $notifiable): array
    {
        return [ZaloZnsChannel::class];
    }

    /** @return array{template:string, booking_id:int, params:array} */
    public function toZaloZns(object $notifiable): array
    {
        return [
            'template' => $this->template,
            'booking_id' => $this->booking->id,
            'params' => ['code' => $this->booking->code],
        ];
    }
}
