<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Holiday / maintenance blocks that remove a window from availability. `court_id` nullable =
 * the whole venue is closed. Stored as [starts_at, ends_at) timestamptz; availability
 * subtracts these on read (docs/07).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blackouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('court_id')->nullable();   // null = whole venue
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign(['tenant_id', 'court_id'])->references(['tenant_id', 'id'])->on('courts')->cascadeOnDelete();
            $table->index(['tenant_id', 'court_id', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blackouts');
    }
};
