<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_txn_inbox', function (Blueprint $table) {
            // Historical inbox rows cannot be attributed safely; every new webhook is attributed
            // from its authenticated recipient config, never a payload tenant_id.
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('bank_txn_inbox', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });
    }
};
