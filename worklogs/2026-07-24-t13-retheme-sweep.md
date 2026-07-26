# 2026-07-24 — T13 v3 aesthetic sweep (10 pages + GuestLayout)

## Overview
Brought the entire remaining surface of the SÂN manager dashboard up to the T11 violet/airy QwenCloud reference. Every page now uses `PageContainer` + `PageHeader` + `rounded-xl` cards + violet accents via design tokens. Replaced the plain Breeze login with a gradient-branded violet auth screen in Vietnamese. Removed every hardcoded emerald / `text-blue-600` / local VND formatter in favor of shared `StatCard`, `EmptyState`, `formatVND`, and token-based accents.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/resources/js/Layouts/GuestLayout.jsx` | Gradient background with violet/indigo blur blobs, centered branded card, SVG mark, removed `ApplicationLogo` import |
| `apps/app/resources/js/Pages/Auth/Login.jsx` | Full Vietnamese labels, Mail/Lock input icons, full-width violet button, removed `PrimaryButton`/`TextInput`/`InputLabel` Breeze legacy imports |
| `apps/app/resources/js/Pages/Manager/Reports/Index.jsx` | Replaced local `StatCard`/`BarChart` with shared `StatCard` + self-drawn violet SVG area chart with gradient fill; added `PageContainer` + `PageHeader`; tinted 2×2 deposit/refund grid; top-customer cards with ranked badges |
| `apps/app/resources/js/Pages/Manager/Calendar/Index.jsx` | Replaced `STATUS_BORDER` (hardcoded colors) with `STATUS_TINT` map (violet for confirmed, amber for pending_deposit — fixes the nit); rounded-2xl grid wrapper; now-line in `border-primary`; `+` icon on empty slots; smart date header (Hôm nay / Ngày mai / weekday) |
| `apps/app/resources/js/Pages/Manager/Courts/Index.jsx` | Converted from list to 2-column card grid; `MapPin` icon in violet tint; `EmptyState` for empty list; buttons with icons (Clock/DollarSign/Settings2/Archive) |
| `apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx` | Added `PageContainer` (size=narrow); `EmptyState` with `Clock`; rounded-xl error box; hover rows |
| `apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx` | Price now `text-primary` (was hardcoded `text-emerald-600`); `EmptyState`; info callout with `Info` icon; `getTierVariant` instead of `getTierColor` (no more hardcoded emerald/amber classes) |
| `apps/app/resources/js/Pages/Manager/Settings/Branding.jsx` | Default color changed to `#8b5cf6` (violet, was emerald `#059669`); 3/5 + 2/5 grid with sticky preview; violet icon headers (Image/Palette/ExternalLink/Eye) |
| `apps/app/resources/js/Pages/Manager/Refunds/Index.jsx` | Icon in violet-tinted rounded-xl container; hover rows; consistent spacing |
| `apps/app/resources/js/Pages/Manager/Series/Index.jsx` | 2-column card grid with `RefreshCw` icon; removed local `vnd()` formatter → uses `formatVND`; inner stat grid per card |
| `apps/app/resources/js/Pages/Manager/Reconcile/Unmatched.jsx` | Removed local `vnd()` formatter → uses `formatVND`; `EmptyState` for empty; section headers with colored dots; rounded-xl info box in dialog |

## Key Decisions
1. **GuestLayout redesign** — went with a centered gradient-background approach rather than side-by-side. The gradient uses violet + indigo blur blobs (pointer-events-none) to give depth without being busy.
2. **Login: Breeze primitives replaced** — removed `PrimaryButton` / `TextInput` / `InputLabel` imports entirely; kept `Checkbox` (already token-aware) but added a visible label for it.
3. **Reports: area chart instead of bar chart** — the QwenCloud reference shows soft area charts for revenue; drew it in SVG with a violet gradient fill (no new deps). Kept the data shape the same.
4. **Calendar STATUS_TINT** — maps each status to a `{bg, border, text}` triplet so blocks get a soft tinted background matching their border color. `pending_deposit` is now amber (was the same color mapping as confirmed — fixed).
5. **Courts: cards not list** — a 2-column card grid feels richer than a list with `divide-y` and gives room for action icons. Opening/Pricing rules stay list-style (they're per-court config pages).
6. **Branding: violet default** — the default brand color was emerald `#059669` — changed to violet `#8b5cf6` to match the app's own identity. Tenants can still override it.
7. **All pages use shared StatCard/EmptyState/formatVND/StatusBadge** — no more local formatters or icon components. The `vnd()` formatter was duplicated in 2 pages — removed.
8. **No emerald left** — verified via grep: no `text-emerald-600`, `bg-emerald-100`, `border-emerald-200` remain in any manager page. The StatCard `emerald` accent key is aliased to violet (for backwards compat with Home.jsx that still passes `accent="emerald"`).

## Verification
- [x] Static/lint: `npm run build` — green (built in 1.57s, no errors)
- [x] Tests: 108/108 passed (342 assertions) — no backend changes
- [x] No backend changes; tenant-scope + wall-as-UTC preserved; no new deps
- [ ] Browser ~390px + ~1440px across the listed pages — manager to verify visually

## Handoff Notes
- The `Home/Index.jsx` still passes `accent="emerald"` to `StatCard` (because T12 landed before this alias). `StatCard.jsx` maps `emerald → violet` so no breakage.
- `STATUS_BORDER` in Calendar was renamed to `STATUS_TINT` (different shape — object not string). Any downstream references would break, but none exist.
- `getTierColor` → `getTierVariant` in PricingRules (returns Badge variant string, not color classes).
- The GuestLayout no longer imports `ApplicationLogo` or `Link`. If any other auth page uses the ApplicationLogo directly via GuestLayout, they'll need to update — only `Login.jsx` and the password-reset pages use this layout.
- Login page no longer uses `PrimaryButton`, `TextInput`, `InputLabel` from Breeze — it uses shadcn `Button` + `Input` + icon wrappers. The Breeze components still exist but are no longer used by Login.

## Status
✅ Completed — branch `feat/retheme-sweep` pushed, handoff committed to main
