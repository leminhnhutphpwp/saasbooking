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

/**
 * The #1 security guarantee: a non-operator is HARD-CLAMPED to their own tenant and cannot
 * reach another venue's data even by forging ?tenant_id. Tested at the resolver (the single
 * source of truth) so every scoped query inherits it.
 */
class WorkingTenantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
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

    private function requestAs(User $user, ?int $forgedTenantId = null): Request
    {
        $request = Request::create($forgedTenantId !== null ? "/?tenant_id={$forgedTenantId}" : '/');
        $request->setUserResolver(fn () => $user);

        return $request;
    }

    public function test_non_operator_is_clamped_to_own_tenant_ignoring_forged_query(): void
    {
        $a = $this->tenant('venue-a');
        $b = $this->tenant('venue-b');

        $owner = User::factory()->create(['tenant_id' => $a->id]);
        $owner->assignRole('owner');

        // Forge ?tenant_id=B → still resolves to A.
        $this->assertSame($a->id, WorkingTenant::resolve($this->requestAs($owner, $b->id)));
    }

    public function test_super_admin_can_switch_venue_via_query(): void
    {
        $this->tenant('venue-a');
        $b = $this->tenant('venue-b');

        $admin = User::factory()->create(['tenant_id' => null]);
        $admin->assignRole('super_admin');

        $this->assertSame($b->id, WorkingTenant::resolve($this->requestAs($admin, $b->id)));
    }

    public function test_unassigned_non_operator_resolves_to_null(): void
    {
        $this->tenant('venue-a');

        $user = User::factory()->create(['tenant_id' => null]);
        $user->assignRole('staff');

        $this->assertNull(WorkingTenant::resolve($this->requestAs($user)));
    }
}
