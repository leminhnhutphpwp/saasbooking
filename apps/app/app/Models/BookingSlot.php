<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\HoldStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingSlot extends Model
{
    protected $fillable = [
        'tenant_id', 'booking_id', 'court_id', 'start_at', 'end_at', 'price_snapshot', 'hold_status',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'price_snapshot' => 'integer',
        'hold_status' => HoldStatus::class,
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }
}
