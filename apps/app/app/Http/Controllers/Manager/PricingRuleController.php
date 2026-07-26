<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\PricingRule;
use App\Services\Catalog\PricingRuleService;
use App\Services\Tenant\VenueSettingsService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PricingRuleController extends Controller
{
    public function __construct(
        private PricingRuleService $pricingRules,
        private VenueSettingsService $venueSettings,
    ) {}

    public function index(Request $request, Court $court): Response
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $rules = $court->pricingRules()->orderByDesc('priority')->orderBy('start_local')->get();
        $tenantId = (int) WorkingTenant::id($request);

        return Inertia::render('Manager/Courts/PricingRules', [
            'court' => ['uuid' => $court->uuid, 'name' => $court->name],
            'rules' => $rules->map(fn (PricingRule $rule) => $this->ruleData($rule)),
            'venueRules' => PricingRule::query()
                ->where('tenant_id', $tenantId)
                ->whereNull('court_id')
                ->orderByDesc('priority')
                ->orderBy('start_local')
                ->get()
                ->map(fn (PricingRule $rule) => $this->ruleData($rule)),
            'defaultPricePerHour' => $this->venueSettings->defaultPricePerHour($tenantId),
        ]);
    }

    public function store(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $data = $request->validate([
            'weekday' => ['required', 'array', 'min:1', 'max:7'],
            'weekday.*' => ['integer', 'between:1,7', 'distinct'],
            'start_local' => ['required', 'date_format:H:i'],
            'end_local' => ['required', 'date_format:H:i', 'after:start_local'],
            'price_per_hour' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ]);
        $data['priority'] ??= 0;

        $this->pricingRules->create((int) WorkingTenant::id($request), $court->id, $data);

        return back()->with('success', Messages::get('pricing', 'created'));
    }

    public function update(Request $request, Court $court, PricingRule $pricingRule): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);
        abort_unless($pricingRule->court_id === $court->id, 404);

        $data = $request->validate([
            'weekday' => ['required', 'array', 'min:1', 'max:7'],
            'weekday.*' => ['integer', 'between:1,7', 'distinct'],
            'start_local' => ['required', 'date_format:H:i'],
            'end_local' => ['required', 'date_format:H:i', 'after:start_local'],
            'price_per_hour' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ]);
        $data['priority'] ??= 0;

        $this->pricingRules->update($pricingRule, $data);

        return back()->with('success', Messages::get('pricing', 'updated'));
    }

    public function destroy(Request $request, Court $court, PricingRule $pricingRule): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);
        abort_unless($pricingRule->court_id === $court->id, 404);

        $pricingRule->delete();

        return back()->with('success', Messages::get('pricing', 'deleted'));
    }

    private function assertOwnedByWorkingTenant(Request $request, Court $court): void
    {
        abort_unless($court->tenant_id === WorkingTenant::id($request), 403);
    }

    /** @return array{id:int, weekday:array<int>, start_local:string, end_local:string, price_per_hour:int, priority:int} */
    private function ruleData(PricingRule $rule): array
    {
        return [
            'id' => $rule->id,
            'weekday' => $rule->weekday,
            'start_local' => substr($rule->start_local, 0, 5),
            'end_local' => substr($rule->end_local, 0, 5),
            'price_per_hour' => $rule->price_per_hour,
            'priority' => $rule->priority,
        ];
    }
}
