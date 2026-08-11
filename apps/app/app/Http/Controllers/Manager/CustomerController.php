<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\CustomerService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Customer management — phone-first operations. All queries scoped by WorkingTenant.
 */
class CustomerController extends Controller
{
    public function __construct(private CustomerService $customers) {}

    /**
     * Search customers by phone or name, paginated.
     */
    public function index(Request $request): Response
    {
        $tenantId = WorkingTenant::id($request);
        $query = $request->string('q', '')->toString();

        $paginated = $query !== ''
            ? $this->customers->searchPaginated($request, $query)
            : $this->customers->paginate($request);

        $customers = collect($paginated->items())->map(fn (Customer $c) => [
            'id' => $c->id,
            'uuid' => $c->uuid,
            'phone' => $c->phone,
            'name' => $c->name,
            'email' => $c->email,
            'bookings_count' => $c->bookings()->where('tenant_id', $tenantId)->count(),
        ]);

        return Inertia::render('Manager/Customers/Index', [
            'customers' => $customers,
            'filters' => ['q' => $query],
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Customer profile with booking history and attendance stats.
     */
    public function show(Request $request, Customer $customer): Response
    {
        $tenantId = WorkingTenant::id($request);
        abort_unless($customer->tenant_id === $tenantId, 403);

        $stats = $this->customers->getStats($customer, $tenantId);
        $paginated = $this->customers->getHistoryPaginated($customer, $tenantId);

        return Inertia::render('Manager/Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'uuid' => $customer->uuid,
                'phone' => $customer->phone,
                'name' => $customer->name,
                'email' => $customer->email,
            ],
            'stats' => $stats,
            'bookings' => collect($paginated->items())->map(fn ($b) => [
                'id' => $b->id,
                'uuid' => $b->uuid,
                'code' => $b->code,
                'status' => $b->status->value,
                'total_amount' => $b->total_amount,
                'deposit_amount' => $b->deposit_amount,
                'created_at' => $b->created_at->toIso8601String(),
                'slots' => $b->slots->map(fn ($s) => [
                    'court_name' => $s->court?->name,
                    'start_at' => $s->start_at->toIso8601String(),
                    'end_at' => $s->end_at->toIso8601String(),
                ]),
            ]),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Lightweight customer search for combobox/autocomplete (JSON).
     * Returns up to 8 matches by phone prefix or name.
     */
    public function search(Request $request): \Illuminate\Http\JsonResponse
    {
        $tenantId = WorkingTenant::id($request);
        $query = $request->string('q', '')->toString();

        if ($query === '') {
            return response()->json([]);
        }

        $customers = $this->customers->search($request, $query, limit: 8)
            ->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'code' => $c->code,
                'bookings_count' => $c->bookings()->where('tenant_id', $tenantId)->count(),
            ]);

        return response()->json($customers);
    }

    /**
     * Create a new customer. Phone is identity (normalized).
     */
    public function store(Request $request): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_if($tenantId === null, 403);

        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^[\d\s\-\.\(\)\+]{8,15}$/'],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
        ], [
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678).',
        ]);

        $this->customers->upsert($request, $data);

        return back()->with('success', Messages::get('customer', 'created'));
    }

    /**
     * Update customer. Phone changes are normalized; duplicates within tenant are merged.
     */
    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_unless($customer->tenant_id === $tenantId, 403);

        $data = $request->validate([
            'phone' => ['sometimes', 'required', 'string', 'regex:/^[\d\s\-\.\(\)\+]{8,15}$/'],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
        ], [
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678).',
        ]);

        $this->customers->upsert($request, $data);

        return back()->with('success', Messages::get('customer', 'updated'));
    }
}
