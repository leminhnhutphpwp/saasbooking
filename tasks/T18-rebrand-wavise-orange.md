---
id: T18
title: "Rebrand CSS tokens + layout shells to Wavise warm orange palette"
status: done
owner: claude-sonnet-5
priority: P0
depends_on: []
branch: feat/rebrand-wavise-orange
scope:
  - apps/app/resources/css/app.css
  - apps/app/resources/js/Layouts/ManagerLayout.jsx
  - apps/app/resources/js/Layouts/GuestLayout.jsx
  - apps/app/resources/js/Components/ApplicationLogo.jsx
updated: 2026-07-24
---

## Goal
Replace the current violet/indigo palette with Wavise brand colors: warm orange→amber gradient (from the "W" logo mark) + dark navy text + gray-blue secondary.

## Brand palette (extracted from `public/logo-background-white.png`)
- **W mark gradient**: orange (#FF6B35) → amber (#FFA500) → golden (#FFD700)
- **Wordmark text**: dark navy (#1a1f36)
- **Tagline**: gray-blue/slate (#64748B)

## CSS Variable changes (apps/app/resources/css/app.css)

### Light theme (:root)
```
--primary: 16 100% 60%          /* warm orange #FF6B35 */
--primary-foreground: 0 0% 100%
--accent: 28 100% 95%           /* warm amber-50 tint */
--accent-foreground: 16 80% 30% /* deep orange-brown */
--ring: 16 100% 60%
--sidebar-primary: 16 100% 60%  /* warm orange */
--sidebar-accent: 28 100% 95%
--sidebar-accent-foreground: 16 80% 30%
--sidebar-ring: 16 100% 60%
--success: 28 100% 50%          /* amber instead of violet */
--foreground: 220 30% 15%       /* dark navy (not cold slate) */
--card-foreground: 220 30% 15%
--popover-foreground: 220 30% 15%
```

### Dark theme (.dark)
```
--primary: 20 100% 65%          /* slightly brighter orange on dark */
--accent: 220 30% 15%           /* deep navy */
--accent-foreground: 28 100% 85%
--sidebar-primary: 20 100% 65%
--sidebar-accent: 220 30% 18%
--sidebar-accent-foreground: 28 100% 85%
--success: 28 100% 55%
--foreground: 210 20% 92%       /* warm off-white */
--background: 220 25% 8%        /* deep navy base (not cold slate) */
--card: 220 25% 12%
```

## Layout shell changes

### ManagerLayout.jsx
Replace the hardcoded gradient div (line 39: `from-indigo-500 via-violet-500 to-pink-500`) with the real brand logo PNG:
```jsx
<img src="/logo-transparent.png" alt="Wavise" className="h-8 w-8" />
```
Or if we want to keep a background behind the logo, use a warm orange gradient: `from-orange-500 to-amber-400`.

### GuestLayout.jsx
Replace the violet/indigo blob decorations (lines 8-9: `bg-indigo-500/10`, `bg-violet-500/5`) with warm orange equivalents: `bg-orange-500/10`, `bg-amber-500/5`.
Replace the gradient (line 14: `from-primary to-indigo-500`) with `from-primary to-amber-500` (warm gradient).

### ApplicationLogo.jsx
Check if it's an SVG icon. If so, update its color to use currentColor (token-driven) or hardcode to the brand orange.

## Acceptance criteria
- No `violet`, `indigo`, or `purple` remains in CSS variables
- Sidebar active state uses warm orange (not violet)
- Login page blobs are warm orange (not violet/indigo)
- Brand logo PNG appears in sidebar and login header
- All token classes (bg-primary, text-accent-foreground) propagate the new palette
