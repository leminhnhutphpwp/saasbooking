<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

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
     *
     * Identity depends on this being total: every accepted spelling of the same human must
     * collapse to one string, because unique(tenant_id, phone) is the identity key.
     */
    public function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[\s\-\.\(\)]+/', '', trim($phone));

        // Already international format.
        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        // International access prefix (00 84 …) → +84…
        if (str_starts_with($phone, '0084')) {
            return '+'.substr($phone, 2);
        }

        // Vietnamese: leading 0 → +84.
        if (str_starts_with($phone, '0')) {
            return '+84'.substr($phone, 1);
        }

        // Country code without a plus (84912345678) → +84912345678.
        if (preg_match('/^84\d{9,10}$/', $phone)) {
            return '+'.$phone;
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

        $customer = Customer::create([
            'tenant_id' => $tenantId,
            'phone' => $normalizedPhone,
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
        ]);

        return $customer->fresh();
    }

    /**
     * Update the given customer in place. The bound record is the identity being edited — a phone
     * change must never silently create or hijack a second record, so a number already used by a
     * different customer in this tenant is rejected as a validation error.
     *
     * @param  array{phone?:string, name?:string|null, email?:string|null}  $data
     */
    public function updateCustomer(Customer $customer, array $data, int $tenantId): Customer
    {
        abort_unless($customer->tenant_id === $tenantId, 403);

        $attributes = [];

        if (array_key_exists('phone', $data) && $data['phone'] !== null) {
            $normalizedPhone = $this->normalizePhone($data['phone']);

            if ($normalizedPhone !== $customer->phone) {
                $taken = Customer::where('tenant_id', $tenantId)
                    ->where('phone', $normalizedPhone)
                    ->whereKeyNot($customer->getKey())
                    ->exists();

                if ($taken) {
                    throw ValidationException::withMessages([
                        'phone' => 'Số điện thoại này đã thuộc về một khách hàng khác.',
                    ]);
                }
            }

            $attributes['phone'] = $normalizedPhone;
        }

        foreach (['name', 'email'] as $field) {
            if (array_key_exists($field, $data)) {
                $attributes[$field] = $data[$field];
            }
        }

        if ($attributes !== []) {
            $customer->forceFill($attributes)->save();
        }

        return $customer->refresh();
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
     * Search customers by normalized phone or name (ILIKE), paginated with query string preserved.
     */
    public function searchPaginated(Request $request, string $query, int $perPage = 20): LengthAwarePaginator
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
            ->paginate($perPage)
            ->withQueryString();
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
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Booking-history stats for a customer within the current tenant.
     *
     * @return array{total_bookings: int, completed: int, no_shows: int, cancelled: int, upcoming: int}
     */
    public function getStats(Customer $customer, int $tenantId): array
    {
        $base = $customer->bookings()->where('tenant_id', $tenantId);

        return [
            'total_bookings' => (clone $base)->count(),
            'completed' => (clone $base)->where('status', BookingStatus::Confirmed)->count(),
            'no_shows' => (clone $base)->where('status', BookingStatus::NoShow)->count(),
            'cancelled' => (clone $base)->where('status', BookingStatus::Cancelled)->count(),
            'upcoming' => (clone $base)->where('status', BookingStatus::Confirmed)
                ->whereHas('slots', fn ($sq) => $sq->where('start_at', '>', now()))->count(),
        ];
    }

    /**
     * Paginated booking history for a customer, most-recent first.
     */
    public function getHistoryPaginated(Customer $customer, int $tenantId, int $perPage = 10): LengthAwarePaginator
    {
        return $customer->bookings()
            ->where('tenant_id', $tenantId)
            ->with('slots.court')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }
}
