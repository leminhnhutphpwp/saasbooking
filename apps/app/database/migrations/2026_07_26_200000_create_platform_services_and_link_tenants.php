<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_services', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('vertical_key');
            $table->string('status')->default('active');
            $table->string('icon')->nullable();
            $table->string('pricing_model')->default('flat');
            $table->unsignedInteger('max_resources')->nullable();
            $table->jsonb('features')->default(DB::raw("'[]'::jsonb"));
            $table->unsignedInteger('trial_days')->default(0);
            $table->string('landing_page_url')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->jsonb('metadata')->default(DB::raw("'{}'::jsonb"));
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'display_order']);
        });

        $now = now();
        DB::table('platform_services')->insert([
            [
                'uuid' => (string) Str::uuid(), 'name' => 'Pickleball', 'slug' => 'pickleball',
                'description' => 'Quản lý và nhận đặt sân pickleball.', 'vertical_key' => 'racket_court',
                'status' => 'active', 'icon' => 'circle-dot', 'pricing_model' => 'flat',
                'features' => json_encode(['recurring_booking', 'vietqr_deposit', 'zalo_reminders']),
                'trial_days' => 14, 'display_order' => 10, 'metadata' => '{}',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'uuid' => (string) Str::uuid(), 'name' => 'Cầu lông', 'slug' => 'badminton',
                'description' => 'Quản lý và nhận đặt sân cầu lông.', 'vertical_key' => 'racket_court',
                'status' => 'active', 'icon' => 'activity', 'pricing_model' => 'flat',
                'features' => json_encode(['recurring_booking', 'vietqr_deposit', 'zalo_reminders']),
                'trial_days' => 14, 'display_order' => 20, 'metadata' => '{}',
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->after('id')->constrained('platform_services')->restrictOnDelete();
        });

        $pickleballId = DB::table('platform_services')->where('slug', 'pickleball')->value('id');
        $badmintonId = DB::table('platform_services')->where('slug', 'badminton')->value('id');
        DB::table('tenants')->where('vertical', 'cau_long')->update(['service_id' => $badmintonId, 'vertical' => 'racket_court']);
        DB::table('tenants')->whereNull('service_id')->update(['service_id' => $pickleballId, 'vertical' => 'racket_court']);
        DB::statement('ALTER TABLE tenants ALTER COLUMN service_id SET NOT NULL');
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('service_id');
        });
        Schema::dropIfExists('platform_services');
    }
};
