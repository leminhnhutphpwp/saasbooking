# T45 · Manager overlay primitive conformance

## Goal

Bring Manager-reachable overlay and form primitives into Quiet Green token, accessibility, and motion conformance.

## Changed

- Reworked dialogs and confirmation actions to use neutral plane overlays, borderless floating surfaces, left-aligned content, fade-only motion, and viewport-safe scrolling.
- Applied token-based shape, typography, focus, surface, and fade-motion treatment to select, badge, checkbox, label, textarea, and tooltip primitives, including portalled select and tooltip surfaces.
- Replaced the legacy wrapper-based dropdown with a portalled Radix menu while retaining the compound API used by tenant and account controls. Radix now provides trigger expanded state, Escape dismissal, focus restoration, outside dismissal, and menu keyboard navigation.
- Replaced filled destructive confirmation and badge treatment with a neutral surface, negative text, and line ring.

## Decisions

- Portal content uses direct CSS variable classes because Manager shell descendant rules cannot reach portalled surfaces.
- The task does not change page, shell, CSS, backend, or `dropdown-menu.jsx` files outside T45 scope.

## Verification

- Passed: `git diff --check`.
- Passed: `docker compose exec -T vite npm run build`.
- Blocked: `docker compose exec -T vite npx playwright test tests/e2e/login-and-manager.spec.js` could not launch Chromium because `/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell` is not installed.
- Blocked: browser QA endpoint `http://127.0.0.1:9222` refused connection on two attempts.
