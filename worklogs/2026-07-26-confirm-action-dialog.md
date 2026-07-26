# Shared action confirmation dialog

## Goal

Replace inconsistent browser confirmation alerts with one accessible, theme-aware confirmation popup across the manager UI.

## Changed

- Added `resources/js/Components/ConfirmActionDialog.jsx` on top of the existing shadcn AlertDialog primitive.
- Standardized destructive/default variants, icon treatment, Vietnamese labels, mobile layout, and processing states.
- Replaced browser `confirm()` usage for pricing-rule deletion, opening-rule deletion, recurring-series cancellation, bank-transaction dismissal, and refund completion.
- Migrated court archive and bulk status confirmations to the same shared component.

## Decisions

- Kept profile deletion as its dedicated password-confirmation modal because it is a multi-step security flow, not a one-click confirmation.
- Did not add confirmation for removing an unsaved branding preview; that change is only persisted when the settings form is submitted.

## Verification

- Repository search reports no remaining `confirm()` or `alert()` browser calls in `resources/js`.
- `npm run build` passed.
- Related feature test run passed 70 tests; the only failures were the two pre-existing `ResourceCategoryTest` migration-backfill assertions.

## Next

- Visually verify one destructive and one non-destructive confirmation at mobile and desktop widths.
