<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantBankConfig extends Model
{
    protected $table = 'tenant_bank_config';

    protected $fillable = [
        'tenant_id', 'provider', 'bank_bin', 'account_number', 'account_name', 'webhook_secret', 'active',
    ];

    protected $casts = [
        'webhook_secret' => 'encrypted',
        'active' => 'boolean',
    ];
}
