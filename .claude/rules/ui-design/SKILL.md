# UI & Design System Rules

Keep the SÂN frontend coherent so many agents produce ONE consistent product, not a patchwork. Read this before writing any React/Inertia UI.

## Use the foundation — do not reinvent

- **shadcn/ui primitives ONLY** (`resources/js/Components/ui/`). Never hand-roll or use raw HTML `<input>`, `<select>`, `<button>`, `<dialog>`, or the native date/file inputs — use the shadcn equivalents.
- **Reuse the shared components** before building new ones: `PageHeader`, `StatCard`, `StatusBadge`, `EmptyState` (`resources/js/Components/`). Every manager page starts with `PageHeader`.
- **Status display goes through `StatusBadge`** — never hardcode a status color/label. It is the single source of truth mapping every enum (booking/payment/refund/series) → color + Vietnamese label.
- **Formatting goes through `resources/js/lib/format.js`** — `formatVND` (integer VND), `formatDate/Time/DateTime/Weekday` (vi-VN). Never inline `Intl` or ad-hoc money strings.

## Tokens & theme

- **Use design tokens, never hardcoded colors.** Style with the shadcn token classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-card`, …). Do NOT write `bg-gray-100`/`text-slate-700` etc. in app pages — the token layer owns light/dark + the palette.
- The **app chrome brand is emerald** (tokens). The **tenant's own brand color themes only the public booking page** (read from tenant settings, applied as an accent) — do not hardcode a tenant color.
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

## When to use this skill

Any task that adds or changes React/Inertia UI (all of `tasks/T01`–`T06` and future UI work).
