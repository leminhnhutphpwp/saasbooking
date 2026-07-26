<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\PricingRule;
use App\Support\Messages;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Owns pricing-rule conflict detection for both venue-wide and court-specific scopes. */
class PricingRuleService
{
    public function hasRules(int $tenantId): bool
    {
        return PricingRule::query()->where('tenant_id', $tenantId)->exists();
    }

    /** @param array{weekday:array<int>, start_local:string, end_local:string, price_per_hour:int, priority:int} $data */
    public function create(int $tenantId, ?int $courtId, array $data): PricingRule
    {
        return DB::transaction(function () use ($tenantId, $courtId, $data) {
            $this->lockScope($tenantId, $courtId);
            $this->assertNoOverlap($tenantId, $courtId, $data);

            return PricingRule::create([...$data, 'tenant_id' => $tenantId, 'court_id' => $courtId]);
        });
    }

    /** @param array{weekday:array<int>, start_local:string, end_local:string, price_per_hour:int, priority:int} $data */
    public function update(PricingRule $rule, array $data): PricingRule
    {
        return DB::transaction(function () use ($rule, $data) {
            $this->lockScope($rule->tenant_id, $rule->court_id);
            $this->assertNoOverlap($rule->tenant_id, $rule->court_id, $data, $rule->id);
            $rule->update($data);

            return $rule;
        });
    }

    /**
     * @param  array{weekday: array<int>, start_local: string, end_local: string, priority?: int|string|null}  $data
     */
    public function assertNoOverlap(int $tenantId, ?int $courtId, array $data, ?int $ignoreId = null): void
    {
        $newStart = substr($data['start_local'], 0, 5);
        $newEnd = substr($data['end_local'], 0, 5);
        $weekdays = array_map('intval', $data['weekday']);
        $priority = (int) ($data['priority'] ?? 0);

        $existing = PricingRule::query()
            ->where('tenant_id', $tenantId)
            ->where('court_id', $courtId)
            ->where('priority', $priority)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->get();

        foreach ($existing as $rule) {
            if (array_intersect($weekdays, $rule->weekday) === []) {
                continue;
            }

            $existingStart = substr($rule->start_local, 0, 5);
            $existingEnd = substr($rule->end_local, 0, 5);

            if ($newStart < $existingEnd && $existingStart < $newEnd) {
                throw ValidationException::withMessages([
                    'start_local' => Messages::get('pricing', 'conflict'),
                ]);
            }
        }
    }

    private function lockScope(int $tenantId, ?int $courtId): void
    {
        DB::select('SELECT pg_advisory_xact_lock(?, ?)', [$tenantId, $courtId ?? 0]);
    }
}
