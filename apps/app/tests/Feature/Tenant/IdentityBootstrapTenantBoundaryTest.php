<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Tenant;
use App\Models\User;
use App\Support\WorkingTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class IdentityBootstrapTenantBoundaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_revoked_primary_membership_clears_the_stale_primary_tenant_and_cookie(): void
    {
        $tenant = $this->tenant('venue-a');
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $user->assignRole('owner');
        $user->tenants()->attach($tenant->id, ['role' => 'owner']);
        $user->tenants()->detach($tenant->id);

        $request = Request::create('/?tenant_id='.$tenant->id, 'GET', [], [WorkingTenant::COOKIE => (string) $tenant->id]);
        $request->setUserResolver(fn (): User => $user->fresh());

        $this->assertNull(WorkingTenant::resolve($request));
        $this->assertNull($user->fresh()->tenant_id);
        $this->actingAs($user->fresh())->withCookie(WorkingTenant::COOKIE, (string) $tenant->id)
            ->get('/manager/home')
            ->assertForbidden();
    }

    public function test_inactive_membership_tenant_and_cross_tenant_uuid_are_ignored(): void
    {
        $active = $this->tenant('venue-a');
        $inactive = $this->tenant('venue-b');
        $inactive->update(['status' => 'inactive']);
        $user = User::factory()->create(['tenant_id' => $inactive->id]);
        $user->assignRole('owner');
        $user->tenants()->attach([
            $active->id => ['role' => 'owner'],
            $inactive->id => ['role' => 'owner'],
        ]);

        $request = Request::create('/?tenant_id='.$inactive->uuid, 'GET', [], [WorkingTenant::COOKIE => (string) $inactive->id]);
        $request->setUserResolver(fn (): User => $user);

        $this->assertSame($active->id, WorkingTenant::resolve($request));
        $this->assertFalse(WorkingTenant::switchable($user)->contains('id', $inactive->id));
    }

    private function tenant(string $slug): Tenant
    {
        return Tenant::create([
            'name' => $slug,
            'slug' => $slug,
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
    }
}
