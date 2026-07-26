<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\BookingStatus;
use App\Enums\CancelReason;
use App\Enums\CourtStatus;
use App\Enums\SeriesStatus;
use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use App\Services\Booking\SeriesService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SeriesController extends Controller
{
    public function __construct(
        private SeriesService $series,
        private BookingService $bookings,
    ) {}

    public function index(Request $request): Response
    {
        $tenantId = WorkingTenant::id($request);

        $seriesList = RecurringSeries::with(['customer', 'court', 'bookings'])
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (RecurringSeries $s) => [
                'uuid' => $s->uuid,
                'customer_name' => $s->customer?->name ?? '—',
                'customer_phone' => $s->customer?->phone ?? '',
                'court_name' => $s->court?->name ?? '—',
                'weekday' => $s->weekday,
                'start_local' => $s->start_local,
                'end_local' => $s->end_local,
                'start_date' => $s->start_date->format('Y-m-d'),
                'end_date' => $s->end_date->format('Y-m-d'),
                'generated_through' => $s->generated_through?->format('Y-m-d'),
                'price_per_session_snapshot' => $s->price_per_session_snapshot,
                'deposit_per_session' => $s->deposit_per_session,
                'status' => $s->status->value,
                'bookings_count' => $s->bookings->count(),
                'sessions_total' => $this->countWeekdaysBetween(
                    $s->weekday, $s->start_date, $s->end_date
                ),
            ]);

        $customers = Customer::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        $courts = Court::forTenant($tenantId)
            ->where('status', CourtStatus::Active)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Manager/Series/Index', [
            'series' => $seriesList,
            'customers' => $customers,
            'courts' => $courts,
            'weekdays' => [
                ['value' => 1, 'label' => 'Thứ Hai'],
                ['value' => 2, 'label' => 'Thứ Ba'],
                ['value' => 3, 'label' => 'Thứ Tư'],
                ['value' => 4, 'label' => 'Thứ Năm'],
                ['value' => 5, 'label' => 'Thứ Sáu'],
                ['value' => 6, 'label' => 'Thứ Bảy'],
                ['value' => 7, 'label' => 'Chủ Nhật'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_if($tenantId === null, 403);

        $tenant = Tenant::findOrFail($tenantId);

        $data = $request->validate([
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'court_id' => ['required', 'integer', Rule::exists('courts', 'id')->where('tenant_id', $tenantId)],
            'weekday' => ['required', 'integer', 'between:1,7'],
            'start_local' => ['required', 'date_format:H:i'],
            'end_local' => ['required', 'date_format:H:i', 'after:start_local'],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date'],
            'deposit_per_session' => ['nullable', 'integer', 'min:0'],
        ]);

        // Guard against a date range that contains NO occurrence of the chosen
        // weekday (e.g. a 1-day window on the wrong day). Without this, the series
        // has zero sessions and pricing later resolves for a weekday/time with no
        // rule → RuntimeException → 500. Reject up front with a clear message.
        $start = Carbon::createFromFormat('Y-m-d', $data['start_date'])->startOfDay();
        $end = Carbon::createFromFormat('Y-m-d', $data['end_date'])->startOfDay();

        if ($this->countWeekdaysBetween((int) $data['weekday'], $start, $end) === 0) {
            throw ValidationException::withMessages([
                'end_date' => Messages::get('series', 'date_range_invalid'),
            ]);
        }

        $data['payment_mode'] = 'full';

        try {
            $result = $this->series->create($tenant, $data);
        } catch (SlotTakenException) {
            return back()->with('error', Messages::get('series', 'first_slot_taken'));
        }

        $message = Messages::get('series', 'created');
        if (! empty($result->conflicts)) {
            $message .= Messages::get('series', 'conflicts', ['count' => count($result->conflicts)]);
        }

        return Redirect::back()->with('success', $message);
    }

    public function destroy(Request $request, RecurringSeries $series): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $series);
        $series->forceFill(['status' => SeriesStatus::Cancelled])->save();

        return Redirect::back()->with('success', Messages::get('series', 'cancelled'));
    }

    /**
     * Cancel one occurrence of a recurring series without stopping the parent.
     * The series remains active; only the selected booking is cancelled.
     */
    public function cancelOccurrence(Request $request, RecurringSeries $series, Booking $booking): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_if($tenantId === null, 403);
        $this->assertOwnedByWorkingTenant($request, $series);
        abort_unless($booking->tenant_id === $tenantId, 403);
        abort_unless($booking->series_id !== null, 422);
        abort_unless($booking->series_id === $series->id, 422);
        abort_unless($series->status === SeriesStatus::Active, 422);

        // Only pending_deposit or confirmed occurrences can be cancelled.
        if (! in_array($booking->status, [BookingStatus::PendingDeposit, BookingStatus::Confirmed], true)) {
            return back()->with('error', Messages::get('series', 'occurrence_ended'));
        }

        $this->series->cancelOccurrence($booking);

        return back()->with('success', Messages::get('series', 'occurrence_cancelled'));
    }

    /**
     * End remaining occurrences of a series. Future ungenerated bookings are stopped;
     * already-generated confirmed bookings are left as-is.
     */
    public function endSeries(Request $request, RecurringSeries $series): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_if($tenantId === null, 403);
        $this->assertOwnedByWorkingTenant($request, $series);

        if ($series->status !== SeriesStatus::Active) {
            return back()->with('error', Messages::get('series', 'not_active'));
        }

        // Set end_date to today (or yesterday) so no future occurrences are generated.
        // Cancel all pending_deposit future occurrences in this series.
        $series->forceFill([
            'status' => SeriesStatus::Ended,
            'end_date' => now()->subDay()->toDateString(),
        ])->save();

        // Cancel any pending_deposit bookings in this series that haven't happened yet.
        $pendingBookings = Booking::where('tenant_id', $tenantId)
            ->where('series_id', $series->id)
            ->where('status', BookingStatus::PendingDeposit)
            ->get();

        foreach ($pendingBookings as $pending) {
            $this->bookings->cancel($pending, CancelReason::OwnerCancel);
        }

        return back()->with('success', Messages::get('series', 'ended'));
    }

    private function countWeekdaysBetween(int $weekday, Carbon $start, Carbon $end): int
    {
        $count = 0;
        $cursor = $start->copy();
        while ($cursor->lessThanOrEqualTo($end)) {
            if ($cursor->dayOfWeekIso === $weekday) {
                $count++;
            }
            $cursor->addDay();
        }

        return $count;
    }

    private function assertOwnedByWorkingTenant(Request $request, RecurringSeries $series): void
    {
        abort_unless($series->tenant_id === WorkingTenant::id($request), 403);
    }
}
