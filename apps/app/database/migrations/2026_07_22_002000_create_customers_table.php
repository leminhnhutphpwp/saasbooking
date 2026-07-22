<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * End customers (players). Unique per tenant by phone. `unique(tenant_id, id)` is the parent
 * side of the composite FK used by bookings.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('phone');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'phone']);
            $table->unique(['tenant_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
