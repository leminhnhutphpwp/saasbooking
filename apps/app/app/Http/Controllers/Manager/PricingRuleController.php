<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\PricingRule;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PricingRuleController extends Controller
{
    public function index(Request $request, Court $court): Response
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $rules = $court->pricingRules()->orderByDesc('priority')->orderBy('start_local')->get();

        return Inertia::render('Manager/Courts/PricingRules', [
            'court' => ['uuid' => $court->uuid, 'name' => $court->name],
            'rules' => $rules->map(fn (PricingRule $r) => [
                'id' => $r->id,
                'weekday' => $r->weekday,
                'start_local' => $r->start_local,
                'end_local' => $r->end_local,
                'price_per_hour' => $r->price_per_hour,
                'priority' => $r->priority,
            ]),
        ]);
    }

    public function store(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $data = $request->validate([
            'weekday' => ['required', 'array'],
            'weekday.*' => ['integer', 'between:1,7'],
            'start_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'end_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'price_per_hour' => ['required', 'integer', 'min:0'],
            'priority' => ['nullable', 'integer', 'min:0'],
        ]);

        $this->assertNoOverlap($request, $court, $data);

        $court->pricingRules()->create([
            'tenant_id' => WorkingTenant::id($request),
            'weekday' => $data['weekday'],
            'start_local' => $data['start_local'],
            'end_local' => $data['end_local'],
            'price_per_hour' => $data['price_per_hour'],
            'priority' => $data['priority'] ?? 0,
        ]);

        return back()->with('success', 'Đã thêm bảng giá.');
    }

    public function update(Request $request, Court $court, PricingRule $pricingRule): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);
        abort_unless($pricingRule->court_id === $court->id, 404);

        $data = $request->validate([
            'weekday' => ['required', 'array'],
            'weekday.*' => ['integer', 'between:1,7'],
            'start_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'end_local' => ['required', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'price_per_hour' => ['required', 'integer', 'min:0'],
            'priority' => ['nullable', 'integer', 'min:0'],
        ]);

        $this->assertNoOverlap($request, $court, $data, $pricingRule->id);

        $pricingRule->update($data);

        return back()->with('success', 'Đã cập nhật bảng giá.');
    }

    public function destroy(Request $request, Court $court, PricingRule $pricingRule): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);
        abort_unless($pricingRule->court_id === $court->id, 404);

        $pricingRule->delete();

        return back()->with('success', 'Đã xóa bảng giá.');
    }

    private function assertOwnedByWorkingTenant(Request $request, Court $court): void
    {
        abort_unless($court->tenant_id === WorkingTenant::id($request), 403);
    }

    /**
     * Reject a pricing rule that OVERLAPS an existing effective rule for the same
     * court (scope): shares at least one weekday AND its [start, end) time window
     * intersects. Equal-priority overlaps make resolution ambiguous, so we forbid
     * them up front. Tenant-scoped; on update, the rule being edited is ignored.
     *
     * @param  array{weekday: array<int>, start_local: string, end_local: string}  $data
     */
    private function assertNoOverlap(Request $request, Court $court, array $data, ?int $ignoreId = null): void
    {
        $newStart = substr($data['start_local'], 0, 5);
        $newEnd = substr($data['end_local'], 0, 5);
        $weekdays = array_map('intval', $data['weekday']);

        $existing = PricingRule::query()
            ->where('tenant_id', WorkingTenant::id($request))
            ->where('court_id', $court->id)
            ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->get();

        foreach ($existing as $rule) {
            if (array_intersect($weekdays, $rule->weekday) === []) {
                continue;
            }

            $exStart = substr($rule->start_local, 0, 5);
            $exEnd = substr($rule->end_local, 0, 5);

            if ($newStart < $exEnd && $exStart < $newEnd) {
                throw ValidationException::withMessages([
                    'start_local' => 'Bảng giá này trùng khung giờ với một bảng giá đã có (cùng sân, cùng ngày trong tuần).',
                ]);
            }
        }
    }
}
