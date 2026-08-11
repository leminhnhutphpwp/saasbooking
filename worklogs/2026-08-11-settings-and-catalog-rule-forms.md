# 2026-08-11 — Settings and catalog-rule forms (T68)

## Goal
Improve Settings and catalog-rule forms with consistent save workflow, validation feedback, and shared controls.

## Changed
- `apps/app/resources/js/Pages/Manager/Settings/VenueProfile.jsx`: replaced raw `<label>` with shared `Label`; added "Hủy" (cancel/reset) button alongside "Lưu thay đổi"; extracted `initialValues` for clean reset; used `route()` helper for form submission URL.
- `apps/app/resources/js/Pages/Manager/Settings/Branding.jsx`: replaced raw `<label>` with shared `Label`; logo removal button now uses shared `Button variant="destructive"` instead of raw `<button>`; color picker uses shared `Input type="color"`; added "Hủy" cancel/reset button; used `route()` helper for form submission URL.
- `apps/app/resources/js/Pages/Manager/Courts/OpeningRules.jsx`: weekday selector now uses shared `Checkbox` + `Label` instead of raw toggle buttons; added client-side validation (`open_local < close_local`, `effective_to >= effective_from`, at least one weekday); submit button shows "Đang lưu..." while processing; used `route()` helper for store/update/destroy URLs.
- `apps/app/resources/js/Pages/Manager/Courts/PricingRules.jsx`: weekday selector now uses shared `Checkbox` + `Label`; added client-side validation (`start_local < end_local`, `price_per_hour` positive integer, `priority` non-negative integer); submit button shows "Đang lưu..." while processing; removed redundant inline `timeError` computation in favor of `validate()` function.

## Decisions
- Flash success/error toasts are already handled by `ManagerLayout` via `usePage().props.flash` — no additional toast setup needed in these pages.
- Branding uses `router.post()` with `FormData` for multipart upload — kept this pattern rather than switching to `form.post()` which doesn't support multipart natively.
- Venue-wide pricing rules still use direct URL strings (not `route()`) since `VenuePricingController` routes don't have court-scoped parameters.

## Next
- Playwright tests for invalid and successful edits at 390px and 1440px.
- Fix pre-existing migration issues (`tenant_bank_config` table) that block VenueProfileTest and one BrandingControllerTest.
