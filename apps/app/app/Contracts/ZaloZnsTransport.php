<?php

declare(strict_types=1);

namespace App\Contracts;

/**
 * Sends a ZNS message. Phase-1 default is a log/record transport (LogZaloZnsTransport); the
 * real HTTP transport (Zalo OA token + approved template) is bound here at wire-up time —
 * nothing else in the notification pipeline changes.
 */
interface ZaloZnsTransport
{
    /**
     * @param  array{template:string, params?:array, booking_id?:int}  $message
     */
    public function send(object $notifiable, ?string $to, array $message): void;
}
