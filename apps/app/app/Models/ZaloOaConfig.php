<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZaloOaConfig extends Model
{
    protected $fillable = [
        'tenant_id', 'oa_id', 'access_token', 'refresh_token', 'token_expires_at', 'templates', 'active',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'token_expires_at' => 'datetime',
        'templates' => 'array',
        'active' => 'boolean',
    ];
}
