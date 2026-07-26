<?php

declare(strict_types=1);

namespace Tests\Feature\Catalog;

use App\Models\Court;
use App\Models\ResourceCategory;
use App\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceCategoryTest extends TestCase
{
    use RefreshDatabase;

    private function tenant(string $slug = 'venue'): Tenant
    {
        return Tenant::create([
            'name' => $slug,
            'slug' => $slug,
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
    }

    private function category(Tenant $tenant, string $code, string $label): ResourceCategory
    {
        return ResourceCategory::create([
            'tenant_id' => $tenant->id,
            'code' => $code,
            'slug' => $code,
            'label' => $label,
            'is_active' => true,
        ]);
    }

    public function test_category_creation_with_all_fields(): void
    {
        $tenant = $this->tenant();
        $cat = ResourceCategory::create([
            'tenant_id' => $tenant->id,
            'code' => 'pickleball',
            'slug' => 'pickleball',
            'label' => 'Pickleball',
            'is_active' => true,
            'display_order' => 1,
            'metadata' => ['icon' => '🏓', 'color' => '#FF6B35'],
        ]);

        $this->assertDatabaseHas('resource_categories', [
            'tenant_id' => $tenant->id,
            'code' => 'pickleball',
            'slug' => 'pickleball',
            'label' => 'Pickleball',
            'is_active' => true,
            'display_order' => 1,
        ]);
        $this->assertSame(['icon' => '🏓', 'color' => '#FF6B35'], $cat->metadata);
    }

    public function test_category_slug_is_unique_within_a_tenant_but_reusable_by_other_tenants(): void
    {
        $first = $this->tenant('first');
        $second = $this->tenant('second');

        $this->category($first, 'pickleball', 'Pickleball');
        $this->category($second, 'pickleball', 'Pickleball');

        $this->expectException(UniqueConstraintViolationException::class);
        $this->category($first, 'pickleball', 'Duplicate');
    }

    public function test_category_code_is_unique_within_a_tenant(): void
    {
        $tenant = $this->tenant();
        $this->category($tenant, 'pickleball', 'Pickleball');

        $this->expectException(UniqueConstraintViolationException::class);
        $this->category($tenant, 'pickleball', 'Pickleball v2');
    }

    public function test_court_resource_category_must_belong_to_the_same_tenant(): void
    {
        $a = $this->tenant('tenant-a');
        $b = $this->tenant('tenant-b');
        $category = $this->category($b, 'pickleball', 'Pickleball');

        $this->expectException(QueryException::class);
        Court::forceCreate([
            'tenant_id' => $a->id,
            'resource_category_id' => $category->id,
            'name' => 'Wrong tenant',
        ]);
    }

    public function test_disabled_category_validation_is_documented(): void
    {
        $tenant = $this->tenant();
        $disabled = ResourceCategory::create([
            'tenant_id' => $tenant->id,
            'code' => 'archived',
            'slug' => 'archived',
            'label' => 'Archived Type',
            'is_active' => false,
        ]);

        // The application validation layer should block this, but we test the
        // data-integrity contract: a disabled category still has a valid row so the
        // FK itself is satisfied; rejection is a policy enforced in FormRequest/Service.
        $court = Court::forceCreate([
            'tenant_id' => $tenant->id,
            'resource_category_id' => $disabled->id,
            'name' => 'Should be rejected by policy',
            'status' => 'active',
        ]);

        // Verify the row exists — proving the DB doesn't reject disabled categories;
        // the application layer (FormRequest/Service) is responsible for the policy.
        $this->assertDatabaseHas('courts', ['id' => $court->id, 'resource_category_id' => $disabled->id]);
        $this->assertFalse($disabled->fresh()->is_active);
    }

    public function test_legacy_courts_are_backfilled_to_their_tenants_category_during_migration(): void
    {
        $migration = require database_path('migrations/2026_07_25_100100_add_category_id_to_courts_table.php');
        $migration->down();

        $tenant = $this->tenant('legacy');
        Court::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Legacy court',
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);

        $migration->up();

        $court = Court::withoutGlobalScopes()->where('name', 'Legacy court')->firstOrFail();
        $this->assertNotNull($court->resource_category_id);
        $this->assertSame('pickleball', $court->resourceCategory->slug);
    }

    public function test_legacy_court_type_is_preserved_after_backfill(): void
    {
        $migration = require database_path('migrations/2026_07_25_100100_add_category_id_to_courts_table.php');
        $migration->down();

        $tenant = $this->tenant('legacy-preserve');
        Court::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Legacy court',
            'court_type' => 'cau_long',
            'status' => 'active',
        ]);

        $migration->up();

        $court = Court::withoutGlobalScopes()->where('name', 'Legacy court')->firstOrFail();
        // Legacy column preserved for compatibility (cast to CourtType enum)
        $this->assertSame('cau_long', $court->court_type->value);
        // New category reference also set
        $this->assertNotNull($court->resource_category_id);
        $this->assertSame('cau_long', $court->resourceCategory->slug);
    }

    public function test_categories_are_isolated_per_tenant_on_query(): void
    {
        $a = $this->tenant('venue-a');
        $b = $this->tenant('venue-b');

        $this->category($a, 'pickleball', 'Pickleball');
        $this->category($b, 'badminton', 'Cầu lông');

        $aCategories = ResourceCategory::where('tenant_id', $a->id)->get();
        $bCategories = ResourceCategory::where('tenant_id', $b->id)->get();

        $this->assertCount(1, $aCategories);
        $this->assertSame('pickleball', $aCategories->first()->slug);
        $this->assertCount(1, $bCategories);
        $this->assertSame('badminton', $bCategories->first()->slug);
    }

    public function test_soft_deleted_category_is_not_visible_in_standard_query(): void
    {
        $tenant = $this->tenant();
        $category = ResourceCategory::create([
            'tenant_id' => $tenant->id,
            'code' => 'temporary',
            'slug' => 'temporary',
            'label' => 'Temporary',
            'is_active' => true,
        ]);

        $category->delete();

        $this->assertNull(ResourceCategory::find($category->id));
        $this->assertNotNull(ResourceCategory::withTrashed()->find($category->id));
    }

    public function test_scope_for_tenant_filters_correctly(): void
    {
        $a = $this->tenant('venue-a');
        $b = $this->tenant('venue-b');

        $this->category($a, 'pickleball', 'Pickleball');
        $this->category($a, 'cau_long', 'Cầu lông');
        $this->category($b, 'pickleball', 'Pickleball');

        $aCategories = ResourceCategory::forTenant($a->id)->get();
        $this->assertCount(2, $aCategories);

        $bCategories = ResourceCategory::forTenant($b->id)->get();
        $this->assertCount(1, $bCategories);
    }

    public function test_scope_active_filters_inactive_categories(): void
    {
        $tenant = $this->tenant();
        ResourceCategory::create([
            'tenant_id' => $tenant->id,
            'code' => 'active_one',
            'slug' => 'active-one',
            'label' => 'Active',
            'is_active' => true,
        ]);
        ResourceCategory::create([
            'tenant_id' => $tenant->id,
            'code' => 'inactive_one',
            'slug' => 'inactive-one',
            'label' => 'Inactive',
            'is_active' => false,
        ]);

        $active = ResourceCategory::active()->where('tenant_id', $tenant->id)->get();
        $this->assertCount(1, $active);
        $this->assertSame('active_one', $active->first()->code);
    }

    public function test_court_model_has_resource_category_relationship(): void
    {
        $tenant = $this->tenant();
        $category = $this->category($tenant, 'pickleball', 'Pickleball');
        $court = Court::forceCreate([
            'tenant_id' => $tenant->id,
            'resource_category_id' => $category->id,
            'name' => 'Sân 1',
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);

        $this->assertNotNull($court->resourceCategory);
        $this->assertSame($category->id, $court->resourceCategory->id);
        $this->assertSame('pickleball', $court->resourceCategory->code);
    }

    public function test_court_without_category_has_null_relationship(): void
    {
        $tenant = $this->tenant();
        $court = Court::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'No Category Court',
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);

        $this->assertNull($court->resourceCategory);
    }
}
