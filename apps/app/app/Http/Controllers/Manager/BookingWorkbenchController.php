<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\PaymentMethod;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Manager\StoreWalkInBookingRequest;
use App\Http\Requests\Manager\UpdateBookingStatusRequest;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Services\Booking\BookingService;
use App\Support\WorkingTenant;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Booking operations workbench — the owner/receptionist daily tool.
 * Every query scoped by WorkingTenant::id($request). Walk-in bookings go through
 * BookingService (the ONLY concurrency chokepoint). No direct slot insert.
 */
class BookingWorkbenchController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    /**
     * Paginated booking list with filters:
     *   ?date_from / ?date_to — filter by slot start_at range
     *   ?court_id — filter by court
     *   ?status — filter by booking status
     *   ?search — code, customer name, or phone
     *   ?page / ?per_page
     */
    public function index(Request $request): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        abort_unless($tenantId, 403);

        $query = Booking::query()
            ->where('tenant_id', $tenantId)
            ->with(['customer', 'slots.court', 'payments']);

        // Filter by date range (on slot start_at)
        if ($request->filled('date_from')) {
            $from = CarbonImmutable::parse((string) $request->string('date_from'));
            $query->whereHas('slots', fn ($q) => $q->where('start_at', '>=', $from));
        }
        if ($request->filled('date_to')) {
            $to = CarbonImmutable::parse((string) $request->string('date_to'))->addDay();
            $query->whereHas('slots', fn ($q) => $q->where('start_at', '<', $to));
        }

        // Filter by court
        if ($request->filled('court_id')) {
            $query->whereHas('slots', fn ($q) => $q->where('court_id', $request->input('court_id')));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Search by code, customer name, or phone
        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'ilike', "%{$search}%")
                            ->orWhere('phone', 'ilike', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        return Inertia::render('Manager/Bookings/Index', [
            'bookings' => $paginator->withQueryString(),
            'courts' => Court::forTenant($tenantId)->where('status', 'active')->orderBy('name')
                ->get(['id', 'name']),
            'filters' => $request->only(['date_from', 'date_to', 'court_id', 'status', 'search']),
        ]);
    }

    /**
     * Single booking detail: customer info, slots, payments.
     * UUID route binding via Booking::getRouteKeyName() → 'uuid'.
     */
    public function show(Request $request, Booking $booking): Response
    {
        $tenantId = (int) WorkingTenant::id($request);
        abort_unless($tenantId, 403);
        abort_unless($booking->tenant_id === $tenantId, 403);

        $booking->load(['customer', 'slots.court', 'payments.refunds']);

        return Inertia::render('Manager/Bookings/Show', [
            'booking' => $booking,
        ]);
    }

    /**
     * Staff-assisted / walk-in booking. Goes through BookingService::createHold
     * (the ONLY concurrency chokepoint). Cash walk-ins are confirmed immediately.
     */
    public function store(StoreWalkInBookingRequest $request): RedirectResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        abort_unless($tenantId, 403);

        $tenant = $request->user()->tenant()->firstOrFail();
        abort_unless($tenant->id === $tenantId, 403);

        $data = $request->validated();
        $paymentMode = $data['payment_mode'] ?? PaymentMode::Cash->value;

        // Find or create customer by phone (tenant-scoped)
        $customer = Customer::firstOrCreate(
            ['tenant_id' => $tenantId, 'phone' => $data['phone']],
            ['name' => $data['name']],
        );

        try {
            $booking = $this->bookings->createHold($tenant, [
                'customer_id' => $customer->id,
                'channel' => BookingChannel::OwnerManual->value,
                'payment_mode' => $paymentMode,
                'slots' => [[
                    'court_id' => $data['court_id'],
                    'start_at' => CarbonImmutable::parse($data['start_at']),
                    'end_at' => CarbonImmutable::parse($data['end_at']),
                ]],
            ]);
        } catch (SlotTakenException $e) {
            return back()->with('error', $e->getMessage());
        }

        // Cash walk-in is settled on the spot → confirm immediately (no VietQR).
        if ($paymentMode === PaymentMode::Cash->value) {
            Payment::forceCreate([
                'tenant_id' => $tenantId,
                'booking_id' => $booking->id,
                'method' => PaymentMethod::Cash,
                'amount' => $booking->total_amount,
                'status' => PaymentStatus::Matched,
                'memo_ref' => $booking->code,
                'matched_at' => now(),
            ]);
            $this->bookings->confirmDeposit($booking);
        }

        return redirect()->route('manager.bookings.show', $booking)
            ->with('success', "Đã đặt sân cho {$customer->name} ({$booking->code}).");
    }

    /**
     * Lifecycle actions: check-in, complete, no-show, cancel.
     * Validates the transition against the BookingStatus enum state machine.
     */
    public function updateStatus(UpdateBookingStatusRequest $request, Booking $booking): RedirectResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        abort_unless($tenantId, 403);
        abort_unless($booking->tenant_id === $tenantId, 403);

        $action = $request->input('action');
        $currentStatus = $booking->status;

        // State machine: define valid transitions.
        $validTransitions = [
            BookingStatus::PendingDeposit->value => ['check_in', 'cancel'],
            BookingStatus::Confirmed->value => ['check_in', 'complete', 'no_show', 'cancel'],
        ];

        if (! isset($validTransitions[$currentStatus->value][$action])) {
            return back()->with('error', "Không thể thực hiện \"{$action}\" từ trạng thái \"{$currentStatus->value}\".");
        }

        match ($action) {
            'check_in' => $this->checkIn($booking),
            'complete' => $this->complete($booking),
            'no_show' => $this->markNoShow($booking),
            'cancel' => $this->cancel($booking, $request->input('reason')),
        };

        return back()->with('success', 'Đã cập nhật trạng thái đặt sân.');
    }

    private function checkIn(Booking $booking): void
    {
        // Check-in = confirm deposit if still pending, then keep as confirmed.
        if ($booking->status === BookingStatus::PendingDeposit) {
            // Pending deposits can be checked in if paid cash on arrival.
            $existingPayment = $booking->payments()
                ->where('status', PaymentStatus::Matched)
                ->exists();

            if (! $existingPayment) {
                // Record a cash payment and confirm.
                Payment::forceCreate([
                    'tenant_id' => $booking->tenant_id,
                    'booking_id' => $booking->id,
                    'method' => PaymentMethod::Cash,
                    'amount' => $booking->total_amount,
                    'status' => PaymentStatus::Matched,
                    'memo_ref' => $booking->code,
                    'matched_at' => now(),
                ]);
            }
            $this->bookings->confirmDeposit($booking);
        }
        // Confirmed bookings stay confirmed — check-in is just an acknowledgment.
    }

    private function complete(Booking $booking): void
    {
        $booking->forceFill(['status' => BookingStatus::Completed])->save();
    }

    private function markNoShow(Booking $booking): void
    {
        $this->bookings->markNoShow($booking);
    }

    private function cancel(Booking $booking, ?string $reason): void
    {
        $cancelReason = $reason
            ? CancelReason::OwnerCancel
            : CancelReason::OwnerCancel;

        $this->bookings->cancel($booking, $cancelReason);
    }
}
