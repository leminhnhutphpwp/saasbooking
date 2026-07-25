# 2026-07-25 — Modern court table (T22)

## Goal
Replace the manager court card grid with a dense, modern operations table with client-side filtering.

## Files Changed
| File | Change |
|------|--------|
| `apps/app/resources/js/Pages/Manager/Courts/Index.jsx` | Replaced card grid with responsive Table inside Card, added client-side filtering toolbar, status rail, DropdownMenu for actions, and distinct empty states. |
| `tasks/T22-modern-court-table.md` | Updated status to `in-review` with verification results. |

## Key Decisions
1. **Client-side filtering** — all filtering (name search, type, status) runs via `useMemo` on the `courts` array prop. No backend requests or controller changes.
2. **Accent-insensitive search** — `normalizeVietnamese()` strips combining marks and normalizes đ/Đ for practical Vietnamese search without external dependencies.
3. **Status rail** — a slim colored vertical bar (`h-8 w-1 rounded-full`) in the identity cell provides instant visual status: emerald for active, amber for maintenance, muted for archived.
4. **DropdownMenu for overflow actions** — edit and archive moved to a `DropdownMenu` triggered by `EllipsisVertical` icon, reducing row clutter while keeping all actions accessible.
5. **Compact config buttons** — "Giờ mở cửa" and "Bảng giá" buttons remain visible on desktop (`lg:table-cell`), hidden on mobile to reduce density.
6. **Two distinct empty states** — zero courts (no data at all) vs. no-match (filters active but nothing matches) with clear-filter action.
7. **Mobile scroll** — table wraps in `overflow-x-auto` for horizontal scroll at narrow widths.

## Verification
- [x] `git diff --check` passes
- [x] `npm --prefix apps/app run build` passes (1.17s)
- [ ] Browser check at ~1440px and ~390px pending manual review

## Next
- Browser verification at desktop and mobile widths
- PR review and merge to main
