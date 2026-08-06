# 2026-08-05 - Blade cache runtime

## Goal
Prevent Blade compiled view mtime updates from failing on Docker bind mounts.

## Changed
- The app FPM service uses `/tmp/san-blade` for compiled views instead of the workspace bind mount.
- The project Artisan wrapper uses a separate `/tmp/san-blade-cli` cache, so tests and maintenance commands cannot create root-owned FPM cache files.

## Verification
- Recreated the `app` container.
- Confirmed the FPM compiled path is `/tmp/san-blade`.
- Forced compiled view mtimes older, then served the web entrypoint successfully through the Blade `touch()` path.
- `bash scripts/dev.sh test` passed: 268 tests, 1,038 assertions.
- Frontend production build passed earlier in this session.

## Status
In review
