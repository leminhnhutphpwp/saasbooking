# 2026-08-03 - Canonical booking and payment lock order

**Goal:** Remove the reviewed booking/payment lock-order inversion without weakening lifecycle transactions.
**Changed:** `ReconcileService` now locks booking then payment for automatic and manual settlement; `ReconcileTest` covers cancellation winning before reconciliation.
**Decisions:** The canonical order for a lifecycle transaction that needs both business rows is booking then payment. Reconciliation retains its preceding inbox lock as the independent webhook idempotency barrier. A transfer arriving after cancellation is orphaned and refunded through the existing separate ledger; payment amounts remain immutable.
**Next:** Review T15 alongside the existing cancellation and reconciliation hardening tasks.
