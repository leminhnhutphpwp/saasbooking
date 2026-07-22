<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-tenant bank/reconcile config: the VietQR beneficiary (napas BIN + account) and the
 * SePay/Casso webhook secret (stored encrypted). The incoming account_number maps a bank
 * transaction back to its tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_bank_config', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('provider')->default('sepay');   // sepay | casso
            $table->string('bank_bin');                       // napas BIN (e.g. 970422)
            $table->string('account_number');
            $table->string('account_name');
            $table->text('webhook_secret')->nullable();       // encrypted
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['provider', 'account_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_bank_config');
    }
};
