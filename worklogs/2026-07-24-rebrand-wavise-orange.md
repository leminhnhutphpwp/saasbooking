# 2026-07-24 — Rebrand SÂN to Wavise warm orange palette

## Overview
Replaced the violet/indigo palette (which looked "AI-generated" and clashed with the Wavise brand) with a warm orange→amber palette derived from the brand logo. All CSS tokens + 48+ hardcoded color classes updated across 13 source files. Brand logo PNG now appears in the sidebar instead of a gradient div.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/resources/css/app.css` | CSS variables: primary 263→16 (warm orange), foreground 222→220 (navy), accent→amber tint, dark mode→deep navy base |
| `apps/app/resources/js/Layouts/ManagerLayout.jsx` | Replaced gradient div + ApplicationLogo SVG with real `<img src="/logo-transparent.png">` |
| `apps/app/resources/js/Layouts/GuestLayout.jsx` | Blobs: indigo→orange, violet→amber; gradient: `to-indigo-500` → `to-amber-500` |
| `apps/app/resources/js/Components/StatCard.jsx` | Accent key `violet`→`orange`; fixed emerald mapped to violet colors |
| `apps/app/resources/js/Components/QuickLinks.jsx` | Calendar→orange, Walk-in→amber |
| `apps/app/resources/js/Components/AppTopbar.jsx` | Avatar gradient: `from-orange-500 via-amber-500 to-yellow-500` |
| `apps/app/resources/js/Pages/Manager/Calendar/Index.jsx` | Confirmed status border `#8b5cf6`→`#f97316` (orange) |
| `apps/app/resources/js/Pages/Manager/Home/Index.jsx` | Revenue chart, progress bars, stat text, legend dots → warm |
| `apps/app/resources/js/Pages/Manager/Reports/Index.jsx` | StatCard accents, deposit card tint → orange |
| `apps/app/resources/js/Pages/Manager/Refunds/Index.jsx` | Icon tile tint → orange |
| Auth pages (Register, VerifyEmail, UpdateProfileInformationForm) | `ring-indigo-500` → `ring-primary` (design token) |

## Key Decisions
1. **Warm orange (#FF6B35, hsl 16 100% 60%) as primary** — matches the logo's W mark gradient directly, not a muted approximation.
2. **Dark navy foreground (#1a1f36, hsl 220 30% 15%)** — matches the logo wordmark, replaces cold slate.
3. **Deep navy dark-mode base (hsl 220 25% 8%)** — keeps dark mode feeling premium, not gray.
4. **Semantic colors preserved** — emerald (success), rose (danger), amber (warning) unchanged. Only brand colors were swapped.
5. **Real brand logo in sidebar** — replaced the hand-crafted gradient `<div>` + SVG icon with `<img src="/logo-transparent.png">`. Consistent with the actual brand.

## Verification
- [x] Static: `npm run build` passes
- [x] `grep -rn "violet\|indigo\|purple"` returns ZERO results in resources/js/
- [ ] Manual: open app in browser, verify warm orange palette across all pages
- [ ] Manual: dark mode toggle, verify deep navy + warm orange

## Handoff Notes
- PR #25 created: https://github.com/leminhnhutphpwp/saasbooking/pull/25
- T20 (visual QA) is unblocked after merge — manager should open the app and visually verify the rebrand
- If any page still has cold colors, check for hardcoded hex values or `bg-slate-*` classes that weren't caught

## Status
✅ Completed
