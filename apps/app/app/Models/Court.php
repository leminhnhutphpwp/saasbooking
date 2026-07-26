<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * A court — the bookable resource (resource-time-slot shape).
 *
 * `court_type` is legacy compatibility data (deprecated, kept for historical records).
 * `resource_category_id` is the canonical tenant-scoped category reference via composite FK
 * `(tenant_id, resource_category_id)` → `resource_categories(tenant_id, id)`.
 *
 * `unique(tenant_id, id)` is the PARENT side of the composite FK `(tenant_id, court_id)`
 * used by opening_rules / pricing_rules / booking_slots so a reference can never cross tenants.
 */
class Court extends Model
{
    use Auditable;
    use SoftDeletes;

    // tenant_id / status are NOT mass-assignable (audit #10) — set via forceCreate/forceFill.
    protected $fillable = ['name', 'court_type', 'description', 'surface_type', 'display_order', 'metadata'];

    protected $casts = [
        'court_type' => CourtType::class,
        'status' => CourtStatus::class,
        'display_order' => 'integer',
        'metadata' => 'array',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Court $court) {
            if (empty($court->uuid)) {
                $court->uuid = (string) Str::uuid();
            }
        });
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function resourceCategory(): BelongsTo
    {
        return $this->belongsTo(ResourceCategory::class, 'resource_category_id');
    }

    public function openingRules(): HasMany
    {
        return $this->hasMany(OpeningRule::class);
    }

    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class);
    }
}
