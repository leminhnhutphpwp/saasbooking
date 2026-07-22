<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Log of outbound notifications (Zalo ZNS / email). Also the reminder de-dup ledger:
 * `unique(booking_id, template)` guarantees each reminder type is sent at most once per booking,
 * even if the sweeper runs many times.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable();
            $table->foreignId('booking_id')->nullable();
            $table->string('channel');                 // zalo_zns | mail
            $table->string('template');                // booking_confirmed | reminder_1day | reminder_2h
            $table->string('recipient')->nullable();
            $table->jsonb('payload')->nullable();
            $table->string('status')->default('sent'); // sent | failed
            $table->timestampTz('sent_at')->nullable();
            $table->timestamps();

            $table->unique(['booking_id', 'template']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_messages');
    }
};
