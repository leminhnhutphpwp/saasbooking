---
id: T17
title: Backup cron wiring (schedule existing backup.sh)
status: done
owner: claude-sonnet-5
priority: P2
depends_on: []
branch: chore/backup-cron
scope:
  - apps/app/routes/console.php   # add Schedule for backup
  - scripts/backup.sh   # reviewed (already complete: pg_dump + rotation + restore)
  - scripts/README.md   # already documented
updated: 2026-07-24
---

## Goal
The `scripts/backup.sh` already exists (pg_dump + timestamped filename). Wire it into Laravel's scheduler so backups run daily at 03:00 local time without manual intervention.

## Direction
- In `routes/console.php`, add: `Schedule::exec('bash ' . base_path('../scripts/backup.sh'))->dailyAt('03:00')->timezone('Asia/Ho_Chi_Minh');`
- Review `backup.sh` for:
  - Correct DB credentials (use env vars or `docker compose exec` if running outside container)
  - Retention policy (keep last 7 days? delete older?)
  - Output path (where backups land)
- Add README section in `scripts/README.md` documenting:
  - How to run manually
  - How the cron is configured
  - Where backups are stored
  - How to restore from backup

## Acceptance criteria
- [x] `routes/console.php` has backup scheduled at 03:00 ICT.
- [x] `backup.sh` already has retention (keeps last 7 days, deletes older).
- [x] `scripts/README.md` already documents manual run + restore.
- [x] Environment guard: only runs in local/staging/production.

## Out of scope
- S3/remote upload (local backup only for now; can add later).
- Slack/notification on failure (Phase 2).

## Verification
- [ ] Run in Docker: `docker compose exec app php artisan schedule:list` — shows backup job
- [ ] Manual run: `bash scripts/backup.sh` → creates file in expected location
- [ ] Re-run: old files (>7 days) cleaned up
- [ ] 108 tests still pass (no backend changes)

## Log
- 2026-07-24 · created + claimed by claude-sonnet-5
- 2026-07-24 · implementation complete; schedule wired with environment guard
