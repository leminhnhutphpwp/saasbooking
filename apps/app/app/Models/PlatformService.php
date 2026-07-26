<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PlatformServiceStatus;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PlatformService extends Model
{
    use Auditable;
    use SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'description', 'vertical_key', 'status', 'icon', 'pricing_model',
        'max_resources', 'features', 'trial_days', 'landing_page_url', 'display_order', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'status' => PlatformServiceStatus::class,
            'max_resources' => 'integer',
            'features' => 'array',
            'trial_days' => 'integer',
            'display_order' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (PlatformService $service) {
            if (empty($service->uuid)) {
                $service->uuid = (string) Str::uuid();
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', PlatformServiceStatus::Active);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'service_id');
    }
}
