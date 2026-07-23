<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\OpeningRule;
use App\Support\WorkingTenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OpeningRuleController extends Controller
{
    public function index(Request $request, Court $court): Response
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $rules = $court->openingRules()->orderBy('weekday')->orderBy('open_local')->get();

        return Inertia::render('Manager/Courts/OpeningRules', [
            'court' => ['uuid' => $court->uuid, 'name' => $court->name],
            'rules' => $rules->map(fn (OpeningRule $r) => [
                'id' => $r->id,
                'weekday' => $r->weekday,
                'open_local' => $r->open_local,
                'close_local' => $r->close_local,
                'effective_from' => $r->effective_from?->format('Y-m-d'),
                'effective_to' => $r->effective_to?->format('Y-m-d'),
            ]),
        ]);
    }

    public function store(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $data = $request->validate([
            'weekday' => ['required', 'array'],
            'weekday.*' => ['integer', 'between:1,7'],
            'open_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'close_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $this->assertNoOverlap($request, $court, $data);

        $court->openingRules()->create([
            'tenant_id' => WorkingTenant::id($request),
            'weekday' => $data['weekday'],
            'open_local' => $data['open_local'],
            'close_local' => $data['close_local'],
            'effective_from' => $data['effective_from'],
            'effective_to' => $data['effective_to'] ?? null,
        ]);

        return back()->with('success', 'Đã thêm giờ mở cửa.');
    }

    public function update(Request $request, Court $court, OpeningRule $openingRule): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);
        abort_unless($openingRule->court_id === $court->id, 404);

        $data = $request->validate([
            'weekday' => ['required', 'array'],
            'weekday.*' => ['integer', 'between:1,7'],
            'open_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'close_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
        ]);

        $this->assertNoOverlap($request, $court, $data, $openingRule->id);

        $openingRule->update($data);

        return back()->with('success', 'Đã cập nhật giờ mở cửa.');
    }

    public function destroy(Request $request, Court $court, OpeningRule $openingRule): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);
        abort_unless($openingRule->court_id === $court->id, 404);

        $openingRule->delete();

        return back()->with('success', 'Đã xóa giờ mở cửa.');
    }

    private function assertOwnedByWorkingTenant(Request $request, Court $court): void
    {
        abort_unless($court->tenant_id === WorkingTenant::id($request), 403);
    }

    /**
     * Reject an opening rule that OVERLAPS an existing one for the same court:
     * shares a weekday AND its [open, close) time window intersects AND its
     * [effective_from, effective_to] date range intersects (null effective_to =
     * open-ended). Overlapping windows on the same weekday would emit duplicated
     * free slots in availability. Tenant-scoped; on update, the edited rule is ignored.
     *
     * @param  array{weekday: array<int>, open_local: string, close_local: string, effective_from: string, effective_to?: string|null}  $data
     */
    private function assertNoOverlap(Request $request, Court $court, array $data, ?int $ignoreId = null): void
    {
        $weekdays = array_map('intval', $data['weekday']);
        $newOpen = substr($data['open_local'], 0, 5);
        $newClose = substr($data['close_local'], 0, 5);
        $newFrom = Carbon::parse($data['effective_from'])->toDateString();
        $newTo = ! empty($data['effective_to'])
            ? Carbon::parse($data['effective_to'])->toDateString()
            : null;

        $existing = OpeningRule::query()
            ->where('tenant_id', WorkingTenant::id($request))
            ->where('court_id', $court->id)
            ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->get();

        foreach ($existing as $rule) {
            if (array_intersect($weekdays, $rule->weekday) === []) {
                continue;
            }

            $exOpen = substr($rule->open_local, 0, 5);
            $exClose = substr($rule->close_local, 0, 5);

            // No time-window overlap → cannot clash.
            if (! ($newOpen < $exClose && $exOpen < $newClose)) {
                continue;
            }

            $exFrom = $rule->effective_from?->toDateString();
            $exTo = $rule->effective_to?->toDateString();

            $datesOverlap = ($newTo === null || $exFrom === null || $exFrom <= $newTo)
                && ($exTo === null || $newFrom <= $exTo);

            if ($datesOverlap) {
                throw ValidationException::withMessages([
                    'open_local' => 'Giờ mở cửa này trùng với một khung giờ đã có (cùng sân, cùng ngày trong tuần, cùng khoảng hiệu lực).',
                ]);
            }
        }
    }
}
