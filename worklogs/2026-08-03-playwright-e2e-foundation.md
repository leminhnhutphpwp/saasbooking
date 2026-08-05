# 2026-08-03 - Playwright E2E foundation

**Goal:** Establish deterministic browser smoke coverage for the public booking and manager surfaces.
**Changed:** Added Playwright configuration, four Chromium specs, npm scripts, dependency lock entries, and `tests/e2e/README.md`.
**Decisions:** Specs use the idempotent `DemoSeeder` fixture and never submit a hold or call external integrations. The Docker runner uses host networking because the existing Vite development origin is `localhost:5173`; this preserves its CORS policy without changing Docker or Vite configuration.
**Next:** Run `npm run test:e2e` locally after installing Chromium, or use the documented Playwright container command where the host lacks Node.js.
