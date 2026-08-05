<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Models\TenantBankConfig;
use Illuminate\Http\Request;

/**
 * Verifies the credential currently configured for SePay callbacks. A future provider-confirmed
 * signature scheme belongs here; do not substitute an unverified HMAC protocol.
 */
class SePayWebhookAuthenticator
{
    public function authenticate(Request $request, TenantBankConfig $config): bool
    {
        $secret = $config->webhook_secret;
        $credential = $request->bearerToken()
            ?? preg_replace('/^Apikey\s+/i', '', (string) $request->header('Authorization'));

        // A missing tenant credential is never an implicit development bypass.
        return is_string($secret)
            && $secret !== ''
            && is_string($credential)
            && $credential !== ''
            && hash_equals($secret, $credential);
    }
}
