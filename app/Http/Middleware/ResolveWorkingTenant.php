<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\WorkingTenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attaches the "working tenant" (attribute workingTenantId) to every web request so
 * controllers read one line — and pagination/search/filter never carry ?tenant_id.
 * Runs before HandleInertiaRequests so the resolved id is available to share().
 */
class ResolveWorkingTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set(WorkingTenant::ATTR, WorkingTenant::resolve($request));

        return $next($request);
    }
}
