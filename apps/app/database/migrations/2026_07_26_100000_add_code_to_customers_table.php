<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add human-readable `code` column to customers (per-tenant sequential, e.g. KH0001).
 * Nullable initially — a separate Artisan command backfills existing rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->after('id');
        });

        // Composite unique: code must be unique within a tenant
        Schema::table('customers', function (Blueprint $table) {
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'code']);
            $table->dropColumn('code');
        });
    }
};
