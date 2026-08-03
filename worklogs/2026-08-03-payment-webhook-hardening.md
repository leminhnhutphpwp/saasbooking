# 2026-08-03 - Payment webhook hardening

**Goal:** Fail closed for unauthenticated bank callbacks while retaining duplicate-safe, tenant-safe reconciliation.
**Changed:** SePay credential adapter, webhook validation/audit filtering, inbox tenant attribution migration, feature tests, and payment webhook operations handoff.
**Decisions:** Kept the established bearer/API-key credential boundary behind `SePayWebhookAuthenticator`; provider signature semantics remain unverified and must not be replaced with guessed HMAC logic. Tenant identity comes only from the authenticated, globally unique provider/account config.
**Next:** Confirm the provider's current callback authentication/signature contract and conduct a controlled production transaction for each tenant before enabling callbacks.
