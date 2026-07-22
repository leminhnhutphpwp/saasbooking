# worklogs/ — agent hand-off log

Short, append-only notes so the next agent (or the next session) knows what was done and why, without re-reading everything. Mirrors the hand-off convention from the template project `appdhv`.

> **Overall progress:** see [`../task-status.md`](../task-status.md) (milestones M0–M7 + commits + how to run).

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

## Convention

- One file per work session: `YYYY-MM-DD-<short-slug>.md` (use the real date; ask the user or read the environment if unsure).
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
