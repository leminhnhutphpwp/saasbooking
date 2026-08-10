<?php

declare(strict_types=1);

namespace Tests\Feature\Catalog;

use App\Enums\CourtStatus;
use App\Enums\CourtType;
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

    private function court(Tenant $t, string $name, CourtType $type = CourtType::Pickleball, CourtStatus $status = CourtStatus::Active): Court
    {
        return Court::forceCreate([
            'tenant_id' => $t->id,
            'name' => $name,
            'court_type' => $type,
            'status' => $status,
        ]);
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
        $this->court($a, 'A1');
        $this->court($b, 'B1');

        $this->actingAs($this->owner($a))
            ->get('/manager/courts')
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Courts/Index')
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'A1'));
    }

    public function test_index_filters_by_search_type_and_status(): void
    {
        $tenant = $this->venue('venue-a');
        $this->court($tenant, 'Sân VIP', CourtType::Pickleball, CourtStatus::Active);
        $this->court($tenant, 'Sân Thường', CourtType::CauLong, CourtStatus::Active);
        $this->court($tenant, 'Sân Bảo trì', CourtType::Pickleball, CourtStatus::Maintenance);

        // Search only
        $this->actingAs($this->owner($tenant))
            ->get('/manager/courts?search=VIP')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'Sân VIP')
                ->where('filters.search', 'VIP'));

        // Type filter
        $this->get('/manager/courts?type=cau_long')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'Sân Thường')
                ->where('filters.type', 'cau_long'));

        // Status filter
        $this->get('/manager/courts?status=maintenance')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'Sân Bảo trì')
                ->where('filters.status', 'maintenance'));

        // Combined filters
        $this->get('/manager/courts?type=pickleball&status=active')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'Sân VIP'));
    }

    public function test_index_search_is_case_insensitive_and_postgres_safe(): void
    {
        $tenant = $this->venue('venue-a');
        $this->court($tenant, 'Sân 100% VIP');
        $this->court($tenant, 'Sân 100X VIP');
        $this->court($tenant, 'Sân _Special');

        // Case-insensitive search
        $this->actingAs($this->owner($tenant))
            ->get('/manager/courts?search=sân')
            ->assertInertia(fn ($page) => $page->has('courts.data', 3));

        // Escaped wildcards (% and _) in search
        $this->get('/manager/courts?search=100%25')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'Sân 100% VIP'));

        $this->get('/manager/courts?search=_Special')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 1)
                ->where('courts.data.0.name', 'Sân _Special'));
    }

    public function test_index_paginates_ten_per_page_and_preserves_query_string(): void
    {
        $tenant = $this->venue('venue-a');
        foreach (range(1, 11) as $n) {
            $this->court($tenant, sprintf('Sân %02d', $n));
        }

        $this->actingAs($this->owner($tenant))
            ->get('/manager/courts?search=S%C3%A2n&status=active')
            ->assertInertia(fn ($page) => $page
                ->has('courts.data', 10)
                ->where('courts.total', 11)
                ->where('courts.per_page', 10)
                ->where('courts.next_page_url', fn ($url) => str_contains($url, 'search=S%C3%A2n') && str_contains($url, 'status=active')));
    }

    public function test_index_returns_filter_values_and_enum_options(): void
    {
        $tenant = $this->venue('venue-a');
        $this->court($tenant, 'Sân 1');

        $this->actingAs($this->owner($tenant))
            ->get('/manager/courts?search=test&type=pickleball&status=active')
            ->assertInertia(fn ($page) => $page
                ->where('filters.search', 'test')
                ->where('filters.type', 'pickleball')
                ->where('filters.status', 'active')
                ->has('courtTypes', 3)
                ->has('courtStatuses', 3));
    }

    public function test_owner_can_open_catalog_action_routes_for_a_listed_court(): void
    {
        $tenant = $this->venue('venue-a');
        $court = $this->court($tenant, 'Sân 1');
        $owner = $this->owner($tenant);

        $this->actingAs($owner)
            ->get(route('manager.courts.index'))
            ->assertInertia(fn ($page) => $page
                ->where('courts.data.0.opening_rules_url', route('manager.courts.opening-rules.index', $court))
                ->where('courts.data.0.pricing_rules_url', route('manager.courts.pricing-rules.index', $court)));

        $this->actingAs($owner)
            ->get(route('manager.courts.opening-rules.index', $court))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Courts/OpeningRules')
                ->where('court.uuid', $court->uuid));

        $this->actingAs($owner)
            ->get(route('manager.courts.pricing-rules.index', $court))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Courts/PricingRules')
                ->where('court.uuid', $court->uuid));
    }

    public function test_bulk_status_updates_only_selected_own_courts(): void
    {
        $tenant = $this->venue('venue-a');
        $selected = $this->court($tenant, 'A1');
        $unselected = $this->court($tenant, 'A2');

        $this->actingAs($this->owner($tenant))
            ->patch('/manager/courts/status', [
                'court_uuids' => [$selected->uuid],
                'status' => CourtStatus::Maintenance->value,
            ])
            ->assertRedirect();

        $this->assertSame(CourtStatus::Maintenance, $selected->fresh()->status);
        $this->assertSame(CourtStatus::Active, $unselected->fresh()->status);
    }

    public function test_bulk_status_rejects_entire_selection_when_a_court_is_outside_tenant(): void
    {
        $tenant = $this->venue('venue-a');
        $otherTenant = $this->venue('venue-b');
        $ownCourt = $this->court($tenant, 'A1');
        $otherCourt = $this->court($otherTenant, 'B1');

        $this->actingAs($this->owner($tenant))
            ->from('/manager/courts')
            ->patch('/manager/courts/status', [
                'court_uuids' => [$ownCourt->uuid, $otherCourt->uuid],
                'status' => CourtStatus::Maintenance->value,
            ])
            ->assertRedirect('/manager/courts')
            ->assertSessionHasErrors('court_uuids');

        $this->assertSame(CourtStatus::Active, $ownCourt->fresh()->status);
        $this->assertSame(CourtStatus::Active, $otherCourt->fresh()->status);
    }

    public function test_bulk_status_rejects_nonexistent_uuids(): void
    {
        $tenant = $this->venue('venue-a');
        $this->court($tenant, 'A1');
        $fakeUuid = '00000000-0000-0000-0000-000000000000';

        $this->actingAs($this->owner($tenant))
            ->from('/manager/courts')
            ->patch('/manager/courts/status', [
                'court_uuids' => [$fakeUuid],
                'status' => CourtStatus::Maintenance->value,
            ])
            ->assertRedirect('/manager/courts')
            ->assertSessionHasErrors('court_uuids');
    }

    public function test_bulk_status_validates_required_fields_and_enum(): void
    {
        $tenant = $this->venue('venue-a');

        $this->actingAs($this->owner($tenant))
            ->from('/manager/courts')
            ->patch('/manager/courts/status', [])
            ->assertRedirect('/manager/courts')
            ->assertSessionHasErrors('court_uuids');

        $this->patch('/manager/courts/status', [
            'court_uuids' => [],
            'status' => 'active',
        ])
            ->assertRedirect('/manager/courts')
            ->assertSessionHasErrors('court_uuids');

        $this->patch('/manager/courts/status', [
            'court_uuids' => ['not-a-uuid'],
            'status' => 'active',
        ])
            ->assertRedirect('/manager/courts')
            ->assertSessionHasErrors('court_uuids.0');

        $this->patch('/manager/courts/status', [
            'court_uuids' => ['00000000-0000-0000-0000-000000000000'],
            'status' => 'invalid_status',
        ])
            ->assertRedirect('/manager/courts')
            ->assertSessionHasErrors('status');
    }

    public function test_owner_cannot_modify_other_tenants_court(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = $this->court($b, 'B1');

        $this->actingAs($this->owner($a))
            ->put("/manager/courts/{$courtB->uuid}", ['name' => 'hacked', 'court_type' => 'pickleball', 'status' => 'active'])
            ->assertForbidden();

        $this->assertDatabaseHas('courts', ['id' => $courtB->id, 'name' => 'B1']);
    }

    public function test_destroy_soft_archives_court_without_deleting_the_row(): void
    {
        $t = $this->venue('venue-a');
        $court = $this->court($t, 'Sân 1');

        $this->actingAs($this->owner($t))
            ->delete("/manager/courts/{$court->uuid}")
            ->assertRedirect();

        $this->assertSame(CourtStatus::Archived, $court->fresh()->status);
        $this->assertDatabaseHas('courts', [
            'id' => $court->id,
            'status' => CourtStatus::Archived->value,
            'deleted_at' => null,
        ]);
    }
}
