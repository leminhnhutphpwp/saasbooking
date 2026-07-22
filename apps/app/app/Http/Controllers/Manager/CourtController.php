<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

        $courts = Court::forTenant((int) $tenantId)
            ->orderBy('name')
            ->get()
            ->map(fn (Court $c) => [
                'uuid' => $c->uuid,
                'name' => $c->name,
                'court_type' => $c->court_type->value,
                'court_type_label' => $c->court_type->label(),
                'status' => $c->status->value,
                'status_label' => $c->status->label(),
            ]);

        return Inertia::render('Manager/Courts/Index', [
            'courts' => $courts,
            'courtTypes' => collect(CourtType::cases())
                ->map(fn (CourtType $t) => ['value' => $t->value, 'label' => $t->label()])
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

        Court::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'court_type' => $data['court_type'],
            'status' => CourtStatus::Active,
        ]);

        return back()->with('success', 'Đã tạo sân mới.');
    }

    public function update(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'court_type' => ['required', Rule::enum(CourtType::class)],
            'status' => ['required', Rule::enum(CourtStatus::class)],
        ]);

        $court->update($data);

        return back()->with('success', 'Đã cập nhật sân.');
    }

    public function destroy(Request $request, Court $court): RedirectResponse
    {
        $this->assertOwnedByWorkingTenant($request, $court);

        // Soft-archive: existing bookings still reference the court (docs/11 #12).
        $court->update(['status' => CourtStatus::Archived]);

        return back()->with('success', 'Đã lưu trữ sân.');
    }

    private function assertOwnedByWorkingTenant(Request $request, Court $court): void
    {
        abort_unless($court->tenant_id === WorkingTenant::id($request), 403);
    }
}
