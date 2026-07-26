<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Enums\HoldStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\OpeningRule;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Reproducible demo data — 2 tenants, 4 users, 10 courts, sample bookings.
 *
 * Idempotent: uses firstOrCreate/firstOrNew + natural keys.
 * No truncate/wipe — safe to re-run.
 *
 * Run: php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure roles exist
        $this->call(RoleSeeder::class);

        $tenant1 = $this->seedTenant1();
        $tenant2 = $this->seedTenant2();

        $this->seedUsers($tenant1, $tenant2);
        $this->seedCourtsAndRules($tenant1, $tenant2);
        $this->seedCustomers($tenant1);
        $this->seedBankConfig($tenant1, $tenant2);
        $this->seedBookings($tenant1);
    }

    private function seedTenant1(): Tenant
    {
        return Tenant::firstOrCreate(
            ['slug' => 'pickleball-mvp'],
            [
                'name' => 'Sân Pickleball MVP',
                'vertical' => CourtType::Pickleball->value,
                'timezone' => 'Asia/Ho_Chi_Minh',
                'status' => 'active',
                'settings' => [
                    'branding' => [
                        'primary_color' => '#7C3AED',
                    ],
                ],
            ]
        );
    }

    private function seedTenant2(): Tenant
    {
        return Tenant::firstOrCreate(
            ['slug' => 'cau-long-nvh'],
            [
                'name' => 'Sân Cầu Lông Nhà Văn Hóa',
                'vertical' => CourtType::CauLong->value,
                'timezone' => 'Asia/Ho_Chi_Minh',
                'status' => 'active',
                'settings' => [],
            ]
        );
    }

    private function seedUsers(Tenant $tenant1, Tenant $tenant2): void
    {
        $ownerRole = Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $staffRole = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);

        // super_admin (no tenant)
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@san.vn'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
            ]
        );
        $superAdmin->syncRoles([$superAdminRole]);

        // Tenant 1 users
        $owner1 = User::firstOrCreate(
            ['email' => 'owner@pickleball.vn'],
            [
                'name' => 'Chủ Sân Pickleball',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant1->id,
            ]
        );
        $owner1->syncRoles([$ownerRole]);

        $staff1 = User::firstOrCreate(
            ['email' => 'staff@pickleball.vn'],
            [
                'name' => 'Nhân Viên Pickleball',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant1->id,
            ]
        );
        $staff1->syncRoles([$staffRole]);

        // Tenant 2 user
        $owner2 = User::firstOrCreate(
            ['email' => 'owner@caulong.vn'],
            [
                'name' => 'Chủ Sân Cầu Lông',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant2->id,
            ]
        );
        $owner2->syncRoles([$ownerRole]);
    }

    private function seedCourtsAndRules(Tenant $tenant1, Tenant $tenant2): void
    {
        // Tenant 1: 4 pickleball courts
        $courts1 = [];
        for ($i = 1; $i <= 4; $i++) {
            $courts1[] = Court::forceCreate([
                'tenant_id' => $tenant1->id,
                'name' => 'Sân '.chr(64 + $i), // Sân A, B, C, D
                'court_type' => CourtType::Pickleball->value,
                'status' => CourtStatus::Active->value,
            ]);
        }

        // Tenant 2: 6 badminton courts
        $courts2 = [];
        for ($i = 1; $i <= 6; $i++) {
            $courts2[] = Court::forceCreate([
                'tenant_id' => $tenant2->id,
                'name' => "Sân $i",
                'court_type' => CourtType::CauLong->value,
                'status' => CourtStatus::Active->value,
            ]);
        }

        // Opening rules for tenant 1 (all courts, 06:00-23:00, all weekdays)
        $today = Carbon::today();
        foreach ($courts1 as $court) {
            OpeningRule::firstOrCreate(
                [
                    'tenant_id' => $court->tenant_id,
                    'court_id' => $court->id,
                    'effective_from' => $today->toDateString(),
                ],
                [
                    'weekday' => json_encode([1, 2, 3, 4, 5, 6, 7]), // Mon-Sun
                    'open_local' => '06:00:00',
                    'close_local' => '23:00:00',
                    'tz' => 'Asia/Ho_Chi_Minh',
                ]
            );
        }

        // Opening rules for tenant 2 (06:00-22:00)
        foreach ($courts2 as $court) {
            OpeningRule::firstOrCreate(
                [
                    'tenant_id' => $court->tenant_id,
                    'court_id' => $court->id,
                    'effective_from' => $today->toDateString(),
                ],
                [
                    'weekday' => json_encode([1, 2, 3, 4, 5, 6, 7]),
                    'open_local' => '06:00:00',
                    'close_local' => '22:00:00',
                    'tz' => 'Asia/Ho_Chi_Minh',
                ]
            );
        }

        // Pricing rules for tenant 1 (court_id null = all courts)
        $this->seedPricingRules($tenant1->id, [
            // Off-peak: 06:00-17:00 weekdays = 100k
            [
                'weekday' => json_encode([1, 2, 3, 4, 5]),
                'start_local' => '06:00:00',
                'end_local' => '17:00:00',
                'price_per_hour' => 100_000,
                'priority' => 0,
            ],
            // Peak: 17:00-22:00 weekdays = 130k
            [
                'weekday' => json_encode([1, 2, 3, 4, 5]),
                'start_local' => '17:00:00',
                'end_local' => '22:00:00',
                'price_per_hour' => 130_000,
                'priority' => 0,
            ],
            // Weekend: all day = 150k
            [
                'weekday' => json_encode([6, 7]),
                'start_local' => '06:00:00',
                'end_local' => '23:00:00',
                'price_per_hour' => 150_000,
                'priority' => 0,
            ],
        ]);

        // Pricing rules for tenant 2 (80k / 120k)
        $this->seedPricingRules($tenant2->id, [
            [
                'weekday' => json_encode([1, 2, 3, 4, 5]),
                'start_local' => '06:00:00',
                'end_local' => '17:00:00',
                'price_per_hour' => 80_000,
                'priority' => 0,
            ],
            [
                'weekday' => json_encode([1, 2, 3, 4, 5]),
                'start_local' => '17:00:00',
                'end_local' => '22:00:00',
                'price_per_hour' => 120_000,
                'priority' => 0,
            ],
        ]);
    }

    private function seedPricingRules(int $tenantId, array $rules): void
    {
        foreach ($rules as $rule) {
            PricingRule::firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'court_id' => null,
                    'weekday' => $rule['weekday'],
                    'start_local' => $rule['start_local'],
                    'end_local' => $rule['end_local'],
                ],
                [
                    'price_per_hour' => $rule['price_per_hour'],
                    'priority' => $rule['priority'],
                ]
            );
        }
    }

    private function seedCustomers(Tenant $tenant1): void
    {
        $customers = [
            ['name' => 'Nguyễn Văn A', 'phone' => '0901234567'],
            ['name' => 'Trần Thị B', 'phone' => '0912345678'],
            ['name' => 'Lê Văn C', 'phone' => '0923456789'],
            ['name' => 'Phạm Thị D', 'phone' => '0934567890'],
            ['name' => 'Hoàng Văn E', 'phone' => '0945678901'],
        ];

        foreach ($customers as $customer) {
            Customer::firstOrCreate(
                ['tenant_id' => $tenant1->id, 'phone' => $customer['phone']],
                [
                    'name' => $customer['name'],
                    'email' => null,
                ]
            );
        }
    }

    private function seedBankConfig(Tenant $tenant1, Tenant $tenant2): void
    {
        TenantBankConfig::firstOrCreate(
            ['tenant_id' => $tenant1->id, 'provider' => 'sepay'],
            [
                'bank_bin' => '970422',
                'account_number' => '1234567890',
                'account_name' => 'SAN PICKLEBALL MVP',
                'webhook_secret' => 'demo_webhook_secret_1',
                'active' => true,
            ]
        );

        TenantBankConfig::firstOrCreate(
            ['tenant_id' => $tenant2->id, 'provider' => 'sepay'],
            [
                'bank_bin' => '970422',
                'account_number' => '0987654321',
                'account_name' => 'SAN CAU LONG NVH',
                'webhook_secret' => 'demo_webhook_secret_2',
                'active' => true,
            ]
        );
    }

    private function seedBookings(Tenant $tenant1): void
    {
        $court = Court::where('tenant_id', $tenant1->id)->first();
        if (! $court) {
            return;
        }

        $customer1 = Customer::where('tenant_id', $tenant1->id)
            ->where('phone', '0901234567')
            ->first();
        $customer2 = Customer::where('tenant_id', $tenant1->id)
            ->where('phone', '0912345678')
            ->first();

        if (! $customer1 || ! $customer2) {
            return;
        }

        $today = Carbon::today();

        // Booking 1: Confirmed with matched payment
        $booking1 = $this->createBookingWithSlots(
            code: 'SAN-'.strtoupper(substr(md5($tenant1->id.'booking1'), 0, 5)),
            tenant_id: $tenant1->id,
            customer_id: $customer1->id,
            court_id: $court->id,
            status: BookingStatus::Confirmed,
            start_at: $today->copy()->setTime(18, 0),
            end_at: $today->copy()->setTime(20, 0),
            total_amount: 260_000,
            deposit_amount: 100_000,
            payment_mode: PaymentMode::Deposit,
        );

        if ($booking1) {
            $memoRef = 'SAN-'.substr(md5($tenant1->id.'payment1'), 0, 8);
            $bankTxnId = 'DEMO_TXN_'.$booking1->id;

            Payment::firstOrCreate(
                ['bank_txn_id' => $bankTxnId],
                [
                    'tenant_id' => $tenant1->id,
                    'booking_id' => $booking1->id,
                    'method' => PaymentMethod::VietQr,
                    'amount' => 100_000,
                    'status' => PaymentStatus::Matched,
                    'memo_ref' => $memoRef,
                    'matched_at' => $today->copy()->setTime(17, 30),
                ]
            );
        }

        // Booking 2: Pending deposit (awaiting payment)
        $this->createBookingWithSlots(
            code: 'SAN-'.strtoupper(substr(md5($tenant1->id.'booking2'), 0, 5)),
            tenant_id: $tenant1->id,
            customer_id: $customer2->id,
            court_id: $court->id,
            status: BookingStatus::PendingDeposit,
            start_at: $today->copy()->setTime(20, 0),
            end_at: $today->copy()->setTime(22, 0),
            total_amount: 260_000,
            deposit_amount: 100_000,
            payment_mode: PaymentMode::Deposit,
        );

        // Booking 3: Walk-in cash (confirmed)
        $this->createBookingWithSlots(
            code: 'SAN-'.strtoupper(substr(md5($tenant1->id.'booking3'), 0, 5)),
            tenant_id: $tenant1->id,
            customer_id: $customer1->id,
            court_id: $court->id,
            status: BookingStatus::Confirmed,
            start_at: $today->copy()->addDay()->setTime(10, 0),
            end_at: $today->copy()->addDay()->setTime(12, 0),
            total_amount: 200_000,
            deposit_amount: 0,
            channel: BookingChannel::OwnerManual,
            payment_mode: PaymentMode::Cash,
        );
    }

    private function createBookingWithSlots(
        string $code,
        int $tenant_id,
        int $customer_id,
        int $court_id,
        BookingStatus $status,
        Carbon $start_at,
        Carbon $end_at,
        int $total_amount,
        int $deposit_amount,
        ?BookingChannel $channel = null,
        PaymentMode $payment_mode = PaymentMode::Deposit,
    ): ?Booking {
        // Check if booking already exists (idempotent)
        $existing = Booking::where('code', $code)->first();
        if ($existing) {
            return $existing;
        }

        $booking = Booking::forceCreate([
            'tenant_id' => $tenant_id,
            'code' => $code,
            'customer_id' => $customer_id,
            'status' => $status,
            'total_amount' => $total_amount,
            'deposit_amount' => $deposit_amount,
            'channel' => $channel ?? BookingChannel::Zalo,
            'payment_mode' => $payment_mode,
            'series_id' => null,
            'hold_expires_at' => null,
            'cancel_policy_snapshot' => [],
            'reminded_at' => null,
        ]);

        if (! $booking) {
            return null;
        }

        // Create booking slot
        BookingSlot::create([
            'tenant_id' => $tenant_id,
            'booking_id' => $booking->id,
            'court_id' => $court_id,
            'start_at' => $start_at,
            'end_at' => $end_at,
            'price_snapshot' => $total_amount,
            'hold_status' => $status === BookingStatus::Confirmed
                ? HoldStatus::Committed
                : HoldStatus::Holding,
        ]);

        return $booking;
    }
}
