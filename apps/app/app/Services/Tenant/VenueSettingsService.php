<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant;

/** Public read API for structured tenant settings used by other modules. */
class VenueSettingsService
{
    /** @var array<int, int|null> */
    private array $defaultPrices = [];

    public function defaultPricePerHour(int $tenantId): ?int
    {
        if (array_key_exists($tenantId, $this->defaultPrices)) {
            return $this->defaultPrices[$tenantId];
        }

        $settings = Tenant::query()->whereKey($tenantId)->value('settings');
        $settings = is_string($settings) ? json_decode($settings, true) : $settings;
        $price = $settings['pricing']['default_price_per_hour'] ?? null;

        return $this->defaultPrices[$tenantId] = $price !== null ? (int) $price : null;
    }
}
