<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Blackout extends Model
{
    protected $fillable = ['tenant_id', 'court_id', 'starts_at', 'ends_at', 'reason'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];
}
