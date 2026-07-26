<?php

namespace App\Http\Middleware;

use App\Support\WorkingTenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? array_merge(
                    $request->user()->only('id', 'name', 'email', 'tenant_id'),
                    ['roles' => $request->user()->getRoleNames()],
                ) : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // Working-tenant context shared across the Manager console.
            'workingTenants' => fn () => $request->user()
                ? WorkingTenant::switchable($request->user())->load('service:id,name')
                : [],
            'workingTenantId' => fn () => $request->attributes->get(WorkingTenant::ATTR),
        ];
    }
}
