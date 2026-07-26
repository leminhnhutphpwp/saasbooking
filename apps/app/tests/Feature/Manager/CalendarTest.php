<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Models\Court;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'owner', 'guard_name' => 'web']);
    }

    public function test_calendar_exposes_resolved_half_hour_prices(): void
    {
        $tenant = Tenant::create([
            'name' => 'Venue', 'slug' => 'venue', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');
        Court::create(['tenant_id' => $tenant->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);
        PricingRule::create([
            'tenant_id' => $tenant->id, 'court_id' => null, 'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '05:00:00', 'end_local' => '23:00:00', 'price_per_hour' => 60_000, 'priority' => 0,
        ]);

        $this->actingAs($owner)
            ->get('/manager/calendar?date=2026-07-21')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Manager/Calendar/Index')
                ->where('courts.0.prices.05:00', 30_000));
    }
}
