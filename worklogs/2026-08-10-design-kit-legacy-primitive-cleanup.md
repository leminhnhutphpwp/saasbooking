# 2026-08-10 - Design-kit legacy primitive cleanup

**Goal:** Remove unused legacy UI primitives after the canonical design-kit migration.
**Changed:** Deleted `apps/app/resources/js/Components/ui/dropdown-menu.jsx`, `apps/app/resources/js/Components/ui/sheet.jsx`, `apps/app/resources/js/Components/ui/sidebar.jsx`, `apps/app/resources/js/Components/ui/popover.jsx`, `apps/app/resources/js/Components/ui/scroll-area.jsx`, `apps/app/resources/js/Components/NavLink.jsx`, and `apps/app/resources/js/Components/ResponsiveNavLink.jsx`; updated `tasks/T53-design-kit-legacy-primitive-cleanup.md`.
**Decisions:** Exact source searches found no live consumers; the only scoped reference was the deleted dead `sidebar.jsx` import of `sheet.jsx`. Kept Radix dependency packages because they can support other retained primitives. The host has no `npm`; `docker compose exec -T vite npm run build` passed in the Vite container.
**Next:** No T53 follow-up.
