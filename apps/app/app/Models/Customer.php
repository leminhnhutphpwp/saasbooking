<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Customer extends Model
{
    use Auditable;

    protected $fillable = ['tenant_id', 'phone', 'name', 'email'];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Customer $customer) {
            if (empty($customer->uuid)) {
                $customer->uuid = (string) Str::uuid();
            }
        });
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
