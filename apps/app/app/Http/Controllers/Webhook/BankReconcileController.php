<?php

declare(strict_types=1);

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\TenantBankConfig;
use App\Services\Payment\ReconcileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SePay bank-transaction webhook. Auth is the per-tenant webhook token (matched by the receiving
 * account). Reconcile itself is idempotent, so a retried webhook is safe.
 */
class BankReconcileController extends Controller
{
    public function sepay(Request $request, ReconcileService $reconcile): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required'],
            'accountNumber' => ['required', 'string'],
            'transferAmount' => ['required', 'integer'],
            'content' => ['nullable', 'string'],
            'transferType' => ['nullable', 'string'],
        ]);

        // Only money coming in.
        if (($data['transferType'] ?? 'in') !== 'in') {
            return response()->json(['success' => true]);
        }

        $config = TenantBankConfig::where('provider', 'sepay')
            ->where('account_number', $data['accountNumber'])
            ->where('active', true)
            ->first();

        $token = $request->bearerToken()
            ?? str_replace('Apikey ', '', (string) $request->header('Authorization'));

        abort_unless(
            $config && $config->webhook_secret && hash_equals((string) $config->webhook_secret, (string) $token),
            401,
            'Invalid webhook token.'
        );

        $reconcile->ingest([
            'provider' => 'sepay',
            'bank_txn_id' => (string) $data['id'],
            'account_number' => $data['accountNumber'],
            'amount' => (int) $data['transferAmount'],
            'memo' => (string) ($data['content'] ?? ''),
            'payload' => $request->all(),
        ]);

        return response()->json(['success' => true]);
    }
}
