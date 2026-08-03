<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationMessage extends Model
{
    protected $fillable = [
        'tenant_id', 'customer_id', 'booking_id', 'channel', 'template', 'recipient', 'payload', 'status', 'attempts', 'failure_reason', 'last_attempted_at', 'sent_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'attempts' => 'integer',
        'last_attempted_at' => 'datetime',
        'sent_at' => 'datetime',
    ];
}
