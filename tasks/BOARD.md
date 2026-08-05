# BOARD — active work only

> Updated: 2026-07-26. Protocol: [`README.md`](README.md). Completed work belongs in Git history and [`../worklogs/`](../worklogs/README.md), not on this board.

## Active

- T01 · Run frontend commands in Vite service · in-review · `fix/dev-vite-service`
- T03 · Serialize hold expiry and payment settlement · claimed · `fix/dev-vite-service`
- T02 · Manager booking and customer operations UI · in-review · `feat/manager-operations-ui`
- T04 · Cancellation with refund policy snapshots · in-review · `feat/cancellation-refund-policy`
- T05 · Staff operations authorization · in-review · `fix/dev-vite-service`
- T06 · Prevent inactive public booking sheet from blocking courts · in-review · `fix/public-booking-sheet-visibility`
- T07 · Tenant-scoped Zalo ZNS configuration and delivery · in-review · `fix/dev-vite-service`
- T08 · Snapshot bank beneficiary for deposit obligations · in-review · `fix/dev-vite-service`
- T09 · Database integrity for payment ledger and time windows · in-review · `fix/dev-vite-service`
- T10 · Operational reliability slice · in-review · `fix/dev-vite-service`
- T11 · Playwright E2E foundation · in-review · `test/playwright-e2e`
- T12 · Public booking payment clarity · in-review · `feat/public-booking-payment-ux`
- T13 · Tenant isolation hardening · in-review · `security/tenant-isolation-hardening`
- T14 · Payment webhook and reconciliation hardening · in-review · `test/playwright-e2e`
- T15 · Canonical booking and payment lock order · in-review · `test/playwright-e2e`
- T16 · Public booking sheet modal accessibility · in-review · `fix/public-booking-sheet-modal-accessibility`
- T17 · Database integrity validation preflight · in-review · `fix/dev-vite-service`
- T18 · RLS runtime role deployment · in-review · `security/rls-runtime-role-deployment`
- T19 · Payment ingress tenant boundary hardening · in-review · `security/payment-ingress-tenant-boundary`
- T20 · Identity bootstrap tenant boundary hardening · in-review · `security/identity-bootstrap-tenant-boundary`
- T21 · Authorization boundary security audit · in-review · `security/authorization-boundary-audit`

## Backlog

- Go-live: deploy migrations, production Zalo credentials, backup restore drill, and error monitoring.
- Browser QA: service registration, tenant switching, pricing scope, and mobile public booking.
- Security follow-up: design application DB role and per-request session context before enabling PostgreSQL RLS.

Create a task from [`_TEMPLATE.md`](_TEMPLATE.md) only when work is ready to start.
