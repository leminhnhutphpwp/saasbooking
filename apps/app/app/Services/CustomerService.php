<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Lightweight customer operations — phone-first, phone-normalized identity.
 * All search and mutations are tenant-scoped via WorkingTenant.
 */
class CustomerService
{
    /**
     * Normalize a Vietnamese phone number to E.164-ish format.
     * Strips spaces, dashes, dots, parentheses. Leading 0 → +84.
     * Non-Vietnamese numbers (already +xx) pass through unchanged.
     */
    public function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[\s\-\.\(\)]+/', '', trim($phone));

        // Already international format.
        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        // Vietnamese: leading 0 → +84.
        if (str_starts_with($phone, '0')) {
            return '+84'.substr($phone, 1);
        }

        // Bare 9-10 digit number (no leading 0) → treat as VN.
        if (preg_match('/^\d{9,10}$/', $phone)) {
            return '+84'.$phone;
        }

        return $phone;
    }

    /**
     * Search customers by normalized phone prefix or name (ILIKE), tenant-scoped.
     * Returns up to $limit matches.
     */
    public function search(Request $request, string $query, int $limit = 20): Collection
    {
        $tenantId = (int) $request->attributes->get('workingTenantId');
        $normalized = $this->normalizePhone($query);

        return Customer::query()
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($query, $normalized) {
                $q->where('phone', 'ILIKE', $normalized.'%')
                    ->orWhere('name', 'ILIKE', '%'.$query.'%');
            })
            ->orderBy('name')
            ->limit($limit)
            ->get();
    }

    /**
     * Create or update a customer. Phone is the identity key (normalized).
     * If a customer with the same normalized phone exists in this tenant, update name/email.
     * Otherwise, create a new one.
     */
    public function upsert(Request $request, array $data): Customer
    {
        $tenantId = (int) $request->attributes->get('workingTenantId');
        $normalizedPhone = $this->normalizePhone($data['phone']);

        $existing = Customer::where('tenant_id', $tenantId)
            ->where('phone', $normalizedPhone)
            ->first();

        if ($existing) {
            $existing->forceFill(array_filter([
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
            ], fn ($v) => $v !== null))->save();

            return $existing->fresh();
        }

        return Customer::forceCreate([
            'tenant_id' => $tenantId,
            'phone' => $normalizedPhone,
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
        ]);
    }

    /**
     * Get a customer's booking history with attendance stats, tenant-scoped.
     *
     * @return array{customer: Customer, stats: array{total_bookings: int, completed: int, no_shows: int, cancelled: int, upcoming: int}, bookings: Collection}
     */
    public function getHistory(Request $request, Customer $customer): array
    {
        $tenantId = (int) $request->attributes->get('workingTenantId');
        abort_unless($customer->tenant_id === $tenantId, 403);

        $bookings = $customer->bookings()
            ->where('tenant_id', $tenantId)
            ->with(['slots.court'])
            ->orderByDesc('created_at')
            ->get();

        $stats = [
            'total_bookings' => $bookings->count(),
            'completed' => $bookings->where('status', BookingStatus::Confirmed)->count(),
            'no_shows' => $bookings->where('status', BookingStatus::NoShow)->count(),
            'cancelled' => $bookings->where('status', BookingStatus::Cancelled)->count(),
            'upcoming' => $bookings->where('status', BookingStatus::Confirmed)
                ->where(fn ($q) => $q->whereHas('slots', fn ($sq) => $sq->where('start_at', '>', now())))->count(),
        ];

        return [
            'customer' => $customer,
            'stats' => $stats,
            'bookings' => $bookings,
        ];
    }

    /**
     * Get all customers for a tenant, paginated.
     */
    public function paginate(Request $request, int $perPage = 20): LengthAwarePaginator
    {
        $tenantId = (int) $request->attributes->get('workingTenantId');

        return Customer::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->paginate($perPage);
    }
}
