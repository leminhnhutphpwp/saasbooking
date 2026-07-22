<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `vertical` selects the inventory engine + calendar UI + pricing per tenant (docs/08 §0).
 * Phase 1 is fixed to `racket_court` (resource-time-slot); `golf` (capacity/session) is a
 * reserved door — added by config + a new driver, never by editing the core (docs/09).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('vertical')->default('racket_court')->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('vertical');
        });
    }
};
