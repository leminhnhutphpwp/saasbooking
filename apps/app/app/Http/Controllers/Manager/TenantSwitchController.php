<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Support\WorkingTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TenantSwitchController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate(['tenant_id' => ['required', 'integer']]);
        $tenant = WorkingTenant::switchable($request->user())->firstWhere('id', (int) $validated['tenant_id']);
        abort_unless($tenant, 404);

        return redirect()->route('manager.home')
            ->withCookie(cookie()->forever(WorkingTenant::COOKIE, (string) $tenant->id));
    }
}
