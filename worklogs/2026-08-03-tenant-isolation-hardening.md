# Tenant Isolation Hardening

## Goal
Prevent cross-tenant operational identifier injection and verify isolation at the manager boundary.

## Changed
- Resolved manager home and report tenant records from `WorkingTenant`.
- Scoped manual reconciliation and dismissal inbox lookup through the current tenant's bank accounts.
- Added two-tenant UUID/ID regression coverage for bookings, payments, customers, courts, and reconciliation.
- Documented PostgreSQL RLS prerequisites without enabling an unsafe policy.

## Decisions
- Preserved the established `403` response for foreign reconciliation IDs while performing the lookup in tenant scope.
- RLS remains disabled until a non-superuser runtime role and transaction-local tenant context are deployed and verified.

## Next
- Review and merge T13; implement the documented RLS deployment prerequisites separately.
