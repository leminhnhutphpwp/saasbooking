<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A court — the bookable resource (resource-time-slot shape). `court_type` (badminton /
 * pickleball / …) is only a label + pricing difference, never an engine switch.
 *
 * `unique(tenant_id, id)` is the PARENT side of the composite FK `(tenant_id, court_id)`
 * used by opening_rules / pricing_rules / booking_slots so a reference can never cross tenants.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('court_type')->default('pickleball'); // cau_long | pickleball | khac
            $table->string('status')->default('active');         // active | maintenance | archived
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'id']);   // composite-FK target for tenant-owned children
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courts');
    }
};
