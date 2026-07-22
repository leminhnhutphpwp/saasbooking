<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandingController extends Controller
{
    public function edit(Request $request): Response
    {
        $tenant = Tenant::findOrFail(WorkingTenant::id($request));

        return Inertia::render('Manager/Settings/Branding', [
            'settings' => $tenant->settings ?? [],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $tenant = Tenant::findOrFail(WorkingTenant::id($request));

        $request->validate([
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'remove_logo' => ['nullable', 'boolean'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg', 'max:2048'],
        ]);

        $settings = $tenant->settings ?? [];

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->storePublicly('tenants/'.$tenant->uuid, 'public');
            $settings['logo_url'] = Storage::disk('public')->url($path);
        }

        if ($request->boolean('remove_logo')) {
            $settings['logo_url'] = null;
        }

        if ($request->filled('primary_color')) {
            $settings['primary_color'] = $request->input('primary_color');
        }

        $tenant->settings = $settings;
        $tenant->save();

        return back()->with('success', 'Đã cập nhật thương hiệu.');
    }
}
