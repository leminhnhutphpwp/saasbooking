<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Validates the `can:access-manager` gate (#7): auth alone is not enough — a request to the
 * /manager console requires a tenant-bound user WITH the owner role.
 */
class ManagerAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function venue(string $slug): Tenant
    {
        return Tenant::create(['name' => $slug, 'slug' => $slug, 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
    }

    public function test_owner_with_tenant_can_access_manager_page(): void
    {
        $t = $this->venue('venue-a');
        $owner = User::factory()->create(['tenant_id' => $t->id]);
        $owner->assignRole('owner');

        $this->actingAs($owner)
            ->get('/manager/branding')
            ->assertOk();
    }

    public function test_same_tenant_user_without_owner_role_is_forbidden(): void
    {
        $t = $this->venue('venue-a');
        // Same tenant, but NO owner role → gate denies.
        $nonOwner = User::factory()->create(['tenant_id' => $t->id]);

        $this->actingAs($nonOwner)
            ->get('/manager/branding')
            ->assertForbidden();
    }

    public function test_staff_role_without_owner_role_is_forbidden(): void
    {
        $t = $this->venue('venue-a');
        $staff = User::factory()->create(['tenant_id' => $t->id]);
        $staff->assignRole('staff');

        $this->actingAs($staff)
            ->get('/manager/calendar')
            ->assertForbidden();
    }
}
