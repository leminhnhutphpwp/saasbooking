<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Replaces the closed court_type write contract with a tenant-owned category reference while
 * retaining court_type as historical compatibility data (ADR-001 §Migration Contract).
 *
 * The backfill is tenant-local: for each distinct (tenant_id, court_type) pair, we find or
 * create a resource_category with matching slug, then set the composite FK. A forged
 * category reference cannot cross venue boundaries through the composite foreign key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->unsignedBigInteger('resource_category_id')->nullable()->after('tenant_id');
        });

        $categories = [
            'cau_long' => ['code' => 'cau_long', 'slug' => 'cau_long', 'label' => 'Cầu lông'],
            'pickleball' => ['code' => 'pickleball', 'slug' => 'pickleball', 'label' => 'Pickleball'],
            'khac' => ['code' => 'khac', 'slug' => 'khac', 'label' => 'Khác'],
        ];

        // For each distinct (tenant_id, court_type) pair, find-or-create the matching category.
        DB::table('courts')
            ->select('tenant_id', 'court_type')
            ->distinct()
            ->orderBy('tenant_id')
            ->orderBy('court_type')
            ->each(function (object $court) use ($categories): void {
                $type = (string) $court->court_type;
                $cat = $categories[$type] ?? [
                    'code' => $type,
                    'slug' => $type,
                    'label' => Str::of($type)->replace('_', ' ')->title()->toString(),
                ];

                // Use insertGetId + unique guard to avoid duplicates on re-run
                $exists = DB::table('resource_categories')
                    ->where('tenant_id', $court->tenant_id)
                    ->where('slug', $cat['slug'])
                    ->first();

                if (! $exists) {
                    DB::table('resource_categories')->insert([
                        'uuid' => (string) Str::uuid(),
                        'tenant_id' => $court->tenant_id,
                        'code' => $cat['code'],
                        'slug' => $cat['slug'],
                        'label' => $cat['label'],
                        'is_active' => true,
                        'display_order' => 0,
                        'metadata' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            });

        // Backfill: set resource_category_id for every court via tenant-safe composite match
        DB::statement(<<<'SQL'
            UPDATE courts
            SET resource_category_id = resource_categories.id
            FROM resource_categories
            WHERE resource_categories.tenant_id = courts.tenant_id
              AND resource_categories.slug = courts.court_type
        SQL);

        Schema::table('courts', function (Blueprint $table) {
            $table->foreign(['tenant_id', 'resource_category_id'])
                ->references(['tenant_id', 'id'])
                ->on('resource_categories')
                ->restrictOnDelete();
            $table->index(['tenant_id', 'resource_category_id']);
        });
    }

    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropForeign(['tenant_id', 'resource_category_id']);
            $table->dropIndex(['tenant_id', 'resource_category_id']);
            $table->dropColumn('resource_category_id');
        });
    }
};
