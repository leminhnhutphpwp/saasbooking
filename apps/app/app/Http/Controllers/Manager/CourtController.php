<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manage courts for the working tenant. Every query is scoped by WorkingTenant::id — the
 * route-model-bound court is re-checked against the tenant (route binding is global by uuid).
 */
class CourtController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = WorkingTenant::id($request);

        abort_if($tenantId === null, 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', Rule::enum(CourtType::class)],
            'status' => ['nullable', Rule::enum(CourtStatus::class)],
        ]);

        $search = trim($filters['search'] ?? '');
        $escapedSearch = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);

        $courts = Court::forTenant((int) $tenantId)
            ->when($search !== '', fn ($query) => $query->where('name', 'ILIKE', "%{$escapedSearch}%"))
            ->when(isset($filters['type']), fn ($query) => $query->where('court_type', $filters['type']))
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Court $court) => [
                'uuid' => $court->uuid,
                'name' => $court->name,
                'court_type' => $court->court_type->value,
                'court_type_label' => $court->court_type->label(),
                'status' => $court->status->value,
                'status_label' => $court->status->label(),
            ]);

        return Inertia::render('Manager/Courts/Index', [
            'courts' => $courts,
            'filters' => [
                'search' => $search,
                'type' => $filters['type'] ?? null,
                'status' => $filters['status'] ?? null,
            ],
            'courtTypes' => collect(CourtType::cases())
                ->map(fn (CourtType $type) => ['value' => $type->value, 'label' => $type->label()])
                ->values(),
            'courtStatuses' => collect(CourtStatus::cases())
                ->map(fn (CourtStatus $status) => ['value' => $status->value, 'label' => $status->label()])
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_if($tenantId === null, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'court_type' => ['required', Rule::enum(CourtType::class)],
        ]);

        Court::forceCreate([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'court_type' => $data['court_type'],
            'status' => CourtStatus::Active,
        ]);

        return back()->with('success', Messages::get('court', 'created'));
    }

    public function update(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'court_type' => ['required', Rule::enum(CourtType::class)],
            'status' => ['required', Rule::enum(CourtStatus::class)],
        ]);

        // $data is validated (name/court_type/status enum) but status isn't mass-assignable → forceFill.
        $court->forceFill($data)->save();

        return back()->with('success', Messages::get('court', 'updated'));
    }

    public function updateStatus(Request $request): RedirectResponse
    {
        $tenantId = WorkingTenant::id($request);
        abort_if($tenantId === null, 403);

        $data = $request->validate([
            'court_uuids' => ['required', 'array', 'min:1', 'max:100'],
            'court_uuids.*' => ['required', 'uuid', 'distinct'],
            'status' => ['required', Rule::enum(CourtStatus::class)],
        ]);

        DB::transaction(function () use ($data, $tenantId): void {
            $courtIds = Court::forTenant((int) $tenantId)
                ->whereIn('uuid', $data['court_uuids'])
                ->lockForUpdate()
                ->pluck('id');

            if ($courtIds->count() !== count($data['court_uuids'])) {
                throw ValidationException::withMessages([
                    'court_uuids' => Messages::get('court', 'not_found'),
                ]);
            }

            Court::forTenant((int) $tenantId)
                ->whereIn('id', $courtIds)
                ->update(['status' => $data['status']]);
        });

        return back()->with('success', Messages::get('court', 'status_updated'));
    }

    public function destroy(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        // Soft-archive: existing bookings still reference the court (docs/11 #12).
        $court->forceFill(['status' => CourtStatus::Archived])->save();

        return back()->with('success', Messages::get('court', 'archived'));
    }

    public function config(Request $request): Response
    {
        $tenantId = WorkingTenant::id($request);

        $courts = Court::forTenant((int) $tenantId)
            ->where('status', CourtStatus::Active)
            ->with(['openingRules', 'pricingRules'])
            ->orderBy('name')
            ->get()
            ->map(fn (Court $c) => [
                'uuid' => $c->uuid,
                'name' => $c->name,
                'court_type_label' => $c->court_type->label(),
                'opening_rules_count' => $c->openingRules->count(),
                'pricing_rules_count' => $c->pricingRules->count(),
            ]);

        return Inertia::render('Manager/Courts/Config', [
            'courts' => $courts,
        ]);
    }

    private function assertOwnedByWorkingTenant(Request $request, Court $court): void
    {
        abort_unless($court->tenant_id === WorkingTenant::id($request), 403);
    }
}
