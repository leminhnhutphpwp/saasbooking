<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Models\BankTxnInbox;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantResourceIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'owner', 'guard_name' => 'web']);
    }

    public function test_owner_cannot_use_foreign_uuids_or_ids_to_read_or_mutate_resources(): void
    {
        [$tenantA, $ownerA] = $this->tenantAndOwner('venue-a');
        [$tenantB] = $this->tenantAndOwner('venue-b');
        $courtB = $this->court($tenantB, 'B court');
        $customerB = $this->customer($tenantB, '+84911111111', 'B customer');
        $bookingB = $this->booking($tenantB, $customerB, 'SAN-TENB1');
        $paymentB = Payment::forceCreate([
            'tenant_id' => $tenantB->id,
            'booking_id' => $bookingB->id,
            'method' => PaymentMethod::VietQr,
            'amount' => 50_000,
            'status' => PaymentStatus::Awaiting,
            'memo_ref' => $bookingB->code,
        ]);

        $this->actingAs($ownerA)
            ->get("/manager/bookings/{$bookingB->uuid}?tenant_id={$tenantB->id}")
            ->assertForbidden();
        $this->actingAs($ownerA)
            ->patch("/manager/bookings/{$bookingB->uuid}/status?tenant_id={$tenantB->id}", ['action' => 'check_in'])
            ->assertForbidden();
        $this->actingAs($ownerA)
            ->put("/manager/courts/{$courtB->uuid}?tenant_id={$tenantB->id}", [
                'name' => 'Compromised',
                'court_type' => CourtType::Pickleball->value,
                'status' => CourtStatus::Archived->value,
            ])
            ->assertForbidden();
        $this->actingAs($ownerA)
            ->get("/manager/customers/{$customerB->uuid}?tenant_id={$tenantB->id}")
            ->assertForbidden();
        $this->actingAs($ownerA)
            ->put("/manager/customers/{$customerB->uuid}?tenant_id={$tenantB->id}", ['name' => 'Compromised'])
            ->assertForbidden();

        $this->assertSame(BookingStatus::PendingDeposit, $bookingB->fresh()->status);
        $this->assertSame('B court', $courtB->fresh()->name);
        $this->assertSame('B customer', $customerB->fresh()->name);
        $this->assertSame(PaymentStatus::Awaiting, $paymentB->fresh()->status);

        $customerA = $this->customer($tenantA, '+84922222222', 'A customer');
        $bookingA = $this->booking($tenantA, $customerA, 'SAN-TENA1');
        $paymentA = Payment::forceCreate([
            'tenant_id' => $tenantA->id,
            'booking_id' => $bookingA->id,
            'method' => PaymentMethod::VietQr,
            'amount' => 50_000,
            'status' => PaymentStatus::Awaiting,
            'memo_ref' => $bookingA->code,
        ]);
        $configB = TenantBankConfig::create([
            'tenant_id' => $tenantB->id,
            'provider' => 'sepay',
            'bank_bin' => '970422',
            'account_number' => '10000002',
            'account_name' => 'Venue B',
            'webhook_secret' => 'secret',
            'active' => true,
        ]);
        $foreignTxn = BankTxnInbox::create([
            'provider' => 'sepay',
            'bank_txn_id' => 'foreign-txn',
            'account_number' => $configB->account_number,
            'amount' => 50_000,
            'memo' => $bookingA->code,
        ]);

        $this->actingAs($ownerA)
            ->post('/manager/reconcile/match', ['txn_id' => $foreignTxn->id, 'booking_uuid' => $bookingA->uuid])
            ->assertForbidden();

        $this->assertSame(PaymentStatus::Awaiting, $paymentA->fresh()->status);
        $this->assertNull($foreignTxn->fresh()->processed_at);
    }

    public function test_manager_home_uses_the_resolved_working_tenant_not_the_primary_tenant(): void
    {
        [$tenantA, $owner] = $this->tenantAndOwner('venue-a');
        [$tenantB] = $this->tenantAndOwner('venue-b');
        $owner->tenants()->attach($tenantB->id, ['role' => 'owner']);

        $this->actingAs($owner)
            ->get("/manager/home?tenant_id={$tenantB->id}")
            ->assertInertia(fn ($page) => $page->where('tenantName', $tenantB->name));

        $this->assertNotSame($tenantA->id, $tenantB->id);
    }

    /** @return array{Tenant, User} */
    private function tenantAndOwner(string $slug): array
    {
        $tenant = Tenant::create([
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'slug' => $slug,
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('owner');

        return [$tenant, $owner];
    }

    private function court(Tenant $tenant, string $name): Court
    {
        return Court::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => $name,
            'court_type' => CourtType::Pickleball,
            'status' => CourtStatus::Active,
        ]);
    }

    private function customer(Tenant $tenant, string $phone, string $name): Customer
    {
        return Customer::create(['tenant_id' => $tenant->id, 'phone' => $phone, 'name' => $name]);
    }

    private function booking(Tenant $tenant, Customer $customer, string $code): Booking
    {
        return Booking::forceCreate([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'code' => $code,
            'customer_id' => $customer->id,
            'status' => BookingStatus::PendingDeposit,
            'channel' => BookingChannel::OwnerManual,
            'total_amount' => 50_000,
            'deposit_amount' => 50_000,
            'payment_mode' => PaymentMode::Deposit,
            'cancel_policy_snapshot' => [],
        ]);
    }
}
