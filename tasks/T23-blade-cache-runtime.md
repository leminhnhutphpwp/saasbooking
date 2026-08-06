---
id: T23
title: Keep Blade compiled views off host bind mounts
status: in-review
owner: opencode
priority: P0
depends_on: []
branch: fix/blade-cache-runtime
scope:
  - docker-compose.yml
  - scripts/lib/docker.sh
  - tasks/BOARD.md
  - worklogs/
updated: 2026-08-05
---

## Goal
Prevent Laravel Blade from updating compiled view mtimes on a host bind mount, which can fail on Docker Desktop-backed filesystems.

## Acceptance criteria
- [x] The app service compiles Blade views on an internal writable path.
- [x] A recreated app container serves the web entrypoint without the Blade `touch()` exception.
- [x] The existing Laravel test suite remains green through the project wrapper.

## Out of scope
- Production deployment topology.
- Application view or booking behavior.

## Log
- 2026-08-05 · claimed after reproducing the Blade cache filesystem boundary.
- 2026-08-05 · verified and moved to in-review.
