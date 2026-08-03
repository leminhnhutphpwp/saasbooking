# Operational reliability

## Goal

Harden critical background work and add a locally verifiable readiness signal without claiming production deployment.

## Changed

- Added bounded retry, timeout, failed-timeout, and queue overlap policies for hold expiry, series generation, and reminder sweeps.
- Added scheduler overlap mutexes and `/api/ready`, which probes PostgreSQL plus the configured queue connection without revealing dependency details.
- Added operational handoff documentation for alert and backup ownership.

## Decisions

- Queue middleware is required in addition to scheduler mutexes because scheduled queue dispatch completes before the worker executes the job.
- The single-host compose topology uses cache-backed mutexes, not multi-server scheduler coordination.

## Next

- Before production, assign alert and backup owners, configure off-host backups, supply real provider credentials, and run the documented E2E checks.
