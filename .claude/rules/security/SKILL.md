---
name: security
description: Security rules for SÂN — tenant isolation, embed API, webhook verification
metadata:
  scope: global
  type: rules
---

# Security Rules

## Tenant isolation (the #1 rule)

- **`WorkingTenant` is the single source of truth** for which venue a request belongs to. Never trust `tenant_id` from the request payload.
- Non-operator users are **hard-clamped** to `users.tenant_id`; ignore any `?tenant_id` / cookie they send. Only a platform operator (super_admin) may switch venues.
- Every tenant-owned query is scoped by `tenant_id`. Defense in depth: app-level `WorkingTenant` scope → composite FK `(tenant_id, id)` → optional Postgres RLS.

## Authentication & authorization

- Breeze/session auth for the dashboard; roles via `spatie/laravel-permission`.
- Verify resource ownership (correct tenant) before any modification; use Policies for non-trivial authorization.

## Input & output

- Validate all external input (FormRequest / validation rules). Rely on Laravel CSRF + Eloquent parameter binding (no raw string SQL with user input).
- Escape output; never render unsanitized user content.

## Embed / public API (`interop`, Phase 2)

- Issue an **API key per tenant**; scope requests to that tenant.
- **CORS origin allowlist** per tenant (no `*`); the embed widget may only call the public `BookingService` surface — never the core DB.
- **Rate limit / throttle** the public API.

## Payment reconcile webhook

- **Verify the signature / HMAC** on every SePay/Casso callback before processing.
- Idempotency by `unique(bank_txn_id)`; match by `memo` (booking code), not by amount alone.
- On amount mismatch, do NOT auto-confirm — surface to the owner.

## Secrets

- Never commit secrets. `.env` locally; secrets manager in production. Store tenant bank/Zalo credentials encrypted (`tenant_bank_config`, `zalo_oa_config`).

## When to use this skill

Reference this when:
- Implementing auth, tenant scoping, or the embed API
- Adding any public endpoint or webhook
- Reviewing security-sensitive changes
