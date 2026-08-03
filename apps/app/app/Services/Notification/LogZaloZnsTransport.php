<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Contracts\ZaloZnsTransport;
use App\Models\NotificationMessage;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Phase-1 default: record what WOULD be sent into notification_messages and log it. Swap this
 * binding for an HTTP transport once the Zalo OA + ZNS templates are approved — the rest of the
 * pipeline is unchanged. The unique(booking_id, template) row is also the reminder de-dup.
 */
class LogZaloZnsTransport implements ZaloZnsTransport
{
    public function send(object $notifiable, ?string $to, array $message): void
    {
        try {
            DB::transaction(fn () => NotificationMessage::create([
                'tenant_id' => $notifiable->tenant_id,
                'customer_id' => $notifiable->getKey(),
                'booking_id' => $message['booking_id'] ?? null,
                'channel' => 'zalo_zns',
                'template' => $message['template'],
                'recipient' => $to,
                'payload' => $message['params'] ?? [],
                'status' => 'sent',
                'attempts' => 1,
                'last_attempted_at' => now(),
                'sent_at' => now(),
            ]));
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return; // already sent this (booking, template) — idempotent
            }
            throw $e;
        }

        Log::info('ZNS (log transport)', ['to' => $to, 'template' => $message['template']]);
    }
}
