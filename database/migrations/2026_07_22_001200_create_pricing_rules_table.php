<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Peak / off-peak pricing by weekday + local time window. `price_per_hour` is BIGINT integer
 * VND (never float — docs/11 #6). A court-specific rule (court_id set) and higher `priority`
 * win; the resolved price is SNAPSHOTted onto the booking so later edits don't rewrite history.
 *
 * `court_id` nullable = applies to every court. `weekday` is a jsonb array [1..7].
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('court_id')->nullable();   // null = all courts
            $table->jsonb('weekday');                     // [1..7]
            $table->time('start_local');
            $table->time('end_local');
            $table->bigInteger('price_per_hour');         // VND
            $table->integer('priority')->default(0);
            $table->timestamps();

            // Composite FK is skipped by Postgres when court_id is NULL (MATCH SIMPLE).
            $table->foreign(['tenant_id', 'court_id'])->references(['tenant_id', 'id'])->on('courts')->cascadeOnDelete();
            $table->index(['tenant_id', 'court_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
