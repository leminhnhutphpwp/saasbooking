<?php

declare(strict_types=1);

namespace Tests\Feature\Catalog;

use App\Models\Court;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CourtManagementTest extends TestCase
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

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    public function test_owner_creates_court_scoped_to_their_tenant(): void
    {
        $t = $this->venue('venue-a');

        $this->actingAs($this->owner($t))
            ->post('/manager/courts', ['name' => 'Sân 1', 'court_type' => 'pickleball'])
            ->assertRedirect();

        $this->assertDatabaseHas('courts', [
            'tenant_id' => $t->id,
            'name' => 'Sân 1',
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);
    }

    public function test_index_only_lists_own_tenant_courts(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        Court::create(['tenant_id' => $a->id, 'name' => 'A1', 'court_type' => 'pickleball', 'status' => 'active']);
        Court::create(['tenant_id' => $b->id, 'name' => 'B1', 'court_type' => 'pickleball', 'status' => 'active']);

        $this->actingAs($this->owner($a))
            ->get('/manager/courts')
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Courts/Index')
                ->has('courts', 1)
                ->where('courts.0.name', 'A1'));
    }

    public function test_owner_cannot_modify_other_tenants_court(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = Court::create(['tenant_id' => $b->id, 'name' => 'B1', 'court_type' => 'pickleball', 'status' => 'active']);

        $this->actingAs($this->owner($a))
            ->put("/manager/courts/{$courtB->uuid}", ['name' => 'hacked', 'court_type' => 'pickleball', 'status' => 'active'])
            ->assertForbidden();

        $this->assertDatabaseHas('courts', ['id' => $courtB->id, 'name' => 'B1']);
    }
}
