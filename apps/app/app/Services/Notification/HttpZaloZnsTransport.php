<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Contracts\ZaloZnsTransport;
use App\Models\NotificationMessage;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP transport: posts ZNS template messages to the Zalo Business API.
 *
 * On success (HTTP 200, data.error_code === 0), records the message as 'sent'.
 * On failure (HTTP error or non-zero error_code), records as 'failed' and logs.
 * On 403 (expired token), logs a warning — an operator must refresh the token
 * via Zalo OA console; the message is still recorded so it can be retried later.
 *
 * The DB record is the source of truth (idempotent via unique(booking_id, template));
 * the HTTP call is best-effort. The log transport (LogZaloZnsTransport) remains as
 * a fallback for local/testing or when ZALO_DRIVER=log.
 */
class HttpZaloZnsTransport implements ZaloZnsTransport
{
    public function send(object $notifiable, ?string $to, array $message): void
    {
        $template = $message['template'] ?? '';
        $params = $message['params'] ?? [];
        $bookingId = $message['booking_id'] ?? null;

        $accessToken = config('zalo.oa.access_token');
        if (! $accessToken) {
            Log::warning('ZNS HTTP transport: missing access_token, falling back to log');
            $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', 'missing_access_token');

            return;
        }

        $templateId = config("zalo.template_ids.{$template}", $template);
        $baseUrl = config('zalo.api.base_url');
        $endpoint = config('zalo.api.send_endpoint');

        try {
            $response = Http::withHeaders([
                'access_token' => $accessToken,
            ])->post("{$baseUrl}{$endpoint}", [
                'recipient' => ['user_id' => $to],
                'template_id' => $templateId,
                'template_data' => $params,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $errorCode = $data['data']['error_code'] ?? -1;

                if ($errorCode === 0) {
                    $this->record($notifiable, $to, $template, $params, $bookingId, 'sent');
                    Log::info('ZNS sent', ['to' => $to, 'template' => $template]);
                } else {
                    $errorMsg = $data['data']['error_message'] ?? 'unknown';
                    $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', "error_code={$errorCode}: {$errorMsg}");
                    Log::warning('ZNS send failed', ['to' => $to, 'template' => $template, 'error_code' => $errorCode, 'message' => $errorMsg]);
                }
            } elseif ($response->status() === 403) {
                $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', 'token_expired');
                Log::warning('ZNS token expired — refresh required', ['to' => $to, 'template' => $template]);
            } else {
                $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', "http_{$response->status()}");
                Log::warning('ZNS HTTP error', ['to' => $to, 'template' => $template, 'status' => $response->status()]);
            }
        } catch (QueryException $e) {
            if ($e->getCode() === '23505') {
                return; // already sent this (booking, template) — idempotent
            }
            throw $e;
        }
    }

    private function record(
        object $notifiable,
        ?string $to,
        string $template,
        array $params,
        ?int $bookingId,
        string $status,
        ?string $error = null
    ): void {
        $payload = $params;
        if ($error) {
            $payload['error'] = $error;
        }

        NotificationMessage::updateOrCreate(
            [
                'tenant_id' => $notifiable->tenant_id,
                'booking_id' => $bookingId,
                'template' => $template,
            ],
            [
                'customer_id' => $notifiable->getKey(),
                'channel' => 'zalo_zns',
                'recipient' => $to,
                'payload' => $payload,
                'status' => $status,
                'sent_at' => $status === 'sent' ? now() : null,
            ]
        );
    }
}
