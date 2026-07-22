<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\CourtStatus;
use App\Enums\SeriesStatus;
use App\Exceptions\SlotTakenException;
use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\Customer;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Services\Booking\SeriesService;
use App\Support\WorkingTenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeriesController extends Controller
{
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

        $data['payment_mode'] = 'full';

        try {
            $result = app(SeriesService::class)->create($tenant, $data);
        } catch (SlotTakenException) {
            return back()->with('error', 'Khung giờ đầu tiên đã có người đặt.');
        }

        $message = 'Đã tạo đặt cố định.';
        if (! empty($result->conflicts)) {
            $message .= ' Có '.count($result->conflicts).' ngày bị trùng, đã bỏ qua.';
        }

        return Redirect::back()->with('success', $message);
    }

    public function destroy(Request $request, RecurringSeries $series): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $series);
        $series->update(['status' => SeriesStatus::Cancelled]);

        return Redirect::back()->with('success', 'Đã hủy đặt cố định.');
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
