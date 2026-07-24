---
id: T19
title: "Sweep all hardcoded violet/indigo/emerald/blue classes → design tokens"
status: claimed
owner: claude-sonnet-5
priority: P0
depends_on: [T18]
branch: feat/rebrand-wavise-orange
scope:
  - apps/app/resources/js/Pages/**/*.jsx
  - apps/app/resources/js/Components/**/*.jsx
  - apps/app/resources/js/Layouts/**/*.jsx
updated: 2026-07-24
---

## Goal
After T18 sets the CSS tokens to Wavise warm orange, sweep ALL remaining hardcoded Tailwind color classes (violet, indigo, purple, emerald, blue) out of pages and components. Replace with design tokens where possible, or warm equivalents (orange/amber) where a literal color is needed.

## Findings
~48 instances across these files:

### High-priority (visible on many pages)
- `Components/StatusBadge.jsx` — status colors (OK to keep emerald for success/green, rose for destructive)
- `Components/StatCard.jsx` — stat icon backgrounds
- `Components/QuickLinks.jsx` — link icons
- `Components/AppTopbar.jsx` — topbar accents

### Pages
- `Pages/Auth/Login.jsx` — emerald success banner (OK — semantic green), but check for violet/indigo
- `Pages/Auth/Register.jsx` — same
- `Pages/Auth/VerifyEmail.jsx` — same
- `Pages/Manager/Home/Index.jsx` — dashboard cards
- `Pages/Manager/Calendar/Index.jsx` — calendar grid
- `Pages/Manager/Refunds/Index.jsx` — refund table
- `Pages/Manager/Reports/Index.jsx` — report charts
- `Pages/Manager/Settings/Branding.jsx` — brand settings
- `Pages/Public/Booking/Status.jsx` — booking confirmation

### Profile / Breeze
- `Pages/Profile/Partials/UpdateProfileInformationForm.jsx` — Breeze-generated

## Replacement rules
| Old class | Replacement |
|-----------|-------------|
| `bg-violet-*` | `bg-primary/*` or `bg-orange-*` |
| `text-violet-*` | `text-primary/*` or `text-orange-*` |
| `border-violet-*` | `border-primary/*` or `border-orange-*` |
| `bg-indigo-*` | `bg-primary/*` or `bg-amber-*` |
| `text-indigo-*` | `text-primary/*` or `text-amber-*` |
| `from-indigo-*`/`via-violet-*` | `from-primary`/`via-orange-*` |
| `bg-emerald-*` (success) | KEEP — semantic green is fine |
| `text-emerald-*` (success) | KEEP — semantic green |
| `bg-blue-*` | `bg-primary/*` or `bg-sky-*` |

## DO NOT change
- `bg-emerald-*` used for success states (green = success, universal)
- `bg-rose-*` / `text-rose-*` for destructive (red = danger)
- `text-muted-foreground`, `text-foreground`, `bg-background` — these are tokens already

## Verification
```bash
grep -rn "violet\|indigo\|purple" apps/app/resources/js/ --include="*.jsx" --include="*.js"
# Should return ZERO results (except comments)
```
