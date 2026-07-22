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
 * - Every other role → HARD-CLAMPED to `users.tenant_id`; any ?tenant_id / cookie is ignored
 *   (cannot be forged). No tenant assigned (null) → belongs to no venue (scoped queries return empty).
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
     * super_admin → all active; anyone else → only their own (empty if unassigned).
     */
    public static function switchable(?User $user): Collection
    {
        $active = self::activeTenants();

        if ($user && ! $user->isGlobalOperator()) {
            return $user->tenant_id
                ? $active->where('id', $user->tenant_id)->values()
                : $active->take(0)->values();
        }

        return $active;
    }

    /** Decide the venue for this request (null if none / user unassigned). */
    public static function resolve(Request $request): ?int
    {
        $user = $request->user();

        // Non-operator: hard-clamp to their venue, ignore any ?tenant_id / cookie.
        if ($user && ! $user->isGlobalOperator()) {
            return $user->tenant_id ? (int) $user->tenant_id : null;
        }

        // super_admin (platform operator): ?tenant_id → cookie → first active venue.
        $active = self::activeTenants();
        if ($active->isEmpty()) {
            return null;
        }

        $validIds = $active->pluck('id')->map(fn ($i) => (string) $i)->all();

        foreach ([$request->query('tenant_id'), $request->cookie(self::COOKIE)] as $candidate) {
            if ($candidate !== null && $candidate !== '' && in_array((string) $candidate, $validIds, true)) {
                return (int) $candidate;
            }
        }

        return (int) $active->first()->id;
    }

    /** Read the resolved venue for the current request (set by ResolveWorkingTenant middleware). */
    public static function id(Request $request): ?int
    {
        return $request->attributes->get(self::ATTR);
    }
}
