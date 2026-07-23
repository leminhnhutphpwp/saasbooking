<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentMode;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Booking extends Model
{
    use Auditable;
    use SoftDeletes;

    // tenant_id / status / total_amount / deposit_amount are intentionally NOT mass-assignable
    // (defense-in-depth, audit #10) — set explicitly by services via forceCreate/forceFill only.
    protected $fillable = [
        'code', 'customer_id', 'series_id', 'channel',
        'hold_expires_at', 'payment_mode',
        'cancel_policy_snapshot', 'reminded_at',
    ];

    protected $casts = [
        'status' => BookingStatus::class,
        'channel' => BookingChannel::class,
        'payment_mode' => PaymentMode::class,
        'hold_expires_at' => 'datetime',
        'reminded_at' => 'datetime',
        'cancel_policy_snapshot' => 'array',
        'total_amount' => 'integer',
        'deposit_amount' => 'integer',
    ];

    /** Not worth auditing — set by the reminder job, not a business change. */
    protected array $auditExclude = ['reminded_at'];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Booking $booking) {
            if (empty($booking->uuid)) {
                $booking->uuid = (string) Str::uuid();
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function slots(): HasMany
    {
        return $this->hasMany(BookingSlot::class);
    }
}
