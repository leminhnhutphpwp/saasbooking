<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A weekly fixed booking (đặt cố định) — the #1 revenue for courts. Price/deposit are
 * SNAPSHOTted here at creation. Occurrences are materialised as normal bookings + booking_slots
 * (one anti-overlap path), generated on a rolling horizon (docs/07, docs/11 #5). `generated_through`
 * is the cursor of the last date generated.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_series', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('customer_id');
            $table->foreignId('court_id');
            $table->integer('weekday');                    // single ISO weekday 1..7
            $table->time('start_local');
            $table->time('end_local');
            $table->string('tz')->default('Asia/Ho_Chi_Minh');
            $table->date('start_date');
            $table->date('end_date');                      // finite — never infinite (docs/11 #5)
            $table->bigInteger('price_per_session_snapshot');
            $table->bigInteger('deposit_per_session');
            $table->date('generated_through')->nullable(); // rolling-horizon cursor
            $table->string('status')->default('active');   // active | ended | cancelled
            $table->timestamps();

            $table->unique(['tenant_id', 'id']);
            $table->foreign(['tenant_id', 'customer_id'])->references(['tenant_id', 'id'])->on('customers')->cascadeOnDelete();
            $table->foreign(['tenant_id', 'court_id'])->references(['tenant_id', 'id'])->on('courts');
            $table->index(['tenant_id', 'status']);
        });

        // Late-bind the composite FK from bookings.series_id now that recurring_series exists.
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreign(['tenant_id', 'series_id'])->references(['tenant_id', 'id'])->on('recurring_series')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['tenant_id', 'series_id']);
        });
        Schema::dropIfExists('recurring_series');
    }
};
