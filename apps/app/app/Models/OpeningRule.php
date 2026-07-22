<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpeningRule extends Model
{
    protected $fillable = [
        'tenant_id', 'court_id', 'weekday', 'open_local', 'close_local', 'tz', 'effective_from', 'effective_to',
    ];

    protected $casts = [
        'weekday' => 'array',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];
}
