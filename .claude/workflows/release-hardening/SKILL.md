---
name: release-hardening
description: Pre go-live checklist for SÂN Phase 1 (courts MVP)
metadata:
  scope: global
  type: workflow
---

# Release Hardening — Phase 1 go-live checklist

Run before launching to paying venues. Current go-live priorities are in `docs/12-lo-trinh.md`.

## Correctness (the money & concurrency core)

- [ ] Test suite green, incl. the **concurrency test** (2 parallel holds on the same slot → exactly 1 succeeds, 1 gets 409 via the exclusion constraint).
- [ ] **Reconcile idempotency** test green (duplicate SePay/Casso webhook → no double-confirm; matched by `bank_txn_inbox.bank_txn_id`).
- [ ] All **3 reconcile branches** covered: confirm / grace re-confirm / orphaned + auto-refund.
- [ ] Series generation + single-occurrence cancel tested.
- [ ] Money is `BIGINT` everywhere; no float in pricing/deposit paths.

## Integrations

- [ ] **SePay (or Casso) sandbox** reconciliation verified end-to-end (transfer with `memo = booking.code` → hold confirmed).
- [ ] **Zalo OA connected** and **ZNS templates approved** (approval takes time — do this early, not at the end).
- [ ] VietQR payload renders and is scannable on mobile.

## Multi-tenant safety

- [ ] Tenant isolation verified: a staff user of venue A cannot read/see venue B (test the `WorkingTenant` clamp + RLS).
- [ ] `/check-invariants` clean on the release branch.

## Ops

- [ ] Migrations run cleanly on a fresh DB; **no `migrate:fresh` in the deploy path**.
- [ ] PostgreSQL **backup** configured (e.g. `wal-g` / managed backups) and a restore tested.
- [ ] Horizon workers + scheduler running under a supervisor; the hold-expiry / reminder / series jobs verified.
- [ ] Seed/demo data available for onboarding & sales demos.
- [ ] Caddy/nginx TLS + webhook endpoints reachable and stable.

## When to use this skill

Before any Phase 1 production release or paid-pilot launch.
