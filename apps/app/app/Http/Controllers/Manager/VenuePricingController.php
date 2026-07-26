<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use App\Services\Catalog\PricingRuleService;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VenuePricingController extends Controller
{
    public function __construct(private PricingRuleService $pricingRules) {}

    public function store(Request $request): RedirectResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        $data = $this->validated($request);
        $this->pricingRules->create($tenantId, null, $data);

        return back()->with('success', Messages::get('pricing', 'created'));
    }

    public function update(Request $request, PricingRule $pricingRule): RedirectResponse
    {
        $tenantId = (int) WorkingTenant::id($request);
        $this->assertVenueRule($pricingRule, $tenantId);
        $data = $this->validated($request);
        $this->pricingRules->update($pricingRule, $data);

        return back()->with('success', Messages::get('pricing', 'updated'));
    }

    public function destroy(Request $request, PricingRule $pricingRule): RedirectResponse
    {
        $this->assertVenueRule($pricingRule, (int) WorkingTenant::id($request));
        $pricingRule->delete();

        return back()->with('success', Messages::get('pricing', 'deleted'));
    }

    /** @return array{weekday:array<int>, start_local:string, end_local:string, price_per_hour:int, priority:int|null} */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'weekday' => ['required', 'array', 'min:1', 'max:7'],
            'weekday.*' => ['integer', 'between:1,7', 'distinct'],
            'start_local' => ['required', 'date_format:H:i'],
            'end_local' => ['required', 'date_format:H:i', 'after:start_local'],
            'price_per_hour' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:1000000'],
        ]);
        $data['priority'] ??= 0;

        return $data;
    }

    private function assertVenueRule(PricingRule $pricingRule, int $tenantId): void
    {
        abort_unless($pricingRule->tenant_id === $tenantId && $pricingRule->court_id === null, 404);
    }
}
