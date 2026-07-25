<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Carbon\Carbon;

/**
 * Typed readiness state for a venue — the authoritative read model for "can this venue
 * accept real bookings + VietQR deposits?". Never trust frontend assumptions; the
 * dashboard must gate on this state.
 *
 * @param  Tenant  $tenant  The tenant being evaluated
 * @param  bool  $isReady  True only if zero blockers
 * @param  list<ReadinessBlocker>  $blockers  Unresolved blockers (empty when ready)
 * @param  Carbon  $checkedAt  When this evaluation was computed
 */
final readonly class ReadinessState
{
    public function __construct(
        public Tenant $tenant,
        public bool $isReady,
        public array $blockers,
        public Carbon $checkedAt,
    ) {}

    /**
     * Get only the action identifiers for each blocker (for UI navigation).
     *
     * @return list<string>
     */
    public function actionLinks(): array
    {
        return array_map(
            fn (ReadinessBlocker $b) => $b->action,
            $this->blockers,
        );
    }
}
