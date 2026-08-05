# 13 - Van hanh production

This document is an operational handoff, not evidence that production has been deployed.

## Runtime signals

- `GET /up` is Laravel liveness only.
- `GET /api/ready` returns `200 {"status":"ready"}` only after PostgreSQL and the configured queue connection respond. It returns a generic `503 {"status":"not_ready"}` on a dependency failure and never includes connection details or credentials.
- The compose topology has one scheduler host. Critical scheduled jobs use scheduler mutexes and queue-level overlap locks backed by the configured shared cache store (Redis in `.env.example`).
- `ExpireStaleHolds`, `GenerateSeriesOccurrences`, and `SendBookingReminders` retry at most three times with 60 and 300 second backoff, time out after 60 seconds, and then enter `failed_jobs` through the configured `database-uuids` failed-job driver.

## Required production ownership

- Assign an on-call owner and an alert destination for repeated readiness failures, failed Horizon jobs, and scheduler/container restarts. Configure the alerting system outside this repository; no vendor integration is assumed here.
- Assign a backup owner. Configure durable off-host PostgreSQL backups, retention, encryption, and access controls; test a restore before go-live and at a regular cadence. The development compose backup script is not a production backup guarantee.
- Deploy and supervise exactly one scheduler process for this topology, plus Horizon workers. Verify `/up`, `/api/ready`, a scheduled hold expiry, and a failed-job redrive after each production release.
- Set real SePay/Casso and per-tenant Zalo credentials, approve/map ZNS templates, and execute one controlled end-to-end reconciliation and notification delivery. Do not place those credentials in source control.
