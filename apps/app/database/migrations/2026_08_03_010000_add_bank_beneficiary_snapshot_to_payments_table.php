<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Recipient data is immutable with the deposit obligation. Do not copy webhook secrets.
            $table->unsignedBigInteger('recipient_bank_config_id')->nullable()->after('memo_ref');
            $table->string('recipient_provider')->nullable()->after('recipient_bank_config_id');
            $table->string('recipient_bank_bin')->nullable()->after('recipient_provider');
            $table->string('recipient_account_number')->nullable()->after('recipient_bank_bin');
            $table->string('recipient_account_name')->nullable()->after('recipient_account_number');
            $table->index(['recipient_provider', 'recipient_account_number', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['recipient_provider', 'recipient_account_number', 'status']);
            $table->dropColumn([
                'recipient_bank_config_id',
                'recipient_provider',
                'recipient_bank_bin',
                'recipient_account_number',
                'recipient_account_name',
            ]);
        });
    }
};
