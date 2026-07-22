<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Contracts\ZaloZnsTransport;
use Illuminate\Notifications\Notification;

/**
 * Custom notification channel — delegates to the bound ZaloZnsTransport. A notification opts in
 * by implementing `toZaloZns($notifiable): array` returning {template, params, booking_id}.
 */
class ZaloZnsChannel
{
    public function __construct(private ZaloZnsTransport $transport) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toZaloZns')) {
            return;
        }

        $to = $notifiable->routeNotificationFor('zaloZns', $notification);
        $this->transport->send($notifiable, $to, $notification->toZaloZns($notifiable));
    }
}
