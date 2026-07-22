<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    protected $fillable = [
        'tenant_id', 'court_id', 'weekday', 'start_local', 'end_local', 'price_per_hour', 'priority',
    ];

    protected $casts = [
        'weekday' => 'array',
        'price_per_hour' => 'integer',
        'priority' => 'integer',
    ];
}
