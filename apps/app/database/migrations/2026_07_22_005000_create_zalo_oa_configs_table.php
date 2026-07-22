<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-tenant Zalo Official Account config for ZNS. Tokens are encrypted. `templates` maps our
 * logical template keys (booking_confirmed, reminder_1day, reminder_2h) to approved ZNS template
 * ids. The real HTTP transport (M5 wire-up) reads this; until then a log transport is used.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zalo_oa_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('oa_id')->nullable();
            $table->text('access_token')->nullable();     // encrypted
            $table->text('refresh_token')->nullable();     // encrypted
            $table->timestampTz('token_expires_at')->nullable();
            $table->jsonb('templates')->nullable();        // {booking_confirmed: "...", reminder_2h: "..."}
            $table->boolean('active')->default(false);
            $table->timestamps();

            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zalo_oa_configs');
    }
};
