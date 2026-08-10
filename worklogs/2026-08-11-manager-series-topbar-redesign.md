# 2026-08-11 - Manager Series and topbar visual redesign

**Goal:** Make recurring booking management purposeful and balance the authenticated topbar across the fluid Manager shell.

**Changed:** Series now uses a structured empty-state panel with one creation action and a schedule-first populated-card layout. AppTopbar now uses desktop context, centered primary navigation, and tenant/account zones; single-tenant context remains visible and the active mobile tab is aligned into the scrollable strip.

**Decisions:** Kept T56's Manager shell and T54's token stylesheet untouched under same-owner coordination. No Series routes, form fields, create/cancel behavior, tenant switching, or rail destinations changed.

**Next:** Review T57 alongside the existing Manager design tasks.
