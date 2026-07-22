---
name: bugfix-workflow
description: Bug-fixing workflow for the SÂN court-booking platform
metadata:
  scope: global
  type: workflow
---

# Bugfix Workflow

## 1. Reproduce with a RED test first

Before touching code, write a failing test that captures the bug — ideally a `tests/Feature` test on real PostgreSQL. For concurrency / money / reconcile bugs this is mandatory: the test is the proof the fix works and a guard against regression.

## 2. Localize

- Use `@explorer`, Grep/Glob to find the responsible code. Don't bulk-read the repo.
- Map the symptom to a module (`docs/05-module-map.md`) and its Service (`docs/08`).
- Check `docs/10-tinh-huong-phat-sinh.md` (scenarios) and `docs/11-diem-vo.md` (data pitfalls) — the bug may already be a documented edge case with a prescribed handling.

## 3. Fix small

- Smallest change that makes the red test green. No opportunistic refactors in a bugfix.
- Keep business logic in `app/Services/`; don't push fixes into controllers.

## 4. Re-check the invariants (do NOT regress them)

Every fix must still hold the 6 invariants (`CLAUDE.md`). The common regressions to watch:

- Tenant isolation — did the fix add a query missing `WorkingTenant::id()` scope?
- Double-booking — did it introduce check-then-act instead of the exclusion constraint / driver?
- Snapshots — did it start reading live pricing for a historical booking?
- Money/status — float money, boolean status flags, or mutating `payments.amount`?

Run `/check-invariants` on the diff.

## 5. Verify & finish

1. Run the new test + the related suite (`--filter`).
2. `php artisan pint`.
3. Write a worklog to `worklogs/` (root cause, fix, the test added).
4. No commit/push unless asked.

## When to use this skill

When fixing a reported defect or a failing test.
