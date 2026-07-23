<?php

declare(strict_types=1);

namespace Tests\Feature\Catalog;

use App\Models\Court;
use App\Models\OpeningRule;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OpeningRuleControllerTest extends TestCase
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

    private function court(Tenant $t, string $name = 'Sân 1'): Court
    {
        return Court::create(['tenant_id' => $t->id, 'name' => $name, 'court_type' => 'pickleball', 'status' => 'active']);
    }

    public function test_owner_stores_opening_rule(): void
    {
        $t = $this->venue('venue-a');
        $court = $this->court($t);

        $this->actingAs($this->owner($t))
            ->post("/manager/courts/{$court->uuid}/opening-rules", [
                'weekday' => [1, 2, 3, 4, 5],
                'open_local' => '06:00',
                'close_local' => '22:00',
                'effective_from' => '2026-01-01',
                'effective_to' => null,
            ])
            ->assertRedirect();

        $this->assertSame(1, $court->openingRules()->count());
        $this->assertDatabaseHas('opening_rules', [
            'tenant_id' => $t->id,
            'court_id' => $court->id,
        ]);
    }

    public function test_overlapping_opening_rule_is_rejected(): void
    {
        $t = $this->venue('venue-a');
        $court = $this->court($t);
        // Existing open-ended rule: weekday 1, 06:00–08:00, from 2026-01-01.
        OpeningRule::create([
            'tenant_id' => $t->id, 'court_id' => $court->id, 'weekday' => [1],
            'open_local' => '06:00:00', 'close_local' => '08:00:00',
            'effective_from' => '2026-01-01', 'effective_to' => null,
        ]);

        // Same weekday + intersecting time window (07:00–09:00) + intersecting date range.
        $this->actingAs($this->owner($t))
            ->from("/manager/courts/{$court->uuid}/opening-rules")
            ->post("/manager/courts/{$court->uuid}/opening-rules", [
                'weekday' => [1],
                'open_local' => '07:00',
                'close_local' => '09:00',
                'effective_from' => '2026-06-01',
                'effective_to' => null,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors(['open_local']);

        $this->assertSame(1, $court->openingRules()->count());
    }

    public function test_owner_cannot_store_opening_rule_on_other_tenants_court(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = $this->court($b, 'B1');

        $this->actingAs($this->owner($a))
            ->post("/manager/courts/{$courtB->uuid}/opening-rules", [
                'weekday' => [1], 'open_local' => '06:00', 'close_local' => '22:00', 'effective_from' => '2026-01-01',
            ])
            ->assertForbidden();

        $this->assertSame(0, $courtB->openingRules()->count());
    }

    public function test_owner_cannot_destroy_other_tenants_opening_rule(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = $this->court($b, 'B1');
        $ruleB = OpeningRule::create([
            'tenant_id' => $b->id, 'court_id' => $courtB->id, 'weekday' => [1],
            'open_local' => '06:00:00', 'close_local' => '22:00:00',
            'effective_from' => '2026-01-01', 'effective_to' => null,
        ]);

        $this->actingAs($this->owner($a))
            ->delete("/manager/courts/{$courtB->uuid}/opening-rules/{$ruleB->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('opening_rules', ['id' => $ruleB->id]);
    }
}
