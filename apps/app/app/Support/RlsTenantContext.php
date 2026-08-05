<?php

declare(strict_types=1);

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\DB;

final class RlsTenantContext
{
    /**
     * Run tenant work inside one transaction so SET LOCAL cannot escape into a reused connection.
     *
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public static function run(int $tenantId, Closure $callback): mixed
    {
        return DB::transaction(function () use ($tenantId, $callback): mixed {
            // An empty local value prevents an accidental session-level value from being inherited.
            DB::select("SELECT set_config('app.tenant_id', '', true)");
            DB::select("SELECT set_config('app.tenant_id', ?, true)", [(string) $tenantId]);

            return $callback();
        });
    }
}
