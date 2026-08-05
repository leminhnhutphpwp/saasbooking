# Manager Operations UI

## Goal
Add the missing manager booking and customer operations pages using the existing Inertia controller contracts.

## Changed
- Added booking list/detail pages with filters, status actions, payments, customer links, and pagination.
- Added customer list/profile pages with search, create/edit dialogs, stats, and booking history.
- Added bookings/customers to manager navigation and a mobile sidebar trigger in the top bar.

## Decisions
- Kept all reads and writes on the existing controller props and named routes; no booking, payment, customer, or public backend logic changed.

## Next
- Configure Docker Desktop file sharing for `/media/minhnhutpc/Data Disk`, then run the Vite build and responsive browser checks.
