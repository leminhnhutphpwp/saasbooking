# 2026-07-26 — Frontend: Security Token Support in Booking URLs

## Goal
Update React frontend components to support HMAC security tokens in booking status URLs and add customer history page.

## Changed

### Status.jsx (`resources/js/Pages/Public/Booking/Status.jsx`)
- Added `token` to component props: `export default function Status({ tenant, booking, qr, account, token })`
- Added `Link2` icon import from lucide-react
- Added `secureUrl` state derived from `window.location.href` (includes the token in query string)
- Added secure link copy section in the booking code card — shows when `token` is present:
  - Displays "Liên kết analto" label with `Link2` icon
  - Copy button copies the full secure URL
  - Helper text: "Liên kết này chứa mã bảo mật — an toàn để chia sẻ"

### Show.jsx (`resources/js/Pages/Public/Booking/Show.jsx`)
- Added `History` icon import from lucide-react
- Added `customer` to component props (with destructuring)
- Added conditional "Xem lịch sử đặt sân" button in the header (Row 1b) — only renders when `customer?.code` is available
- Button navigates to `/book/{tenant.slug}/cus-{customer.code}`

### CustomerHistory.jsx (`resources/js/Pages/Public/Booking/CustomerHistory.jsx`) — NEW
- New page for viewing customer booking history by customer code
- Receives `tenant`, `customer`, `bookings` props from controller
- Displays customer info card (avatar initial, name, phone, customer code)
- Lists all bookings with status icons, court details, time slots, and total amount
- Empty state with CalendarDays icon when no bookings exist
- Back button navigates to venue booking page

### PublicBookingController.php (`app/Http/Controllers/Public/PublicBookingController.php`)
- Added `'token' => $token` to the `status()` method's Inertia render props — the token was already computed for verification but wasn't passed to the frontend

## Decisions
- The `secureUrl` in Status.jsx uses `window.location.href` which naturally includes the `?token=...` query parameter — no need to construct it manually
- The "View my bookings" link in Show.jsx is conditionally rendered only when the `customer` prop is present (the backend `show()` method doesn't pass it yet — needs a backend task to add `customer` to the Inertia props)
- CustomerHistory.jsx uses `booking.total` (not `booking.total_amount`) to match the controller's serialized prop name
- Used `booking.code` as React key instead of `booking.uuid` since the controller serializes `code`

## Next
- Backend task: Add `customer` prop to `PublicBookingController::show()` Inertia render so the "View my bookings" link appears on the booking page
- Backend task: Ensure the `hold()` redirect includes the token (already implemented in controller)
