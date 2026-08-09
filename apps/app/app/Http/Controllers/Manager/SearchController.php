<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Support\WorkingTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        $query = $request->string('q', '')->trim()->toString();

        if (strlen($query) < 2) {
            return response()->json([
                'bookings' => [],
                'customers' => [],
                'courts' => [],
            ]);
        }

        // Search bookings by code or customer name
        $bookings = Booking::query()
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($query) {
                $q->where('code', 'ilike', "%{$query}%")
                  ->orWhereHas('customer', function ($cq) use ($query) {
                      $cq->where('name', 'ilike', "%{$query}%")
                         ->orWhere('phone', 'ilike', "%{$query}%");
                  });
            })
            ->with('customer')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($booking) => [
                'uuid' => $booking->uuid,
                'code' => $booking->code,
                'customer_name' => $booking->customer?->name,
                'phone' => $booking->customer?->phone,
            ]);

        // Search customers by name or phone
        $customers = Customer::query()
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('phone', 'ilike', "%{$query}%")
                  ->orWhere('email', 'ilike', "%{$query}%");
            })
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(fn ($customer) => [
                'uuid' => $customer->uuid,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ]);

        // Search courts by name
        $courts = Court::query()
            ->where('tenant_id', $tenantId)
            ->where('name', 'ilike', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(fn ($court) => [
                'id' => $court->id,
                'uuid' => $court->uuid,
                'name' => $court->name,
                'status' => $court->status->value,
            ]);

        return response()->json([
            'bookings' => $bookings,
            'customers' => $customers,
            'courts' => $courts,
        ]);
    }
}
