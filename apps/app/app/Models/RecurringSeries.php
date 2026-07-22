<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SeriesStatus;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class RecurringSeries extends Model
{
    use Auditable;

    protected $table = 'recurring_series';

    protected $fillable = [
        'tenant_id', 'customer_id', 'court_id', 'weekday', 'start_local', 'end_local', 'tz',
        'start_date', 'end_date', 'price_per_session_snapshot', 'deposit_per_session',
        'generated_through', 'status',
    ];

    protected $casts = [
        'weekday' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'generated_through' => 'date',
        'price_per_session_snapshot' => 'integer',
        'deposit_per_session' => 'integer',
        'status' => SeriesStatus::class,
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (RecurringSeries $series) {
            if (empty($series->uuid)) {
                $series->uuid = (string) Str::uuid();
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'series_id');
    }
}
