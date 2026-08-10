<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Court;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RlsCourtRouteBindingTest extends TestCase
{
    use DatabaseMigrations;

    public function test_manager_catalog_routes_bind_courts_after_the_runtime_rls_context_is_set(): void
    {
        Role::create(['name' => 'owner', 'guard_name' => 'web']);

        $tenantA = Tenant::create(['name' => 'Venue A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $tenantB = Tenant::create(['name' => 'Venue B', 'slug' => 'venue-b', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $courtA = Court::forceCreate(['tenant_id' => $tenantA->id, 'name' => 'Court A', 'court_type' => 'pickleball', 'status' => 'active']);
        $courtB = Court::forceCreate(['tenant_id' => $tenantB->id, 'name' => 'Court B', 'court_type' => 'pickleball', 'status' => 'active']);
        $ownerA = User::factory()->create(['tenant_id' => $tenantA->id]);
        $ownerA->assignRole('owner');

        $this->actingAs($ownerA)
            ->get(route('manager.courts.opening-rules.index', $courtA))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Courts/OpeningRules')
                ->where('court.uuid', $courtA->uuid));

        $this->actingAs($ownerA)
            ->get(route('manager.courts.pricing-rules.index', $courtA))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Courts/PricingRules')
                ->where('court.uuid', $courtA->uuid));

        $this->actingAs($ownerA)
            ->get(route('manager.courts.opening-rules.index', $courtB))
            ->assertForbidden();

        $this->actingAs($ownerA)
            ->get(route('manager.courts.pricing-rules.index', $courtB))
            ->assertForbidden();
    }
}
