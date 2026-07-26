<?php

declare(strict_types=1);

namespace Tests\Feature\Venue;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VenueProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'owner', 'guard_name' => 'web']);
    }

    public function test_owner_saves_default_hourly_price_without_losing_other_settings(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
            'settings' => [
                'branding' => ['primary_color' => '#123456'],
                'pricing' => ['future_option' => true],
            ],
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');

        $this->actingAs($owner)->post('/manager/venue', [
            'pricing' => ['default_price_per_hour' => 75_000],
        ])->assertRedirect();

        $settings = $tenant->fresh()->settings;
        $this->assertSame(75_000, $settings['pricing']['default_price_per_hour']);
        $this->assertSame('#123456', $settings['branding']['primary_color']);
        $this->assertTrue($settings['pricing']['future_option']);
    }

    public function test_owner_cannot_save_negative_default_price(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');

        $this->actingAs($owner)->post('/manager/venue', [
            'pricing' => ['default_price_per_hour' => -1],
        ])->assertSessionHasErrors(['pricing.default_price_per_hour']);
    }
}
