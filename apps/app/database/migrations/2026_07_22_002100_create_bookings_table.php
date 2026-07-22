<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A booking = the lifecycle + money aggregate. A "hold" is `status = pending_deposit` with a
 * `hold_expires_at` — no separate holds table (docs/06). Price/deposit/cancel-policy are
 * SNAPSHOTted here so historical rows never re-read live pricing (docs/11 #1).
 *
 * `code` (SAN-XXXX) is the human-readable id used as the VietQR transfer memo (docs/11 #7).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('code');
            $table->foreignId('customer_id');
            $table->unsignedBigInteger('series_id')->nullable();   // FK added with recurring_series
            $table->string('status');                              // BookingStatus
            $table->string('channel');                             // zalo | owner_manual
            $table->timestampTz('hold_expires_at')->nullable();    // hold TTL; null once confirmed
            $table->bigInteger('total_amount');                    // VND
            $table->bigInteger('deposit_amount');                  // VND
            $table->string('payment_mode');                        // deposit | full | cash
            $table->jsonb('cancel_policy_snapshot');
            $table->timestampTz('reminded_at')->nullable();        // set by SendBookingReminders (M5)
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
            $table->unique(['tenant_id', 'id']);                   // composite-FK target for booking_slots
            $table->foreign(['tenant_id', 'customer_id'])->references(['tenant_id', 'id'])->on('customers')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index('hold_expires_at');                      // sweeper
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
