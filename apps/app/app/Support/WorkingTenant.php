<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * "Working tenant" (venue context) — the SINGLE source of truth for which venue a request
 * belongs to. Ported from appdhv's WorkingSchool.
 *
 * HARD per-user isolation:
 * - super_admin = platform operator → may switch venues freely
 *   (?tenant_id deep-link → cookie → first active venue).
 * - Every other role → may select only an active venue present in `memberships`; `users.tenant_id`
 *   remains the primary/fallback venue during migration. Forged candidates are ignored.
 *
 * This is the server-side security boundary: controllers trust only `WorkingTenant::id()`,
 * NEVER the payload.
 */
final class WorkingTenant
{
    public const COOKIE = 'san_working_tenant';

    public const ATTR = 'workingTenantId';

    /** Active venues (id, uuid, slug, name) — for the switcher + validation. */
    public static function activeTenants(): Collection
    {
        return Tenant::active()->orderBy('name')->get(['id', 'uuid', 'slug', 'name']);
    }

    /**
     * Venues the user may work in / switch between (source for the switcher).
     * super_admin → all active; anyone else → active membership venues plus legacy primary venue.
     */
    public static function switchable(?User $user): Collection
    {
        if (! $user) {
            return collect();
        }

        if ($user->isGlobalOperator()) {
            return self::activeTenants();
        }

        $tenantIds = $user->tenants()->pluck('tenants.id');
        if ($user->tenant_id) {
            $tenantIds->push((int) $user->tenant_id);
        }

        return Tenant::active()
            ->whereIn('id', $tenantIds->unique())
            ->orderBy('name')
            ->get(['id', 'uuid', 'slug', 'name', 'service_id']);
    }

    /** Decide the venue for this request (null if none / user unassigned). */
    public static function resolve(Request $request): ?int
    {
        $user = $request->user();

        $active = self::switchable($user);
        if ($active->isEmpty()) {
            return null;
        }

        $validIds = $active->pluck('id')->map(fn ($i) => (string) $i)->all();

        foreach ([$request->query('tenant_id'), $request->cookie(self::COOKIE)] as $candidate) {
            if ($candidate !== null && $candidate !== '' && in_array((string) $candidate, $validIds, true)) {
                return (int) $candidate;
            }
        }

        if ($user && ! $user->isGlobalOperator() && $user->tenant_id && $active->contains('id', (int) $user->tenant_id)) {
            return (int) $user->tenant_id;
        }

        return (int) $active->first()->id;
    }

    /** Read the resolved venue for the current request (set by ResolveWorkingTenant middleware). */
    public static function id(Request $request): ?int
    {
        return $request->attributes->get(self::ATTR);
    }
}
