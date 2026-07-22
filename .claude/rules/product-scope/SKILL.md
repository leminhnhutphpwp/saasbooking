---
name: product-scope
description: Product scope and identity for SÂN (court booking SaaS)
metadata:
  scope: global
  type: rules
---

# Product Scope

## Identity

**SÂN** — a court-booking SaaS for Vietnam. Every court owner gets their own booking page, takes a **VietQR deposit to fight no-shows**, and sends **Zalo reminders**. Solo dev, Vietnam market. Beachhead: **pickleball / badminton courts**.

## Core Features (Phase 1)

1. **Own booking page** per tenant (hosted subdomain, branded via template — not a builder).
2. **Single & recurring bookings** — one-off court slots and weekly fixed slots (series).
3. **VietQR deposit + auto reconciliation** (SePay/Casso) — the anti-no-show wedge.
4. **Peak / off-peak pricing**, multi-court availability.
5. **Zalo ZNS** confirmations + reminders.
6. **Owner dashboard** — grid calendar, walk-in (cash) bookings, refunds.

## Target Users

- **Court owners** (4–10 courts) — the paying customer.
- **Players** — end customers who book and pay a deposit (behavior already common in VN).

## Technical Principles

1. **One system, many product lines** — new verticals (golf, spa) and tenant types are configs on the shared platform, not separate apps.
2. **Extend by adding, never break the core** — classify each proposal as *do now / reserved door / not doing*.
3. **`WorkingTenant`** is the only source of tenant context; **`BookingService`** is the only concurrency chokepoint.
4. **Two inventory shapes** meet at the `booking` layer: resource-time-slot (courts) and capacity/session (golf, classes — reserved door).
5. **Vietnamese locale** for end-user UI; flat pricing, manual-hands-on onboarding.

## Non-Goals

- Drag-and-drop site builder (use templates + the `interop` embed).
- Metered/usage billing (flat plans only).
- Payment gateways (VietQR + reconciliation is enough for Phase 1).
- Building or selling golf / spa verticals early (reserved doors — avoid diluting focus).

## When to use this skill

Reference this when:
- Planning a feature or making a product decision
- Judging whether something is in scope
- Prioritizing the roadmap (`docs/12`)
