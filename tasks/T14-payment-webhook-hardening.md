---
id: T14
title: Payment webhook and reconciliation hardening
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: test/playwright-e2e
scope:
  - apps/app/app/Http/Controllers/Webhook/BankReconcileController.php
  - apps/app/app/Models/BankTxnInbox.php
  - apps/app/app/Services/Payment/SePayWebhookAuthenticator.php
  - apps/app/database/migrations/2026_08_03_030000_add_tenant_id_to_bank_txn_inbox_table.php
  - apps/app/tests/Feature/Payment/WebhookTest.php
  - docs/13-payment-webhook-operations.md
  - tasks/T14-payment-webhook-hardening.md
  - tasks/BOARD.md
  - worklogs/2026-08-03-payment-webhook-hardening.md
  - worklogs/README.md
updated: 2026-08-03
---

## Goal
Harden inbound bank webhook authentication, validation, tenant-safe reconciliation, and duplicate handling without inventing unverified provider signature semantics.

## Context / references
- `.claude/skills/payment-flow/SKILL.md`
- `.claude/rules/security/SKILL.md`
- `docs/07-luong-du-lieu.md`

## Acceptance criteria
- [x] Configured provider secrets fail closed through a provider verification boundary.
- [x] Webhook payloads are validated, duplicate-safe, and cannot guess a tenant from untrusted input.
- [x] Feature coverage includes unsigned, tampered, duplicate, cross-tenant, and valid callbacks.
- [x] Production credential and provider-confirmation requirements are documented.

## Out of scope (do NOT do here)
- Inventing SePay/Casso payload or signature schemas.
- Changing booking settlement rules or deploying provider credentials.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL feature tests: 9 passed, 71 assertions.
- [x] Pint passes for changed PHP files.
- [x] Full PostgreSQL suite: 261 passed, 1003 assertions.

## Log
- 2026-08-03 · claimed by opencode for webhook/reconciliation hardening.
- 2026-08-03 · ready for review; provider credential verification is fail-closed, tenant attribution is resolved from the authenticated recipient account, and the provider-signature confirmation requirement is documented.
