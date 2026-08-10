---
name: design-system
description: Mandatory design system for the sports court booking product. Use when writing or editing any UI: components, pages, layouts, charts, time-slot grids, landing pages, emails.
user-invocable: true
---

# Design System - Court

This is law, not advice. Tokens are the only source: no literal colors, arbitrary
spacing, radii, or shadows in UI. Turf is the sole accent. Chalk denotes selected
state once per screen. An app screen is light only; dark surfaces are marketing-only.

## Core tokens

Read `assets/tokens.css`. In this Tailwind 3 Laravel app, canonical values are
ported to `apps/app/resources/css/app.css`; do not import the Tailwind 4 theme file.

- Surface: `--plane`, `--shell`, `--surface`, `--sunk`
- Ink: `--ink`, `--ink-soft`, `--ink-mute`
- Accent: `--turf-600`, `--turf-100`; selected state: `--chalk-500`
- Radius: `--r-card`, `--r-inner`, `--r-slot`, `--r-pill`
- Elevation: `--e-card`, `--e-float`
- UI type is Be Vietnam Pro. `--font-num` uses the UI fallback because Space Grotesk
  is not installed locally; it must retain tabular numerals.

## References

Read only the matching reference: dashboard/cards/tables: `references/app-ui.md`;
booking grid: `references/booking.md`; marketing: `references/marketing.md`; charts:
`references/charts.md`; motion, focus, and keyboard: `references/motion-a11y.md`.

## Check before reporting done

- No literal colors or arbitrary values in changed UI.
- Turf covers less than about 10% of the screen; chalk appears once at most.
- Every interactive control has visible focus, works at 360px, and respects reduced motion.
- State is not color-only. Remove one thing that is not earning its place.
