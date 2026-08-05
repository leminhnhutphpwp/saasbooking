# worklogs/ — agent hand-off log

Historical decisions and handoffs. Current truth lives in `docs/`, active work in `tasks/`, and implementation state in code/tests.

## Index

| Date | Milestone |
|------|-----------|
| 2026-07-22 | [M0 — setup + Docker + CI](2026-07-22-m0-setup.md) |
| 2026-07-22 | [M1 — identity + WorkingTenant](2026-07-22-m1-identity-tenant.md) |
| 2026-07-22 | [M2 — court-catalog + pricing](2026-07-22-m2-court-catalog.md) |
| 2026-07-22 | [M3 core — booking engine (anti-double-book)](2026-07-22-m3-booking-engine-core.md) |
| 2026-07-22 | [M3 — availability + recurring series](2026-07-22-m3-availability-series.md) |
| 2026-07-22 | [M4 — payment: VietQR + reconcile](2026-07-22-m4-payment-vietqr-reconcile.md) |
| 2026-07-22 | [M5 — notification scaffold (Zalo)](2026-07-22-m5-notification-scaffold.md) |
| 2026-07-22 | [M6 part 1 — public booking page](2026-07-22-m6-public-booking-page.md) |
| 2026-07-22 | [M6 part 2 — manager dashboard](2026-07-22-m6-manager-dashboard.md) |
| 2026-07-22 | [M6 part 3 — manager navigation and reconciliation](2026-07-22-m6-manager-nav-reconcile.md) |
| 2026-07-23 | [Audit and hardening fixes](2026-07-23-m6-audit-fixes.md) |
| 2026-07-24 | [Zalo ZNS HTTP transport](2026-07-24-t16-zalo-zns-http.md) |
| 2026-07-24 | [Backup scheduling](2026-07-24-t17-backup-cron.md) |
| 2026-07-25 | [Tenant resource categories](2026-07-25-tenant-resource-categories.md) |
| 2026-07-26 | [Smart pricing rules](2026-07-26-smart-pricing-rules.md) |
| 2026-07-26 | [Service registration and memberships](2026-07-26-service-registration.md) |
| 2026-07-26 | [Agent context cleanup](2026-07-26-agent-context-cleanup.md) |
| 2026-07-26 | [Schema, config, and architecture docs alignment](2026-07-26-schema-config-docs-alignment.md) |
| 2026-07-26 | [Platform hardening](2026-07-26-platform-hardening.md) |
| 2026-08-02 | [Development setup repair](2026-08-02-dev-setup.md) |
| 2026-08-03 | [Payment webhook hardening](2026-08-03-payment-webhook-hardening.md) |

## Convention

- Add a worklog only for a meaningful session with a durable decision or handoff; do not log cosmetic one-line fixes.
- Keep it short. Template:

```markdown
# <date> — <what you worked on>

**Goal:** one line.
**Changed:** files/areas touched (paths).
**Decisions:** anything non-obvious a future agent must respect (link to CLAUDE.md / docs if it became a rule).
**Next:** the obvious next step, and any open question.
```

- Record DECISIONS and RATIONALE, not a diff (git already has the diff).
- If a decision becomes a durable rule, also put it in `CLAUDE.md` / `AGENTS.md` / the relevant `docs/` file — worklogs are history, not the source of truth.
