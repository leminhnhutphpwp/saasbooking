# UI & Design System Rules

Keep the SÂN frontend coherent so many agents produce ONE consistent product, not a patchwork. Read this before writing any React/Inertia UI.

## Use the foundation — do not reinvent

- **shadcn/ui primitives ONLY** (`resources/js/Components/ui/`). Never hand-roll or use raw HTML `<input>`, `<select>`, `<button>`, `<dialog>`, or the native date/file inputs — use the shadcn equivalents.
- **Reuse the shared components** before building new ones: `PageHeader`, `StatCard`, `StatusBadge`, `EmptyState` (`resources/js/Components/`). Every manager page starts with `PageHeader`.
- **Status display goes through `StatusBadge`** — never hardcode a status color/label. It is the single source of truth mapping every enum (booking/payment/refund/series) → color + Vietnamese label.
- **Formatting goes through `resources/js/lib/format.js`** — `formatVND` (integer VND), `formatDate/Time/DateTime/Weekday` (vi-VN). Never inline `Intl` or ad-hoc money strings.

## Tokens & theme

- **Use design tokens, never hardcoded colors.** Style with the shadcn token classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-card`, …). Do NOT write `bg-gray-100`/`text-slate-700` etc. in app pages — the token layer owns light/dark + the palette.
- The **app chrome brand is violet / indigo** (tokens) — modern SaaS look (see the QwenCloud reference). The **tenant's own brand color themes only the public booking page** (read from tenant settings, applied as an accent) — do not hardcode a tenant color.
- Every screen must be **theme-aware** (light + dark) and **responsive / mobile-first** (public booking especially — players are on phones).

## Layout & IA

- **One shell**: authenticated pages use `ManagerLayout` (sidebar). Public pages use the public layout. Do not introduce a third shell.
- Give pages **loading skeletons** and **empty states** (`EmptyState`), not blank screens.
- Wire flash `success`/`error` to **sonner toasts** (already mounted in the layouts) — don't build custom alert bars.

## Language

- **End-user UI copy is Vietnamese** (labels, buttons, messages). Code, comments, prop names, and task/config files are **English**.

## Dependencies

- **No new UI dependencies without manager approval** (chart libs, date pickers, icon packs beyond `lucide-react`, fonts). No external CDNs — assets are self-hosted. Prefer building from shadcn + Tailwind.

## Don't

- ❌ Rewrite a page wholesale when a scoped change suffices.
- ❌ Add logos/images/favicons you generated — branding assets are a deliberate manager decision.
- ❌ Change backend logic from a UI task — controllers may only reshape read data; keep tenant scoping, validation, and the invariants intact.

## Craft & consistency checklist (a page is not "done" until it passes)

Functional ≠ finished. Court owners pay monthly — the UI must feel meticulous, not like a prototype. Every page must satisfy:

- **One container, everywhere.** Wrap page content in the shared `PageContainer` (consistent `max-width` + responsive padding + vertical section rhythm). NEVER a full-bleed page with left-aligned content and a sea of empty space on the right/bottom. Consistent width across ALL pages.
- **No dead space.** If content is sparse (empty states, short forms), constrain width and center it — don't stretch one tiny card across a 1500px row. Two-column layouts (form + live preview) beat one tall stack with empty sides.
- **Empty states earn their space.** Icon in a tinted circle + title + one-line hint + a clear primary action + a concrete example ("VD: 6–17h 100k, 17–22h giờ vàng 130k"). Never a bare bordered box floating in white.
- **Cards are consistent.** Same header pattern (icon + title), same inner padding, same border/shadow/radius. Don't mix styles between pages.
- **Visual hierarchy over walls of sameness.** Group long lists (e.g. time slots → Sáng/Chiều/Tối); use size/weight/color to lead the eye; drop decorative clutter (an icon on every item is noise, not craft).
- **Spacing rhythm.** Use a consistent scale (e.g. gap-2/3/4/6); align edges; equal gutters.
- **Interactions feel alive.** Hover, active, focus-visible, selected states on every interactive element; subtle transitions; disabled states legible.
- **Loading + responsive.** Skeletons for async; verify the layout at mobile width AND wide desktop (no stretched rows, no overflow).
- **Self-check before in-review:** open the page in a browser at ~390px and ~1440px; if it looks empty, misaligned, or monotonous, it's not done.

## Browser UX Review

For every changed interactive control (links, buttons, menus, cards, inputs, dialogs):

1. Open the affected route at approximately `390px` and `1440px` wide and perform the interaction a real user performs.
2. Check the hand cursor on clickable controls, hover/active/focus-visible feedback, keyboard navigation, disabled/selected state, and horizontal overflow.
3. Capture a screenshot after the interface settles for each meaningful changed state. Store review screenshots under `/tmp/san-ux/`, never in the repository; record their paths and viewport in the task or worklog when they support a visual decision.
4. Watch the browser console, uncaught page errors, and failed requests while interacting. A visually correct screenshot is not sufficient if the interaction emits runtime errors.

Do not report a UI as verified from static code inspection, a build, or an unlaunched Playwright test alone.

## Direct Chromium Control

Use direct CDP control when a real browser interaction or screenshot review is needed:

1. `browser_url` is the Chromium DevTools endpoint, not the app. Use `browser_list` to get a `target_id`, then navigate that tab to the project URL.
2. Prefer a host Chromium profile so manual and automated review use the same browser. Start a separate profile when Chromium is already open, otherwise command-line flags are forwarded to the existing session:

```bash
chromium --remote-debugging-address=127.0.0.1 --remote-debugging-port=9225 --user-data-dir=/tmp/opencode-chromium-host about:blank
```

3. Confirm `http://127.0.0.1:9225/json/version` responds before using browser tools. Keep the endpoint on `127.0.0.1`; never expose a remote-debugging port on the network.
4. Use `browser_snapshot` before UID-based clicks/fills. Use `browser_eval` for computed states such as cursor, overflow, and page state; use `browser_screenshot` for visual review.
5. If host Chromium is unavailable, use the pinned Playwright Docker browser as a fallback. It is valid for automation but does not share the user's interactive browser session.

## When to use this skill

Any task that adds or changes React/Inertia UI (all of `tasks/T01`–`T06` and future UI work).
