<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_messages', function (Blueprint $table) {
            $table->foreign(['tenant_id', 'customer_id'])
                ->references(['tenant_id', 'id'])
                ->on('customers');
            $table->foreign(['tenant_id', 'booking_id'])
                ->references(['tenant_id', 'id'])
                ->on('bookings');
        });
    }

    public function down(): void
    {
        Schema::table('notification_messages', function (Blueprint $table) {
            $table->dropForeign(['tenant_id', 'customer_id']);
            $table->dropForeign(['tenant_id', 'booking_id']);
        });
    }
};
