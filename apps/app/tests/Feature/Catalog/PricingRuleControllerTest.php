<?php

declare(strict_types=1);

namespace Tests\Feature\Catalog;

use App\Models\Court;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PricingRuleControllerTest extends TestCase
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

    public function test_owner_stores_pricing_rule(): void
    {
        $t = $this->venue('venue-a');
        $court = $this->court($t);

        $this->actingAs($this->owner($t))
            ->post("/manager/courts/{$court->uuid}/pricing-rules", [
                'weekday' => [1, 2, 3],
                'start_local' => '06:00',
                'end_local' => '08:00',
                'price_per_hour' => 80_000,
                'priority' => 0,
            ])
            ->assertRedirect();

        $this->assertSame(1, $court->pricingRules()->count());
        $this->assertDatabaseHas('pricing_rules', [
            'tenant_id' => $t->id,
            'court_id' => $court->id,
            'price_per_hour' => 80_000,
        ]);
    }

    public function test_overlapping_pricing_rule_is_rejected(): void
    {
        $t = $this->venue('venue-a');
        $court = $this->court($t);
        PricingRule::create([
            'tenant_id' => $t->id, 'court_id' => $court->id, 'weekday' => [1],
            'start_local' => '06:00:00', 'end_local' => '08:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($this->owner($t))
            ->from("/manager/courts/{$court->uuid}/pricing-rules")
            ->post("/manager/courts/{$court->uuid}/pricing-rules", [
                'weekday' => [1],           // same weekday
                'start_local' => '07:00',   // 07:00–09:00 intersects 06:00–08:00
                'end_local' => '09:00',
                'price_per_hour' => 90_000,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors(['start_local']);

        // Overlapping rule was NOT persisted (only the seeded one remains).
        $this->assertSame(1, $court->pricingRules()->count());
    }

    public function test_higher_priority_overlap_is_allowed_for_peak_pricing(): void
    {
        $t = $this->venue('venue-a');
        $court = $this->court($t);
        PricingRule::create([
            'tenant_id' => $t->id, 'court_id' => $court->id, 'weekday' => [1],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($this->owner($t))
            ->post("/manager/courts/{$court->uuid}/pricing-rules", [
                'weekday' => [1], 'start_local' => '17:00', 'end_local' => '22:00',
                'price_per_hour' => 100_000, 'priority' => 10,
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertSame(2, $court->pricingRules()->count());
    }

    public function test_owner_stores_venue_wide_pricing_rule(): void
    {
        $t = $this->venue('venue-a');

        $this->actingAs($this->owner($t))
            ->post('/manager/pricing-rules', [
                'weekday' => [1, 2, 3, 4, 5], 'start_local' => '06:00', 'end_local' => '23:00',
                'price_per_hour' => 80_000, 'priority' => 0,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('pricing_rules', [
            'tenant_id' => $t->id, 'court_id' => null, 'price_per_hour' => 80_000,
        ]);
    }

    public function test_venue_wide_rule_rejects_invalid_time_range(): void
    {
        $t = $this->venue('venue-a');

        $this->actingAs($this->owner($t))
            ->from('/manager/courts')
            ->post('/manager/pricing-rules', [
                'weekday' => [1], 'start_local' => '22:00', 'end_local' => '06:00',
                'price_per_hour' => 80_000, 'priority' => 0,
            ])
            ->assertSessionHasErrors(['end_local']);

        $this->assertDatabaseMissing('pricing_rules', ['tenant_id' => $t->id]);
    }

    public function test_owner_cannot_change_another_tenants_venue_rule(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $rule = PricingRule::create([
            'tenant_id' => $b->id, 'court_id' => null, 'weekday' => [1],
            'start_local' => '06:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 80_000, 'priority' => 0,
        ]);

        $this->actingAs($this->owner($a))
            ->put("/manager/pricing-rules/{$rule->id}", [
                'weekday' => [1], 'start_local' => '06:00', 'end_local' => '23:00',
                'price_per_hour' => 1, 'priority' => 0,
            ])
            ->assertNotFound();

        $this->assertSame(80_000, $rule->fresh()->price_per_hour);
    }

    public function test_owner_cannot_store_pricing_rule_on_other_tenants_court(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = $this->court($b, 'B1');

        $this->actingAs($this->owner($a))
            ->post("/manager/courts/{$courtB->uuid}/pricing-rules", [
                'weekday' => [1], 'start_local' => '06:00', 'end_local' => '08:00', 'price_per_hour' => 80_000,
            ])
            ->assertForbidden();

        $this->assertSame(0, $courtB->pricingRules()->count());
    }

    public function test_owner_cannot_update_other_tenants_pricing_rule(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = $this->court($b, 'B1');
        $ruleB = PricingRule::create([
            'tenant_id' => $b->id, 'court_id' => $courtB->id, 'weekday' => [1],
            'start_local' => '06:00:00', 'end_local' => '08:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($this->owner($a))
            ->put("/manager/courts/{$courtB->uuid}/pricing-rules/{$ruleB->id}", [
                'weekday' => [1], 'start_local' => '06:00', 'end_local' => '08:00', 'price_per_hour' => 1,
            ])
            ->assertForbidden();

        $this->assertSame(60_000, $ruleB->fresh()->price_per_hour);
    }

    public function test_owner_cannot_destroy_other_tenants_pricing_rule(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $courtB = $this->court($b, 'B1');
        $ruleB = PricingRule::create([
            'tenant_id' => $b->id, 'court_id' => $courtB->id, 'weekday' => [1],
            'start_local' => '06:00:00', 'end_local' => '08:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($this->owner($a))
            ->delete("/manager/courts/{$courtB->uuid}/pricing-rules/{$ruleB->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('pricing_rules', ['id' => $ruleB->id]);
    }
}
