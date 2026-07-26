<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Court;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use Illuminate\Support\Carbon;

/**
 * Computes the readiness of a venue (tenant) to accept real bookings and VietQR deposits.
 *
 * Readiness is determined by checking a series of blockers — if ANY blocker is present,
 * the venue is not ready. The authoritative state is always computed fresh via `check()`;
 * the `is_ready` / `readiness_checked_at` columns on `tenants` are a cached snapshot for
 * fast dashboard gating (never the source of truth).
 *
 * Blockers (all must pass for `is_ready = true`):
 * 1. At least one active court exists
 * 2. Every active court has at least one opening rule (opening coverage)
 * 3. At least one pricing rule exists (baseline price)
 * 4. At least one active bank config exists (VietQR deposit reconciliation)
 *
 * Design: docs/06 (ERD + readiness), docs/08 (module design), CLAUDE.md section 2 item 3 (WorkingTenant).
 */
final class VenueReadinessService
{
    /**
     * Evaluate readiness for the given tenant.
     *
     * Returns a typed readiness state with a list of blockers and direct links/actions
     * for each blocker.
     */
    public static function check(Tenant $tenant): ReadinessState
    {
        $blockers = [];

        // 1. At least one active court
        $activeCourtCount = Court::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->count();

        if ($activeCourtCount === 0) {
            $blockers[] = new ReadinessBlocker(
                code: 'no_active_court',
                message: 'Chưa có sân hoạt động nào. Vui lòng tạo ít nhất một sân.',
                action: 'courts.create',
            );
        }

        // 2. Every active court must have opening coverage
        if ($activeCourtCount > 0) {
            $courtsWithoutOpening = Court::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->whereDoesntHave('openingRules', function ($query) {
                    $query->where('effective_from', '<=', Carbon::today());
                })
                ->pluck('name');

            if ($courtsWithoutOpening->isNotEmpty()) {
                $blockers[] = new ReadinessBlocker(
                    code: 'missing_opening_coverage',
                    message: 'Các sân sau chưa có giờ mở cửa: '.$courtsWithoutOpening->implode(', '),
                    action: 'opening-rules.index',
                );
            }
        }

        // 3. At least one pricing rule (baseline price)
        $pricingRuleCount = PricingRule::where('tenant_id', $tenant->id)->count();

        if ($pricingRuleCount === 0) {
            $blockers[] = new ReadinessBlocker(
                code: 'missing_pricing',
                message: 'Chưa có quy tắc giá nào. Vui lòng thiết lập giá cho sân.',
                action: 'pricing-rules.index',
            );
        }

        // 4. At least one active bank config (VietQR deposit reconciliation)
        $activeBankConfig = TenantBankConfig::where('tenant_id', $tenant->id)
            ->where('active', true)
            ->exists();

        if (! $activeBankConfig) {
            $blockers[] = new ReadinessBlocker(
                code: 'missing_bank_config',
                message: 'Chưa có tài khoản ngân hàng active. Vui lòng cấu hình tài khoản nhận cọc.',
                action: 'bank-config.index',
            );
        }

        return new ReadinessState(
            tenant: $tenant,
            isReady: empty($blockers),
            blockers: $blockers,
            checkedAt: Carbon::now(),
        );
    }

    /**
     * Check readiness and persist the cached state to the tenant record.
     *
     * Returns the fresh ReadinessState.
     */
    public static function checkAndPersist(Tenant $tenant): ReadinessState
    {
        $state = self::check($tenant);

        $tenant->update([
            'is_ready' => $state->isReady,
            'readiness_checked_at' => $state->checkedAt,
        ]);

        return $state;
    }
}
