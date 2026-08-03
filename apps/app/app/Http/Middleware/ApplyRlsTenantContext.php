<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\RlsTenantContext;
use App\Support\WorkingTenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplyRlsTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = WorkingTenant::id($request);

        // Public booking routes are bound by Laravel from the server-side slug, not request input.
        // They have no authenticated WorkingTenant but still require the same database boundary.
        $routeTenant = $request->route('tenant');
        if (! $tenantId && $routeTenant instanceof Tenant) {
            $tenantId = $routeTenant->id;
        }

        if (! $tenantId) {
            return $next($request);
        }

        return RlsTenantContext::run($tenantId, fn (): Response => $next($request));
    }
}
