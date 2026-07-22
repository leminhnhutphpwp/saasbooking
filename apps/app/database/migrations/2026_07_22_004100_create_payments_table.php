<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A deposit payment for a booking. `memo_ref` = booking.code is the VietQR transfer memo used
 * to match an incoming bank transaction (docs/11 #7). `unique(bank_txn_id)` makes reconcile
 * idempotent — a duplicated webhook cannot confirm twice. `amount` is immutable; refunds are a
 * separate ledger (docs/11 #11).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('booking_id');
            $table->string('method');                       // vietqr | cash
            $table->bigInteger('amount');                    // VND
            $table->string('status');                        // awaiting | matched | orphaned
            $table->string('memo_ref');                      // = booking.code
            $table->string('bank_txn_id')->nullable();
            $table->timestampTz('matched_at')->nullable();
            $table->jsonb('raw_payload')->nullable();
            $table->timestamps();

            $table->unique('bank_txn_id');                   // idempotency
            $table->unique(['tenant_id', 'booking_id', 'method']);   // one deposit per booking per method
            $table->foreign(['tenant_id', 'booking_id'])->references(['tenant_id', 'id'])->on('bookings')->cascadeOnDelete();
            $table->index(['tenant_id', 'memo_ref']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
