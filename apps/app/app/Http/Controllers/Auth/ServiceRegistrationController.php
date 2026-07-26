<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PlatformService;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ServiceRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/RegisterService', [
            'services' => PlatformService::active()
                ->orderBy('display_order')
                ->get(['uuid', 'name', 'slug', 'description', 'icon', 'pricing_model', 'max_resources', 'features', 'trial_days']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service' => [
                'required',
                'uuid',
                Rule::exists('platform_services', 'uuid')->where(fn ($query) => $query
                    ->where('status', 'active')
                    ->whereNull('deleted_at')),
            ],
            'venue_name' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $service = PlatformService::active()->where('uuid', $validated['service'])->firstOrFail();
        $user = $request->user();

        $tenant = DB::transaction(function () use ($service, $user, $validated): Tenant {
            $tenant = Tenant::create([
                'service_id' => $service->id,
                'name' => $validated['venue_name'],
                'slug' => Str::slug($validated['venue_name']).'-'.Str::lower(Str::random(6)),
                'vertical' => $service->vertical_key,
                'timezone' => 'Asia/Ho_Chi_Minh',
                'status' => 'active',
                'settings' => [
                    'subscription' => [
                        'pricing_model' => $service->pricing_model,
                        'trial_ends_at' => $service->trial_days > 0 ? now()->addDays($service->trial_days)->toIso8601String() : null,
                    ],
                ],
            ]);

            $user->tenants()->attach($tenant->id, ['role' => 'owner']);
            if (! $user->tenant_id) {
                $user->forceFill(['tenant_id' => $tenant->id])->save();
            }
            if (! $user->hasRole('owner')) {
                $user->assignRole('owner');
            }

            return $tenant;
        });

        return redirect()->route('manager.home')
            ->withCookie(cookie()->forever('san_working_tenant', (string) $tenant->id))
            ->with('success', "Đã mở dịch vụ {$service->name} cho {$tenant->name}.");
    }
}
