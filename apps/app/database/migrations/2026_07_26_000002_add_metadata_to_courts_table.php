<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add court metadata: description, surface type, display order, amenities/photos via JSONB.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->text('description')->nullable()->after('status');
            $table->string('surface_type')->nullable()->after('description'); // indoor | outdoor
            $table->integer('display_order')->default(0)->after('surface_type');
            $table->jsonb('metadata')->nullable()->after('display_order');   // amenities, photos, notes
        });
    }

    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn(['description', 'surface_type', 'display_order', 'metadata']);
        });
    }
};
