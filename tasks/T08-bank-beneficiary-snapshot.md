---
id: T08
title: Snapshot bank beneficiary for deposit obligations
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: fix/dev-vite-service
scope:
  - apps/app/app/Models/Payment.php
  - apps/app/app/Services/Payment/PaymentService.php # narrow unavoidable overlap with T04: deposit initialization
  - apps/app/app/Services/Payment/ReconcileService.php # narrow unavoidable overlap with T03: snapshot recipient matching
  - apps/app/app/Http/Controllers/Public/PublicBookingController.php # narrow unavoidable overlap with T04: public payment status
  - apps/app/app/Http/Controllers/Webhook/BankReconcileController.php
  - apps/app/database/migrations/*bank_beneficiary*
  - apps/app/tests/Feature/Payment/BankBeneficiarySnapshotTest.php
  - docs/08-thiet-ke-module-chi-tiet.md
  - docs/10-tinh-huong-phat-sinh.md
  - tasks/BOARD.md
  - tasks/T08-bank-beneficiary-snapshot.md
  - worklogs/2026-08-03-bank-beneficiary-snapshot.md
updated: 2026-08-03
---

## Goal
Snapshot the recipient bank details and reconciliation identity when a deposit obligation is initialized. Pending public QR/status data must remain stable after bank-account rotation or deactivation, while new deposits use the active tenant configuration.

## Context / references
- `.claude/skills/payment-flow/SKILL.md`
- `.claude/skills/tenant-isolation/SKILL.md`
- `docs/10-tinh-huong-phat-sinh.md` O6

## Acceptance criteria
- [x] Deposit payment records retain recipient bank details and reconciliation identity without storing webhook secrets.
- [x] Public status reads the payment snapshot and safely falls back for legacy payments.
- [x] Recipient rotation/deactivation preserves old QR data and directs new deposits to the active configuration.
- [x] Focused PostgreSQL feature tests and Pint pass.

## Out of scope (do NOT do here)
- Real bank credentials, payment gateways, or changes to reconciliation idempotency/settlement semantics.
- Payment amount mutation or a second booking overlap path.

## Verification (agent fills in before setting in-review)
- [x] Focused PostgreSQL: `BankBeneficiarySnapshotTest` passes (2 tests, 52 assertions).
- [x] Relevant payment/public suites pass (22 tests, 136 assertions); full PostgreSQL suite passes (244 tests, 898 assertions).
- [x] Pint passes for changed PHP files.

## Log
- 2026-08-03 · claimed by opencode; source overlap with T04 is restricted to the payment initializer and public status seam required for this invariant.
- 2026-08-03 · ready for review; snapshots preserve old pending QR/account details and recipient matching after config rotation without copying webhook secrets.
