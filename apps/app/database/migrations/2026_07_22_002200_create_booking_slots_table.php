<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * THE HEART. One court cannot be held by two bookings for overlapping time — enforced by a
 * Postgres EXCLUDE constraint, NOT a check-then-act in PHP (docs/11 #2). One-off bookings AND
 * recurring-series occurrences both become booking_slots, so there is a single anti-overlap path.
 *
 * The predicate `hold_status IN (holding, committed)` means a released/expired slot frees its
 * range for someone else.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('booking_id');
            $table->foreignId('court_id');
            $table->timestampTz('start_at');
            $table->timestampTz('end_at');
            $table->bigInteger('price_snapshot');                  // VND, snapshot at hold time
            $table->string('hold_status');                         // holding | committed | released
            $table->timestamps();

            $table->foreign(['tenant_id', 'booking_id'])->references(['tenant_id', 'id'])->on('bookings')->cascadeOnDelete();
            $table->foreign(['tenant_id', 'court_id'])->references(['tenant_id', 'id'])->on('courts');
            $table->index(['tenant_id', 'court_id', 'start_at']);
        });

        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');
        DB::statement(<<<'SQL'
            ALTER TABLE booking_slots ADD CONSTRAINT no_double_book
            EXCLUDE USING gist (
                tenant_id WITH =,
                court_id WITH =,
                tstzrange(start_at, end_at) WITH &&
            ) WHERE (hold_status IN ('holding','committed'))
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE booking_slots DROP CONSTRAINT IF EXISTS no_double_book');
        Schema::dropIfExists('booking_slots');
    }
};
