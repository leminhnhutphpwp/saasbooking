<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Opening hours per court, by weekday, in LOCAL time + tz (never UTC — docs/11 #3), and
 * versioned in time (effective_from/to). Changing hours = close the old rule, open a new one;
 * existing bookings are unaffected (docs/11 #4). Availability is computed on read.
 *
 * `weekday` is a jsonb array of ISO weekdays [1..7].
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opening_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('court_id');
            $table->jsonb('weekday');                 // [1..7]
            $table->time('open_local');
            $table->time('close_local');
            $table->string('tz')->default('Asia/Ho_Chi_Minh');
            $table->date('effective_from');
            $table->date('effective_to')->nullable(); // null = open-ended
            $table->timestamps();

            $table->foreign(['tenant_id', 'court_id'])->references(['tenant_id', 'id'])->on('courts')->cascadeOnDelete();
            $table->index(['tenant_id', 'court_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opening_rules');
    }
};
