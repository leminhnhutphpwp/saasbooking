<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\OpeningRule;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
}
