<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit trail for business models (written by the Auditable trait): create/update/delete
 * with actor + before/after values. `tenant_id` is nullable now and populated once
 * WorkingTenant lands in M1. Treated as append-only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id');
            $table->string('action');            // created | updated | deleted
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->timestamps();

            $table->index(['model_type', 'model_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
