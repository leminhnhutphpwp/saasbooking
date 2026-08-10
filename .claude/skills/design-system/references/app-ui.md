# App UI - shell, cards, tables, metrics

Signed-in screens are light. The plane remains visible on all four sides: 24px desktop,
12px mobile. The floating shell is `--shell`, rounded `--r-shell`, with `--e-shell`.
Topbar is 64px `--surface` and pill-shaped. A detached 64px rail is split into 2-3 pill
groups; below 1024px it becomes a bottom pill bar.

Cards are `--surface`, `--r-card`, `--e-card`, and 24px padding. No card borders.
Buttons are pills: primary turf; secondary surface with flat elevation; ghost ink-soft;
icon buttons are 36px sunk wells. Tables have no outer/vertical rules, 56px rows, right
aligned `.num` amounts, sunk alternating rows, turf-100 hover. Empty states are left
aligned instruction plus one action; skeletons pulse sunk blocks without shimmer.

Type: page title 36/42 700, metric XL 32/36 700, metric L 24/28 700, card title 15/20
600, subtitle 12/16, body 14/20, labels 11/14 uppercase with .06em tracking.
