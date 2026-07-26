<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Customer extends Model
{
    use Auditable;
    use Notifiable;

    protected $fillable = ['tenant_id', 'phone', 'name', 'email', 'code'];

    /**
     * Keep code allocation and the insert in the same transaction so the
     * transaction-level advisory lock cannot be released before the row exists.
     */
    protected function performInsert(Builder $query): bool
    {
        $connection = $query->getConnection();

        if ($connection->transactionLevel() === 0) {
            return $connection->transaction(fn (): bool => parent::performInsert($query));
        }

        return parent::performInsert($query);
    }

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
            if (empty($customer->code)) {
                $customer->code = self::generateCode($customer->tenant_id);
            }
        });
    }

    /**
     * Generate next sequential customer code (KH0001, KH0002, …) for a tenant.
     * Serializes allocation per tenant for the duration of the insert transaction.
     */
    public static function generateCode(int $tenantId): string
    {
        $connection = (new static)->getConnection();

        $connection->select(
            "SELECT pg_advisory_xact_lock(hashtextextended('customers.code', CAST(? AS bigint)))",
            [$tenantId]
        );

        $maxNum = (int) $connection->selectOne(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 3) AS INTEGER)), 0) as max_num
             FROM customers
             WHERE tenant_id = ?
               AND code IS NOT NULL
               AND code LIKE 'KH%'",
            [$tenantId]
        )->max_num;

        return 'KH'.str_pad((string) ($maxNum + 1), 4, '0', STR_PAD_LEFT);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function routeNotificationForZaloZns(): ?string
    {
        return $this->phone;
    }

    public function routeNotificationForMail(): ?string
    {
        return $this->email;
    }
}
