# 2026-07-23 — Siết mass-assignment 5 model (audit #10)

## Overview
Trả nợ #10 từ M6 audit: bỏ các cột nhạy cảm (`tenant_id` / `status` / tiền) khỏi `$fillable` để request **không thể mass-assign**, thay bằng gán nội bộ có kiểm soát (`forceCreate`/`forceFill`) ở các service/controller tin cậy. Làm với churn tối thiểu nhờ `Model::unguard()` trong test + lưới `preventSilentlyDiscardingAttributes` cho dev.

## Files Changed (apps/app/)
| File | Change |
|------|--------|
| `Models/{Booking,Payment,Court,Refund,RecurringSeries}` | Bỏ tenant_id/status/tiền khỏi `$fillable` |
| `Services/Booking/{BookingService,SeriesService}` | create→`forceCreate`; 5 status-update→`forceFill(...)->save()` |
| `Services/Payment/{PaymentService,ReconcileService}` | firstOrCreate→query+`forceCreate`; Refund create + status-update→force* |
| `Http/Controllers/Manager/{CalendarController,CourtController,SeriesController}` | Payment/Court create→`forceCreate`; status-update→`forceFill` |
| `Providers/AppServiceProvider` | `Model::preventSilentlyDiscardingAttributes(! isProduction())` |
| `tests/TestCase` | `Model::unguard()` trong setUp (fixtures giữ nguyên) |
| `tests/Feature/Security/MassAssignmentGuardTest` | +15 case: fillable không chứa field nhạy cảm + reguard→create ném MassAssignmentException |

## Key Decisions
1. **`forceCreate`/`forceFill` cho writer tin cậy** — dữ liệu do service dựng (tenant_id từ WorkingTenant, tiền tính toán, enum status), bỏ qua guard là đúng ngữ cảnh.
2. **`Model::unguard()` trong test** — 32 chỗ `Model::create([...])` ở 15 file test giữ nguyên (không có model factory); tránh churn ~47 chỗ. Bảo vệ thật vẫn được test riêng qua `reguard()`.
3. **Guard chỉ bật ngoài production** — dev/staging báo lỗi lớn khi lỡ mass-assign field guarded; prod lenient để 1 edge case không 500 booking thật.
4. **Vẫn KHÔNG bật full `shouldBeStrict()`** — tránh preventLazyLoading làm vỡ code hiện có; chỉ chống silent-discard.

## Verification
- [x] `php artisan test` (PostgreSQL): **108/108 passed** (93 + 15 guard)
- [x] `pint --test`: pass
- [x] Guard hành vi: `Court::create(['status'=>...])` ném `MassAssignmentException` khi guarding bật.

## Handoff Notes
- Từ nay writer nội bộ cho 5 model phải dùng `forceCreate`/`forceFill` (hoặc gán thuộc tính rồi `save()`), KHÔNG `create([...])`/`update([...])` với field nhạy cảm — dev sẽ throw ngay nếu quên.
- Không đụng invariant khác; audit #10 khép lại.

## Status
✅ Completed — nhánh `chore/strict-model-attributes`.
