<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Venue readiness tracking: `is_ready` is a cached boolean (true = venue can accept real
 * bookings + VietQR deposits). `readiness_checked_at` records when the VenueReadinessService
 * last evaluated blockers. Both are denormalized onto `tenants` because readiness is a
 * single-tenant concept and avoids an extra join for every dashboard render.
 *
 * The authoritative readiness state is always computed by `VenueReadinessService::check()`;
 * the cached columns are a read-optimized snapshot for fast dashboard gating.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->boolean('is_ready')->default(false)->after('settings');
            $table->timestampTz('readiness_checked_at')->nullable()->after('is_ready');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['is_ready', 'readiness_checked_at']);
        });
    }
};
