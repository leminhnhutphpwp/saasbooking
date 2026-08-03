# Payment Webhook Operations

`POST /api/webhooks/sepay` accepts a normalized incoming SePay transaction only after resolving its receiving account to exactly one `tenant_bank_config` row and verifying that row's encrypted `webhook_secret` with constant-time comparison. The request never accepts a tenant identifier.

The current adapter preserves the existing `Authorization: Bearer <credential>` and `Authorization: Apikey <credential>` boundary. It deliberately does not claim a SePay or Casso signature/HMAC format that has not been confirmed from provider documentation. A provider-confirmed signed-body scheme must be implemented as a provider adapter, replacing or extending `SePayWebhookAuthenticator`; do not add a generic HMAC guess.

## Production Configuration

1. Configure a unique receiving account and provider for each tenant in `tenant_bank_config`; the database uniqueness constraint prevents one provider account being assigned to multiple tenants.
2. Set the actual provider-issued webhook credential in that row's encrypted `webhook_secret`. Missing credentials reject every callback, including outgoing transfers. There is no unsigned local or production bypass.
3. Configure the provider callback URL as the public HTTPS URL ending in `/api/webhooks/sepay`, then confirm the exact credential header and any provider signature/canonical-body requirements using the provider's current documentation or support channel.
4. Send a controlled incoming transfer for each configured tenant and verify the authenticated callback has the expected transaction ID, receiving account, amount, and memo. Check duplicate delivery produces one `bank_txn_inbox` row and one payment settlement.
5. Do not place webhook credentials in `.env.example`, source control, logs, or payment payloads. The inbox stores only normalized transaction fields and the tenant resolved from the authenticated receiving account.

Historical inbox records can remain without `tenant_id`; they cannot be attributed safely after the fact. New webhook records receive `tenant_id` only from the authenticated bank configuration.
