<?php

declare(strict_types=1);

namespace App\Http\Controllers\Webhook;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\TenantBankConfig;
use App\Services\Payment\ReconcileService;
use App\Services\Payment\SePayWebhookAuthenticator;
use App\Support\Messages;
use App\Support\RlsTenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * SePay bank-transaction webhook. The recipient account resolves a single persisted tenant config;
 * its credential is verified before every response, including ignored outbound transactions.
 */
class BankReconcileController extends Controller
{
    public function sepay(
        Request $request,
        ReconcileService $reconcile,
        SePayWebhookAuthenticator $authenticator,
    ): JsonResponse {
        $data = $request->validate([
            'id' => ['required'],
            'accountNumber' => ['required', 'string', 'max:100'],
            'transferAmount' => ['required', 'integer', 'min:1'],
            'content' => ['nullable', 'string', 'max:1000'],
            'transferType' => ['nullable', 'string', 'max:32'],
        ]);

        abort_unless(is_string($data['id']) || is_int($data['id']), 422);
        abort_unless(strlen((string) $data['id']) <= 191, 422);

        // This privileged single-purpose lookup establishes RLS context; no payload tenant is trusted.
        $tenantId = DB::scalar('SELECT app_webhook_tenant_id(?, ?)', ['sepay', $data['accountNumber']]);
        abort_unless(is_numeric($tenantId), 401, Messages::get('webhook', 'invalid_token'));

        return RlsTenantContext::run((int) $tenantId, function () use ($request, $authenticator, $data, $reconcile): JsonResponse {
            $config = TenantBankConfig::query()
                ->where('provider', 'sepay')
                ->where('account_number', $data['accountNumber'])
                ->first();

            abort_unless(
                $config && $authenticator->authenticate($request, $config),
                401,
                Messages::get('webhook', 'invalid_token')
            );

            // A rotated account remains valid only while one of its own pending payment snapshots needs it.
            $hasAwaitingSnapshot = Payment::query()
                ->where('tenant_id', $config->tenant_id)
                ->where('recipient_bank_config_id', $config->id)
                ->where('status', PaymentStatus::Awaiting)
                ->exists();

            abort_unless($config->active || $hasAwaitingSnapshot, 401, Messages::get('webhook', 'invalid_token'));

            // Authenticate before acknowledging an outgoing transfer so this endpoint is always fail-closed.
            if (($data['transferType'] ?? 'in') !== 'in') {
                return response()->json(['success' => true]);
            }

            $reconcile->ingest([
                'provider' => 'sepay',
                'bank_txn_id' => (string) $data['id'],
                'account_number' => $data['accountNumber'],
                'amount' => (int) $data['transferAmount'],
                'memo' => (string) ($data['content'] ?? ''),
                // Persist only the normalized provider fields; credentials, headers, and arbitrary body
                // extensions must not become long-lived financial audit data.
                'payload' => $data,
            ], $config->tenant_id);

            return response()->json(['success' => true]);
        });
    }
}
