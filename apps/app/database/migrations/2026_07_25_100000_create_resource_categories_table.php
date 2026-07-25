<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tenant-owned catalog labels for resource-time-slot inventory (ADR-001 §3).
 *
 * A category is catalog data, NOT a booking engine switch: every record remains on the
 * tenant's platform-owned racket_court vertical. Adding a sport within a vertical is
 * pure data — no deployment required.
 *
 * Composite FK `(tenant_id, id)` lets courts reference their category without crossing
 * venues. `code` is the stable machine identifier (e.g. 'pickleball'); `slug` is the
 * URL-safe variant. Both are tenant-scoped unique.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resource_categories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('code');                          // stable machine id: 'pickleball', 'cau_long'
            $table->string('slug');                          // URL-safe variant of code
            $table->string('label');                         // Vietnamese display name: 'Pickleball', 'Cầu lông'
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->jsonb('metadata')->nullable();           // bounded: icon, color, default_court_count
            $table->timestamps();
            $table->softDeletes();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->unique(['tenant_id', 'id']);             // composite FK target for courts
            $table->unique(['tenant_id', 'code']);            // stable id scoped to tenant
            $table->unique(['tenant_id', 'slug']);            // URL-safe id scoped to tenant
            $table->index(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_categories');
    }
};
