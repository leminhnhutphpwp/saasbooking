---
id: T15
title: Security headers + CSP middleware
status: in-review
owner: claude-sonnet-5
priority: P1
depends_on: []
branch: feat/security-headers
scope:
  - apps/app/app/Http/Middleware/SecurityHeaders.php   # new
  - apps/app/bootstrap/app.php   # register middleware
  - apps/app/tests/Feature/SecurityHeadersTest.php   # new
updated: 2026-07-24
---

## Goal
Add standard security response headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) to every response so the app is harder to iframe-clickjack / MIME-sniff / XSS. Use Laravel's built-in middleware approach; no new packages.

## Direction
- Single middleware `SecurityHeaders` applied globally.
- CSP policy: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (Tailwind/Inertia need inline styles), `img-src 'self' data: blob:`, `font-src 'self' data:`, `connect-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Other headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Register as global middleware in `bootstrap/app.php`.
- Tests assert all headers are present on a 200 response.

## Acceptance criteria
- [ ] All 5 headers present on every response.
- [ ] CSP doesn't break Inertia/Vite dev (HMR needs `ws://localhost:*` in `connect-src` when `APP_ENV=local`).
- [ ] Tests pass (new SecurityHeadersTest + 108 existing).
- [ ] No new packages.

## Out of scope
- Per-route CSP overrides (can add later if needed).
- Report-To / COOP / COEP (not required for Phase 1).

## Verification
- [ ] `php artisan test` — 108 + new tests pass
- [ ] `curl -I http://localhost:8000/login` — all headers present
- [ ] Browser: login page loads correctly (no CSP breakage)

## Log
- 2026-07-24 · created + claimed by claude-sonnet-5
