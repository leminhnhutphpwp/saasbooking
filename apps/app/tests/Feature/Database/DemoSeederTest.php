<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use App\Models\Court;
use App\Models\Tenant;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seeder_does_not_duplicate_courts_when_run_twice(): void
    {
        $this->seed(DemoSeeder::class);
        $this->seed(DemoSeeder::class);

        $pickleballTenant = Tenant::where('slug', 'pickleball-mvp')->firstOrFail();
        $badmintonTenant = Tenant::where('slug', 'cau-long-nvh')->firstOrFail();

        $this->assertSame(4, Court::where('tenant_id', $pickleballTenant->id)->count());
        $this->assertSame(6, Court::where('tenant_id', $badmintonTenant->id)->count());
    }
}
