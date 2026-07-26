<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * A court venue. One tenant = one operator's set of courts. `uuid` is the public route key;
 * `id` bigint is the internal FK target used by every tenant-owned table.
 */
class Tenant extends Model
{
    use Auditable;
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    protected $fillable = [
        'name', 'slug', 'vertical', 'timezone', 'status', 'settings', 'is_ready', 'readiness_checked_at',
        'address', 'phone', 'email', 'website', 'lat', 'lng', 'description',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant) {
            if (empty($tenant->uuid)) {
                $tenant->uuid = (string) Str::uuid();
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function courts(): HasMany
    {
        return $this->hasMany(Court::class);
    }

    public function bankConfigs(): HasMany
    {
        return $this->hasMany(TenantBankConfig::class);
    }

    public function activeBankConfig()
    {
        return $this->hasOne(TenantBankConfig::class)->where('active', true);
    }
}
