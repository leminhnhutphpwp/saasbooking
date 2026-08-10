# 2026-08-10 - Design-kit final token cleanup

**Goal:** Remove the remaining scoped static token-audit violations without changing shared foundations or backend behavior.
**Changed:** T54's five frontend files and its task record.
**Decisions:** The Branding fallback reads `--turf-600` from the loaded canonical stylesheet, so a tenant with no saved color continues to submit a valid token-derived color without a JSX hex literal. Tenant `primary_color` remains dynamic public-booking data in `Status.jsx`; `Show.jsx` no longer needs an inline color because the logo itself supplies tenant identity.
**Next:** No implementation follow-up; browser QA remains environment-dependent.

## 2026-08-11 Visual QA continuation

**Goal:** Complete the blocked desktop and mobile visual QA without a CDP endpoint.
**Changed:** Corrected the mobile manager rail transform, public court icon label, and stale accessible Playwright selectors; updated T54 verification.
**Decisions:** Used the repository's Docker Playwright image and demo fixture. Only navigation, login, focus, and opening/closing the booking sheet were exercised; no booking, cancellation, or payment was submitted. `/manager/branding` is the registered route; the requested `/manager/settings/branding` remains a 404 and was not aliased.
**Next:** T54 remains in review; no known visual blocker.
