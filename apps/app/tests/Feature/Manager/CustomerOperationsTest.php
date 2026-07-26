<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CustomerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerOperationsTest extends TestCase
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

    // ── Phone normalization ──────────────────────────────────────────

    public function test_phone_normalization_leading_zero(): void
    {
        $service = app(CustomerService::class);

        $this->assertSame('+84912345678', $service->normalizePhone('0912345678'));
    }

    public function test_phone_normalization_strips_spaces_and_dashes(): void
    {
        $service = app(CustomerService::class);

        $this->assertSame('+84912345678', $service->normalizePhone('0912 345 678'));
        $this->assertSame('+84912345678', $service->normalizePhone('0912-345-678'));
        $this->assertSame('+84912345678', $service->normalizePhone('0912.345.678'));
        $this->assertSame('+84912345678', $service->normalizePhone('(0912) 345-678'));
    }

    public function test_phone_normalization_preserves_international_format(): void
    {
        $service = app(CustomerService::class);

        $this->assertSame('+84912345678', $service->normalizePhone('+84912345678'));
        $this->assertSame('+15551234567', $service->normalizePhone('+15551234567'));
    }

    public function test_phone_normalization_bare_digits(): void
    {
        $service = app(CustomerService::class);

        $this->assertSame('+84912345678', $service->normalizePhone('912345678'));
    }

    // ── Tenant-scoped search ─────────────────────────────────────────

    public function test_search_returns_only_tenant_customers(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');

        Customer::create(['tenant_id' => $a->id, 'phone' => '+84912345678', 'name' => 'An']);
        Customer::create(['tenant_id' => $b->id, 'phone' => '+84912345678', 'name' => 'Bình']);

        $this->actingAs($this->owner($a));
        $request = request()->create('/manager/customers?q=An');
        $request->attributes->set('workingTenantId', $a->id);

        $results = app(CustomerService::class)->search($request, 'An');

        $this->assertCount(1, $results);
        $this->assertSame('An', $results->first()->name);
    }

    public function test_search_by_phone(): void
    {
        $t = $this->venue('venue-a');
        Customer::create(['tenant_id' => $t->id, 'phone' => '+84912345678', 'name' => 'Khách']);

        $this->actingAs($this->owner($t));
        $request = request()->create('/manager/customers?q=0912345678');
        $request->attributes->set('workingTenantId', $t->id);

        $results = app(CustomerService::class)->search($request, '0912345678');

        $this->assertCount(1, $results);
        $this->assertSame('+84912345678', $results->first()->phone);
    }

    public function test_search_by_name_ilike(): void
    {
        $t = $this->venue('venue-a');
        Customer::create(['tenant_id' => $t->id, 'phone' => '+84911111111', 'name' => 'An']);
        Customer::create(['tenant_id' => $t->id, 'phone' => '+84922222222', 'name' => 'Bình']);

        $this->actingAs($this->owner($t));
        $request = request()->create('/manager/customers?q=An');
        $request->attributes->set('workingTenantId', $t->id);

        $results = app(CustomerService::class)->search($request, 'An');

        $this->assertCount(1, $results);
        $this->assertSame('An', $results->first()->name);
    }

    // ── Store / upsert ───────────────────────────────────────────────

    public function test_store_creates_customer_with_normalized_phone(): void
    {
        $t = $this->venue('venue-a');

        $this->actingAs($this->owner($t))
            ->post('/manager/customers', [
                'phone' => '0912 345 678',
                'name' => 'Khách Mới',
            ])
            ->assertRedirect();

        $customer = Customer::where('tenant_id', $t->id)->first();
        $this->assertNotNull($customer);
        $this->assertSame('+84912345678', $customer->phone);
        $this->assertSame('Khách Mới', $customer->name);
        $this->assertNotEmpty($customer->uuid);
        $this->assertSame('KH0001', $customer->code);
    }

    public function test_customer_codes_are_sequential_and_scoped_per_tenant(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');

        $firstA = Customer::create(['tenant_id' => $a->id, 'phone' => '+84911111111']);
        $secondA = Customer::create(['tenant_id' => $a->id, 'phone' => '+84922222222']);
        $firstB = Customer::create(['tenant_id' => $b->id, 'phone' => '+84933333333']);

        $this->assertSame('KH0001', $firstA->code);
        $this->assertSame('KH0002', $secondA->code);
        $this->assertSame('KH0001', $firstB->code);
    }

    public function test_store_merges_duplicate_phone(): void
    {
        $t = $this->venue('venue-a');

        // First creation.
        $this->actingAs($this->owner($t))
            ->post('/manager/customers', [
                'phone' => '0912345678',
                'name' => 'Original',
            ])
            ->assertRedirect();

        // Second with same phone (different format) → should update, not duplicate.
        $this->actingAs($this->owner($t))
            ->post('/manager/customers', [
                'phone' => '0912-345-678',
                'name' => 'Updated',
            ])
            ->assertRedirect();

        $this->assertSame(1, Customer::where('tenant_id', $t->id)->count());
        $this->assertSame('Updated', Customer::where('tenant_id', $t->id)->first()->name);
    }

    // ── Customer history ─────────────────────────────────────────────

    public function test_show_displays_customer_profile(): void
    {
        $t = $this->venue('venue-a');
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '+84912345678', 'name' => 'Khách']);

        $this->actingAs($this->owner($t))
            ->get("/manager/customers/{$customer->uuid}")
            ->assertOk();
    }

    public function test_show_rejects_cross_tenant_access(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $customerB = Customer::create(['tenant_id' => $b->id, 'phone' => '+84999999999', 'name' => 'Khách B']);

        $this->actingAs($this->owner($a))
            ->get("/manager/customers/{$customerB->uuid}")
            ->assertForbidden();
    }

    // ── Cross-tenant isolation ───────────────────────────────────────

    public function test_index_only_shows_tenant_customers(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');

        Customer::create(['tenant_id' => $a->id, 'phone' => '+84911111111', 'name' => 'A Only']);
        Customer::create(['tenant_id' => $b->id, 'phone' => '+84922222222', 'name' => 'B Only']);

        $this->actingAs($this->owner($a))
            ->get('/manager/customers')
            ->assertOk();

        // Verify through direct query that only tenant A's customer exists in scope.
        $request = request()->create('/manager/customers');
        $request->attributes->set('workingTenantId', $a->id);
        $paginated = app(CustomerService::class)->paginate($request);

        $this->assertCount(1, $paginated->items());
        $this->assertSame('A Only', $paginated->items()[0]['name'] ?? $paginated->items()[0]->name);
    }

    public function test_update_rejects_cross_tenant(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $customerB = Customer::create(['tenant_id' => $b->id, 'phone' => '+84999999999', 'name' => 'Khách B']);

        $this->actingAs($this->owner($a))
            ->put("/manager/customers/{$customerB->uuid}", [
                'name' => 'Hacked',
            ])
            ->assertForbidden();
    }
}
