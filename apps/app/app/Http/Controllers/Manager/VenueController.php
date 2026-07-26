<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Support\Messages;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Venue profile — contact info, address, geo, description, social links.
 * Branding (color/logo) stays in BrandingController.
 */
class VenueController extends Controller
{
    public function edit(Request $request): Response
    {
        $tenant = Tenant::findOrFail(WorkingTenant::id($request));

        return Inertia::render('Manager/Settings/VenueProfile', [
            'tenant' => [
                'uuid' => $tenant->uuid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'address' => $tenant->address,
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'website' => $tenant->website,
                'lat' => $tenant->lat,
                'lng' => $tenant->lng,
                'description' => $tenant->description,
                'settings' => $tenant->settings ?? [],
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $tenant = Tenant::findOrFail(WorkingTenant::id($request));

        $data = $request->validate([
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'url', 'max:500'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'description' => ['nullable', 'string', 'max:1000'],
            'social.zalo' => ['nullable', 'url', 'max:500'],
            'social.facebook' => ['nullable', 'url', 'max:500'],
            'social.instagram' => ['nullable', 'url', 'max:500'],
            'pricing.default_price_per_hour' => ['nullable', 'integer', 'min:0', 'max:1000000000'],
        ]);

        $tenant->fill([
            'address' => $data['address'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'website' => $data['website'] ?? null,
            'lat' => $data['lat'] ?? null,
            'lng' => $data['lng'] ?? null,
            'description' => $data['description'] ?? null,
        ]);

        // Merge social links into settings JSONB
        $settings = $tenant->settings ?? [];
        $settings['social'] = [
            'zalo' => $data['social']['zalo'] ?? $settings['social']['zalo'] ?? null,
            'facebook' => $data['social']['facebook'] ?? $settings['social']['facebook'] ?? null,
            'instagram' => $data['social']['instagram'] ?? $settings['social']['instagram'] ?? null,
        ];
        if (array_key_exists('pricing', $data)) {
            $settings['pricing'] = $settings['pricing'] ?? [];
            $defaultPrice = $data['pricing']['default_price_per_hour'] ?? null;
            $settings['pricing']['default_price_per_hour'] = $defaultPrice !== null ? (int) $defaultPrice : null;
        }
        $tenant->settings = $settings;

        $tenant->save();

        return back()->with('success', Messages::get('venue', 'updated'));
    }
}
