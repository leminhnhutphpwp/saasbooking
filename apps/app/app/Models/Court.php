<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Court extends Model
{
    use Auditable;
    use SoftDeletes;

    // tenant_id / status are NOT mass-assignable (audit #10) — set via forceCreate/forceFill.
    protected $fillable = ['name', 'court_type'];

    protected $casts = [
        'court_type' => CourtType::class,
        'status' => CourtStatus::class,
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

    public function openingRules(): HasMany
    {
        return $this->hasMany(OpeningRule::class);
    }

    public function pricingRules(): HasMany
    {
        return $this->hasMany(PricingRule::class);
    }
}
