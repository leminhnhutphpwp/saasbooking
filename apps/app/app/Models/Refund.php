<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CancelReason;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Refund extends Model
{
    use Auditable;

    protected $fillable = [
        'tenant_id', 'payment_id', 'amount', 'reason', 'method', 'status',
        'requested_at', 'resolved_at', 'resolved_by',
    ];

    protected $casts = [
        'amount' => 'integer',
        'reason' => CancelReason::class,
        'method' => RefundMethod::class,
        'status' => RefundStatus::class,
        'requested_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Refund $refund) {
            if (empty($refund->uuid)) {
                $refund->uuid = (string) Str::uuid();
            }
        });
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
