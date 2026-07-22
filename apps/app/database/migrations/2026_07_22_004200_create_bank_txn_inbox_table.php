<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Raw incoming bank transactions from SePay/Casso — the reconcile source of truth.
 * `unique(provider, bank_txn_id)` dedupes redelivered webhooks (docs/11 #7); a transaction
 * we can't match to a booking is kept here with a `note` for the owner's manual reconcile queue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_txn_inbox', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('bank_txn_id');
            $table->string('account_number')->nullable();
            $table->bigInteger('amount');
            $table->string('memo');
            $table->jsonb('payload')->nullable();
            $table->timestampTz('received_at')->useCurrent();
            $table->timestampTz('processed_at')->nullable();
            $table->string('note')->nullable();

            $table->unique(['provider', 'bank_txn_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_txn_inbox');
    }
};
