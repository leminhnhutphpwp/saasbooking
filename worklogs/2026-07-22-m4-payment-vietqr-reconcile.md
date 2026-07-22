# 2026-07-22 — M4: Payment — cọc VietQR + đối soát

## Overview
Cọc qua VietQR + đối soát tự động (SePay). `ReconcileService` là crown jewel: idempotent bằng `unique(bank_txn_id)`, khớp theo `memo`→booking.code (không theo số tiền), **3 nhánh** confirm/grace/orphaned+refund. Cọc mất do bom → refund ledger riêng.

## Files Changed (apps/app/)
| File | Change |
|------|--------|
| `..._create_tenant_bank_config_table.php` | TK nhận cọc + webhook_secret (encrypted) + map account→tenant |
| `..._create_payments_table.php` | `payments` (memo_ref=code, `unique(bank_txn_id)` idempotency, unique(tenant,booking,method)) |
| `..._create_bank_txn_inbox_table.php` | inbox thô `unique(provider,bank_txn_id)` dedupe + note (hàng chờ đối soát tay) |
| `..._create_refunds_table.php` | refund ledger riêng (payments.amount bất biến) |
| `Enums/{PaymentStatus,PaymentMethod,RefundStatus,RefundMethod}.php` | enums |
| `Support/VietQr.php` | build payload EMVCo VietQR (napas) + CRC16-CCITT — tự chứa, không phụ thuộc dịch vụ ngoài |
| `Services/Payment/PaymentService.php` | `initDeposit` (tạo payment + QR), `requestRefund`, `markRefundDone` |
| `Services/Payment/ReconcileService.php` | `ingest`: inbox idempotent → khớp memo → 3 nhánh; thiếu tiền → hàng chờ tay (không auto-confirm) |
| `Services/Booking/BookingService.php` | `secureForPayment()` → held/regained/lost (grace re-hold qua exclusion constraint) |
| `Http/Controllers/Webhook/BankReconcileController.php` + `routes/api.php` + `bootstrap/app.php` | webhook SePay (`/api/webhooks/sepay`), xác thực token theo tenant |
| `tests/Feature/Payment/{ReconcileTest,VietQrTest,WebhookTest}.php` | 8 test |

## Key Decisions
1. **Savepoint cho idempotency** — bắt `23505` (unique violation) khi insert inbox trùng phải bọc trong `DB::transaction` (nested = savepoint), nếu không sẽ làm abort transaction ngoài (RefreshDatabase / production). Cùng pattern với `secureForPayment` (23P01 grace/lost).
2. **3 nhánh dựa vào `secureForPayment`** — slot còn giữ → confirm; hết hạn nhưng re-hold được → grace confirm; re-hold vướng exclusion constraint → orphaned + auto refund `race_lost`. Exclusion constraint vẫn là trọng tài.
3. **Thiếu tiền KHÔNG auto-confirm** — vào `bank_txn_inbox.note` (hàng chờ đối soát tay của chủ sân), khớp docs/10 P1.
4. **VietQR tự sinh EMV** (không phụ thuộc vietqr.io) — render QR client-side từ chuỗi payload.
5. **webhook_secret encrypted** (Laravel cast) — xác thực theo account→tenant.

## Verification
- [x] `php artisan migrate`: 4 bảng ✓
- [x] `php artisan test`: **55/55 passed** trên PostgreSQL (8 test M4)
  - confirm trong TTL ✓ · webhook trùng confirm 1 lần (idempotent) ✓ · grace sau hết hạn ✓ · orphaned + refund khi mất slot ✓ · thiếu tiền không confirm ✓ · webhook token đúng→confirm / sai→401 ✓ · VietQR CRC hợp lệ ✓
- [x] `npm run build`: pass · `pint --test`: pass

## Handoff Notes
- **UI còn thiếu (→ M6):** trang đặt sân hiện QR (backend `initDeposit` trả chuỗi EMV + account), màn "refund chờ xử lý" cho chủ sân (backend `requestRefund`/`markRefundDone` xong), màn "giao dịch chưa khớp" (inbox.note).
- **BookingConfirmed/BookingCancelled events** đã bắn trong confirm/orphaned — M5 gắn listener gửi Zalo ZNS.
- Webhook path: `POST /api/webhooks/sepay`, header `Authorization: Bearer <tenant webhook_secret>`.

## Status
✅ Completed (lõi) — cọc VietQR + đối soát 3 nhánh + idempotency + webhook xong & test. ⚠️ UI (QR/refund) để M6. Sẵn sàng M5 (Zalo ZNS).
