<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\PlatformService;
use App\Models\User;
use App\Support\WorkingTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ServiceRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'owner', 'guard_name' => 'web']);
        Role::create(['name' => 'staff', 'guard_name' => 'web']);
    }

    public function test_authenticated_user_can_register_one_tenant_for_a_service(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        $service = PlatformService::where('slug', 'badminton')->firstOrFail();

        $response = $this->actingAs($user)->post(route('services.store'), [
            'service' => $service->uuid,
            'venue_name' => 'Sân Cầu Lông Minh Anh',
        ]);

        $tenant = $user->fresh()->tenants()->sole();
        $response->assertRedirect(route('manager.home'));
        $this->assertSame($service->id, $tenant->service_id);
        $this->assertSame('racket_court', $tenant->vertical);
        $this->assertSame('owner', $tenant->pivot->role);
        $this->assertSame($tenant->id, $user->fresh()->tenant_id);
        $this->assertTrue($user->fresh()->hasRole('owner'));
    }

    public function test_user_can_register_another_service_as_a_separate_tenant(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);

        foreach (PlatformService::active()->orderBy('id')->get() as $index => $service) {
            $this->actingAs($user)->post(route('services.store'), [
                'service' => $service->uuid,
                'venue_name' => 'Cơ sở '.($index + 1),
            ])->assertRedirect(route('manager.home'));
        }

        $this->assertCount(2, $user->fresh()->tenants);
        $this->assertCount(2, $user->fresh()->tenants->pluck('service_id')->unique());
    }

    public function test_inactive_service_cannot_be_registered(): void
    {
        $user = User::factory()->create();
        $service = PlatformService::where('slug', 'pickleball')->firstOrFail();
        $service->update(['status' => 'inactive']);

        $this->actingAs($user)->post(route('services.store'), [
            'service' => $service->uuid,
            'venue_name' => 'Sân Không Hợp Lệ',
        ])->assertSessionHasErrors('service');
    }

    public function test_switch_endpoint_rejects_tenant_without_membership(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $service = PlatformService::where('slug', 'pickleball')->firstOrFail();

        $this->actingAs($other)->post(route('services.store'), [
            'service' => $service->uuid,
            'venue_name' => 'Cơ sở người khác',
        ]);
        $otherTenant = $other->fresh()->tenants()->sole();

        $this->actingAs($owner)
            ->post(route('tenant.switch'), ['tenant_id' => $otherTenant->id])
            ->assertNotFound();
    }

    public function test_switch_endpoint_sets_working_tenant_cookie_for_membership(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        $service = PlatformService::where('slug', 'pickleball')->firstOrFail();
        $this->actingAs($user)->post(route('services.store'), [
            'service' => $service->uuid,
            'venue_name' => 'Cơ sở chính',
        ]);
        $tenant = $user->fresh()->tenants()->sole();

        $this->actingAs($user)
            ->post(route('tenant.switch'), ['tenant_id' => $tenant->id])
            ->assertRedirect(route('manager.home'))
            ->assertCookie(WorkingTenant::COOKIE, (string) $tenant->id);
    }

    public function test_owner_role_on_another_tenant_does_not_override_staff_membership(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        $service = PlatformService::where('slug', 'pickleball')->firstOrFail();
        $this->actingAs($user)->post(route('services.store'), [
            'service' => $service->uuid,
            'venue_name' => 'Cơ sở chủ sở hữu',
        ]);

        $staffTenant = $user->fresh()->tenants()->first()->replicate(['uuid', 'slug']);
        $staffTenant->name = 'Cơ sở làm nhân viên';
        $staffTenant->slug = 'co-so-lam-nhan-vien';
        $staffTenant->save();
        $user->tenants()->attach($staffTenant->id, ['role' => 'staff']);

        $this->withCookie(WorkingTenant::COOKIE, (string) $staffTenant->id)
            ->get(route('manager.home'))
            ->assertForbidden();
    }
}
