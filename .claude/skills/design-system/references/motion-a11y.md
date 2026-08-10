# Motion and accessibility

Cards may rise 12px on initial load and 2px on hover; rows and buttons only change
background. All motion uses the token durations and is disabled by reduced-motion.

Every interactive control has a `2px solid var(--turf-600)` focus outline with 2px offset.
Tab order follows visual order. Rails and tabs are arrow-navigable, dialogs trap focus,
and touch targets are at least 44px. Use semantic nav/main/table/button elements. State
must be communicated by text, icon, or mark in addition to color. Support 360px with no
horizontal scrolling. Use `Intl.NumberFormat("vi-VN")` and Asia/Ho_Chi_Minh for times.
