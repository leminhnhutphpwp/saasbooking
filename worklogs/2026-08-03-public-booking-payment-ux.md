# Public Booking Payment UX

## Goal
Clarify public booking payment, hold, and cancellation information without creating payment methods or policy values.

## Changed
- Serialized public status balance, hold expiry, valid cancellation-policy snapshot, and refund state from the existing booking/payment records.
- Labeled rental total, deposit payable now, uncollected balance, hold deadline/countdown, cancellation terms, and refund outcome in the public pages.
- Added a focused Inertia feature test for the snapshot contract.

## Decisions
- The booking sheet shows only its known selected-slot rental total; its deposit is not known until a booking snapshot exists.
- The remaining balance is described as not yet recorded, rather than promising a payment time or method that is not configured.
- Invalid or absent cancellation snapshots are omitted rather than inferred.

## Next
- Product must decide when and how any remaining rental balance is collected, and define customer-facing guidance for refund completion or failure.
