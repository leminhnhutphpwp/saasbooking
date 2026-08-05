<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Booking;
use App\Notifications\Channels\ZaloZnsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingConfirmedNotification extends Notification
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(public Booking $booking)
    {
        $this->afterCommit = true;
    }

    public function via(object $notifiable): array
    {
        return [ZaloZnsChannel::class];
    }

    /** @return array<int, int> */
    public function backoff(): array
    {
        return [60, 300];
    }

    /** @return array{template:string, booking_id:int, params:array} */
    public function toZaloZns(object $notifiable): array
    {
        return [
            'template' => 'booking_confirmed',
            'booking_id' => $this->booking->id,
            'params' => [
                'code' => $this->booking->code,
                'amount' => $this->booking->total_amount,
            ],
        ];
    }
}
