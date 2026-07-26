<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add venue metadata: contact info, geo coordinates, description.
 * Social links + cover_photo + business_hours live in the existing `settings` JSONB.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('address')->nullable()->after('timezone');
            $table->string('phone')->nullable()->after('address');
            $table->string('email')->nullable()->after('phone');
            $table->string('website')->nullable()->after('email');
            $table->decimal('lat', 10, 7)->nullable()->after('website');
            $table->decimal('lng', 10, 7)->nullable()->after('lat');
            $table->text('description')->nullable()->after('lng');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['address', 'phone', 'email', 'website', 'lat', 'lng', 'description']);
        });
    }
};
