<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Refund ledger — a separate append-only record pointing at a payment; `payments.amount` is
 * never mutated (docs/11 #11). VietQR has no refund API, so refunds are `manual_bank`: the owner
 * transfers back by hand and marks it done.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->bigInteger('amount');
            $table->string('reason');                    // customer_cancel | race_lost | owner_cancel | no_show_policy
            $table->string('method')->default('manual_bank');
            $table->string('status')->default('requested');
            $table->timestampTz('requested_at')->useCurrent();
            $table->timestampTz('resolved_at')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
