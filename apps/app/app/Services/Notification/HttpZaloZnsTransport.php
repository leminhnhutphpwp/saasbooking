<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Contracts\ZaloZnsTransport;
use App\Models\NotificationMessage;
use App\Models\ZaloOaConfig;
use Illuminate\Database\QueryException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP transport: posts ZNS template messages to the Zalo Business API.
 *
 * Each request resolves the customer tenant's active OA configuration and the logical-template
 * mapping stored with it. Global configuration selects only this transport and API endpoint.
 * Configuration and permanent provider failures are recorded for manual redrive; transient
 * provider failures are also rethrown so Laravel retries the queued notification.
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
        $tenantId = (int) ($notifiable->tenant_id ?? 0);

        if (! $tenantId) {
            throw new ZaloZnsDeliveryException('ZNS recipient has no tenant context.');
        }

        $config = ZaloOaConfig::query()->where('tenant_id', $tenantId)->first();
        $failureReason = $this->configurationFailureReason($config, $template, $to);
        if ($failureReason) {
            $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', $failureReason);
            Log::warning('ZNS delivery unavailable', ['tenant_id' => $tenantId, 'template' => $template, 'reason' => $failureReason]);

            return;
        }

        $templateId = $config->templateId($template);
        $baseUrl = config('zalo.api.base_url');
        $endpoint = config('zalo.api.send_endpoint');

        try {
            $response = Http::withHeaders([
                'access_token' => $config->access_token,
            ])->timeout((int) config('zalo.api.timeout_seconds'))->post("{$baseUrl}{$endpoint}", [
                'recipient' => ['user_id' => $to],
                'template_id' => $templateId,
                'template_data' => $params,
            ]);

            if ($response->successful() && ($response->json('data.error_code') === 0)) {
                $this->record($notifiable, $to, $template, $params, $bookingId, 'sent');
                Log::info('ZNS sent', ['tenant_id' => $tenantId, 'template' => $template]);

                return;
            }

            $reason = $response->successful()
                ? 'provider_rejected'
                : 'provider_http_'.$response->status();
            $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', $reason);

            if ($response->serverError() || $response->tooManyRequests()) {
                throw new ZaloZnsDeliveryException("ZNS transient failure: {$reason}");
            }

            Log::warning('ZNS delivery rejected', ['tenant_id' => $tenantId, 'template' => $template, 'reason' => $reason]);
        } catch (ConnectionException $exception) {
            $this->record($notifiable, $to, $template, $params, $bookingId, 'failed', 'provider_connection_failed');
            Log::warning('ZNS connection failed', ['tenant_id' => $tenantId, 'template' => $template]);

            throw new ZaloZnsDeliveryException('ZNS connection failed.', previous: $exception);
        } catch (ZaloZnsDeliveryException $exception) {
            throw $exception;
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23505') {
                return;
            }

            throw $exception;
        }
    }

    private function configurationFailureReason(?ZaloOaConfig $config, string $template, ?string $to): ?string
    {
        if (! $to) {
            return 'recipient_missing';
        }

        if (! $config) {
            return 'configuration_missing';
        }

        if (! $config->active) {
            return 'configuration_inactive';
        }

        if (! $config->oa_id || ! $config->access_token || ! $config->templateId($template)) {
            return 'configuration_incomplete';
        }

        if ($config->token_expires_at?->isPast()) {
            return 'access_token_expired';
        }

        return null;
    }

    private function record(
        object $notifiable,
        ?string $to,
        string $template,
        array $params,
        ?int $bookingId,
        string $status,
        ?string $failureReason = null
    ): void {
        try {
            $record = NotificationMessage::firstOrNew([
                'tenant_id' => $notifiable->tenant_id,
                'booking_id' => $bookingId,
                'template' => $template,
            ]);
            $record->fill([
                'customer_id' => $notifiable->getKey(),
                'channel' => 'zalo_zns',
                'recipient' => $to,
                'payload' => $params,
                'status' => $status,
                'attempts' => ((int) $record->attempts) + 1,
                'failure_reason' => $failureReason,
                'last_attempted_at' => now(),
                'sent_at' => $status === 'sent' ? now() : null,
            ]);
            $record->save();
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23505') {
                return;
            }

            throw $exception;
        }
    }
}
