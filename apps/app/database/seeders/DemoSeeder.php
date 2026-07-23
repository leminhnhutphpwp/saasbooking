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
use App\Enums\SeriesStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\OpeningRule;
use App\Models\Payment;
use App\Models\PricingRule;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRoles();

        $tenant1 = $this->seedTenant1();
        $tenant2 = $this->seedTenant2();

        $this->seedUsers($tenant1, $tenant2);
        $this->seedBankConfigs($tenant1, $tenant2);

        $courts1 = $this->seedCourts1($tenant1);
        $courts2 = $this->seedCourts2($tenant2);

        $this->seedOpeningRules1($tenant1, $courts1);
        $this->seedOpeningRules2($tenant2, $courts2);

        $this->seedPricingRules1($tenant1);
        $this->seedPricingRules2($tenant2);

        $customers1 = $this->seedCustomers1($tenant1);

        $this->seedBookings1($tenant1, $courts1, $customers1);
        $this->seedSeries1($tenant1, $courts1, $customers1);
    }

    private function seedRoles(): void
    {
        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function seedTenant1(): Tenant
    {
        return Tenant::firstOrCreate(
            ['slug' => 'pickleball-mvp'],
            [
                'name' => 'Sân Pickleball MVP',
                'vertical' => 'racket_court',
                'timezone' => 'Asia/Ho_Chi_Minh',
                'status' => 'active',
                'settings' => ['branding' => ['primary_color' => '#7C3AED']],
            ],
        );
    }

    private function seedTenant2(): Tenant
    {
        return Tenant::firstOrCreate(
            ['slug' => 'cau-long-nvh'],
            [
                'name' => 'Sân Cầu Lông Nhà Văn Hóa',
                'vertical' => 'racket_court',
                'timezone' => 'Asia/Ho_Chi_Minh',
                'status' => 'active',
                'settings' => ['branding' => ['primary_color' => '#2563EB']],
            ],
        );
    }

    private function seedUsers(Tenant $t1, Tenant $t2): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@san.vn'],
            ['name' => 'Super Admin', 'password' => Hash::make('password')],
        );
        $admin->update(['tenant_id' => null]);
        if (! $admin->hasRole('super_admin')) {
            $admin->assignRole('super_admin');
        }

        $owner1 = User::firstOrCreate(
            ['email' => 'owner@pickleball.vn'],
            ['name' => 'Chủ sân Pickleball', 'password' => Hash::make('password')],
        );
        $owner1->update(['tenant_id' => $t1->id]);
        if (! $owner1->hasRole('owner')) {
            $owner1->assignRole('owner');
        }

        $staff1 = User::firstOrCreate(
            ['email' => 'staff@pickleball.vn'],
            ['name' => 'Nhân viên Pickleball', 'password' => Hash::make('password')],
        );
        $staff1->update(['tenant_id' => $t1->id]);
        if (! $staff1->hasRole('staff')) {
            $staff1->assignRole('staff');
        }

        $owner2 = User::firstOrCreate(
            ['email' => 'owner@caulong.vn'],
            ['name' => 'Chủ sân Cầu Lông', 'password' => Hash::make('password')],
        );
        $owner2->update(['tenant_id' => $t2->id]);
        if (! $owner2->hasRole('owner')) {
            $owner2->assignRole('owner');
        }
    }

    private function seedBankConfigs(Tenant $t1, Tenant $t2): void
    {
        TenantBankConfig::firstOrCreate(
            ['provider' => 'sepay', 'account_number' => '0123456789'],
            [
                'tenant_id' => $t1->id,
                'bank_bin' => '970422',
                'account_name' => 'SAN PICKLEBALL MVP',
                'webhook_secret' => 'demo-secret-1',
                'active' => true,
            ],
        );

        TenantBankConfig::firstOrCreate(
            ['provider' => 'sepay', 'account_number' => '9876543210'],
            [
                'tenant_id' => $t2->id,
                'bank_bin' => '970422',
                'account_name' => 'SAN CAU LONG NVH',
                'webhook_secret' => 'demo-secret-2',
                'active' => true,
            ],
        );
    }

    private function seedCourts1(Tenant $t): array
    {
        $courts = [];
        foreach (['Sân A1', 'Sân A2', 'Sân B1', 'Sân B2'] as $name) {
            $existing = Court::where('tenant_id', $t->id)->where('name', $name)->first();
            if ($existing) {
                $courts[$name] = $existing;
                continue;
            }
            $courts[$name] = Court::forceCreate([
                'tenant_id' => $t->id,
                'name' => $name,
                'court_type' => CourtType::Pickleball,
                'status' => CourtStatus::Active,
            ]);
        }

        return $courts;
    }

    private function seedCourts2(Tenant $t): array
    {
        $courts = [];
        for ($i = 1; $i <= 6; $i++) {
            $name = "Sân {$i}";
            $existing = Court::where('tenant_id', $t->id)->where('name', $name)->first();
            if ($existing) {
                $courts[$name] = $existing;
                continue;
            }
            $courts[$name] = Court::forceCreate([
                'tenant_id' => $t->id,
                'name' => $name,
                'court_type' => CourtType::CauLong,
                'status' => CourtStatus::Active,
            ]);
        }

        return $courts;
    }

    private function seedOpeningRules1(Tenant $t, array $courts): void
    {
        foreach ($courts as $court) {
            $exists = OpeningRule::where('tenant_id', $t->id)
                ->where('court_id', $court->id)
                ->exists();
            if ($exists) {
                continue;
            }
            OpeningRule::create([
                'tenant_id' => $t->id,
                'court_id' => $court->id,
                'weekday' => [1, 2, 3, 4, 5, 6, 7],
                'open_local' => '06:00:00',
                'close_local' => '23:00:00',
                'tz' => 'Asia/Ho_Chi_Minh',
                'effective_from' => now()->subMonth()->toDateString(),
                'effective_to' => null,
            ]);
        }
    }

    private function seedOpeningRules2(Tenant $t, array $courts): void
    {
        foreach ($courts as $court) {
            $exists = OpeningRule::where('tenant_id', $t->id)
                ->where('court_id', $court->id)
                ->exists();
            if ($exists) {
                continue;
            }
            OpeningRule::create([
                'tenant_id' => $t->id,
                'court_id' => $court->id,
                'weekday' => [1, 2, 3, 4, 5, 6, 7],
                'open_local' => '06:00:00',
                'close_local' => '22:00:00',
                'tz' => 'Asia/Ho_Chi_Minh',
                'effective_from' => now()->subMonth()->toDateString(),
                'effective_to' => null,
            ]);
        }
    }

    private function seedPricingRules1(Tenant $t): void
    {
        $exists = PricingRule::where('tenant_id', $t->id)->exists();
        if ($exists) {
            return;
        }

        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5],
            'start_local' => '06:00:00',
            'end_local' => '17:00:00',
            'price_per_hour' => 100_000,
            'priority' => 0,
        ]);

        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5],
            'start_local' => '17:00:00',
            'end_local' => '22:00:00',
            'price_per_hour' => 130_000,
            'priority' => 1,
        ]);

        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'weekday' => [6, 7],
            'start_local' => '06:00:00',
            'end_local' => '23:00:00',
            'price_per_hour' => 150_000,
            'priority' => 0,
        ]);
    }

    private function seedPricingRules2(Tenant $t): void
    {
        $exists = PricingRule::where('tenant_id', $t->id)->exists();
        if ($exists) {
            return;
        }

        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5],
            'start_local' => '06:00:00',
            'end_local' => '17:00:00',
            'price_per_hour' => 80_000,
            'priority' => 0,
        ]);

        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5],
            'start_local' => '17:00:00',
            'end_local' => '22:00:00',
            'price_per_hour' => 120_000,
            'priority' => 1,
        ]);

        PricingRule::create([
            'tenant_id' => $t->id,
            'court_id' => null,
            'weekday' => [6, 7],
            'start_local' => '06:00:00',
            'end_local' => '22:00:00',
            'price_per_hour' => 120_000,
            'priority' => 0,
        ]);
    }

    private function seedCustomers1(Tenant $t): array
    {
        $data = [
            ['phone' => '0901111111', 'name' => 'Nguyễn Văn An'],
            ['phone' => '0902222222', 'name' => 'Trần Thị Bình'],
            ['phone' => '0903333333', 'name' => 'Lê Hoàng Cường'],
            ['phone' => '0904444444', 'name' => 'Phạm Minh Đức'],
            ['phone' => '0905555555', 'name' => 'Hoàng Thị Lan'],
        ];

        $customers = [];
        foreach ($data as $row) {
            $customers[$row['phone']] = Customer::firstOrCreate(
                ['tenant_id' => $t->id, 'phone' => $row['phone']],
                ['name' => $row['name']],
            );
        }

        return $customers;
    }

    private function seedBookings1(Tenant $t, array $courts, array $customers): void
    {
        $today = Carbon::today();
        $a1 = $courts['Sân A1'];
        $a2 = $courts['Sân A2'];
        $b1 = $courts['Sân B1'];
        $cust1 = $customers['0901111111'];
        $cust2 = $customers['0902222222'];
        $cust3 = $customers['0903333333'];

        $this->seedConfirmedBooking(
            $t, $a1, $cust1,
            code: 'SAN-10001',
            start: $today->copy()->setTime(8, 0),
            end: $today->copy()->setTime(10, 0),
            pricePerHour: 100_000,
            bankTxnId: 'DEMO-TXN-10001',
        );

        $this->seedConfirmedBooking(
            $t, $a2, $cust2,
            code: 'SAN-10002',
            start: $today->copy()->setTime(17, 0),
            end: $today->copy()->setTime(19, 0),
            pricePerHour: 130_000,
            bankTxnId: 'DEMO-TXN-10002',
        );

        $this->seedPendingBooking(
            $t, $b1, $cust3,
            code: 'SAN-10003',
            start: $today->copy()->setTime(19, 0),
            end: $today->copy()->setTime(21, 0),
            pricePerHour: 130_000,
        );

        $this->seedWalkInBooking(
            $t, $a1, $cust2,
            code: 'SAN-10004',
            start: $today->copy()->setTime(14, 0),
            end: $today->copy()->setTime(16, 0),
            pricePerHour: 100_000,
        );
    }

    private function seedConfirmedBooking(
        Tenant $t,
        Court $court,
        Customer $customer,
        string $code,
        Carbon $start,
        Carbon $end,
        int $pricePerHour,
        string $bankTxnId,
    ): void {
        $existing = Booking::where('tenant_id', $t->id)->where('code', $code)->first();
        if ($existing) {
            return;
        }

        $hours = $start->diffInHours($end);
        $total = $pricePerHour * $hours;
        $deposit = (int) ceil($total * 0.3);

        $booking = Booking::forceCreate([
            'tenant_id' => $t->id,
            'code' => $code,
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => BookingChannel::Zalo,
            'payment_mode' => PaymentMode::Deposit,
            'total_amount' => $total,
            'deposit_amount' => $deposit,
            'cancel_policy_snapshot' => ['free_cancel_hours' => 2],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => $start,
            'end_at' => $end,
            'price_snapshot' => $pricePerHour,
            'hold_status' => HoldStatus::Committed,
        ]);

        Payment::forceCreate([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'method' => PaymentMethod::VietQr,
            'amount' => $deposit,
            'status' => PaymentStatus::Matched,
            'memo_ref' => $code,
            'bank_txn_id' => $bankTxnId,
            'matched_at' => now(),
        ]);
    }

    private function seedPendingBooking(
        Tenant $t,
        Court $court,
        Customer $customer,
        string $code,
        Carbon $start,
        Carbon $end,
        int $pricePerHour,
    ): void {
        $existing = Booking::where('tenant_id', $t->id)->where('code', $code)->first();
        if ($existing) {
            return;
        }

        $hours = $start->diffInHours($end);
        $total = $pricePerHour * $hours;
        $deposit = (int) ceil($total * 0.3);

        $booking = Booking::forceCreate([
            'tenant_id' => $t->id,
            'code' => $code,
            'customer_id' => $customer->id,
            'status' => BookingStatus::PendingDeposit,
            'channel' => BookingChannel::Zalo,
            'payment_mode' => PaymentMode::Deposit,
            'total_amount' => $total,
            'deposit_amount' => $deposit,
            'hold_expires_at' => now()->addMinutes(15),
            'cancel_policy_snapshot' => ['free_cancel_hours' => 2],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => $start,
            'end_at' => $end,
            'price_snapshot' => $pricePerHour,
            'hold_status' => HoldStatus::Holding,
        ]);

        Payment::forceCreate([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'method' => PaymentMethod::VietQr,
            'amount' => $deposit,
            'status' => PaymentStatus::Awaiting,
            'memo_ref' => $code,
        ]);
    }

    private function seedWalkInBooking(
        Tenant $t,
        Court $court,
        Customer $customer,
        string $code,
        Carbon $start,
        Carbon $end,
        int $pricePerHour,
    ): void {
        $existing = Booking::where('tenant_id', $t->id)->where('code', $code)->first();
        if ($existing) {
            return;
        }

        $hours = $start->diffInHours($end);
        $total = $pricePerHour * $hours;

        $booking = Booking::forceCreate([
            'tenant_id' => $t->id,
            'code' => $code,
            'customer_id' => $customer->id,
            'status' => BookingStatus::Confirmed,
            'channel' => BookingChannel::OwnerManual,
            'payment_mode' => PaymentMode::Cash,
            'total_amount' => $total,
            'deposit_amount' => 0,
            'cancel_policy_snapshot' => ['free_cancel_hours' => 2],
        ]);

        BookingSlot::create([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'court_id' => $court->id,
            'start_at' => $start,
            'end_at' => $end,
            'price_snapshot' => $pricePerHour,
            'hold_status' => HoldStatus::Committed,
        ]);

        Payment::forceCreate([
            'tenant_id' => $t->id,
            'booking_id' => $booking->id,
            'method' => PaymentMethod::Cash,
            'amount' => $total,
            'status' => PaymentStatus::Matched,
            'memo_ref' => $code . '-CASH',
            'matched_at' => now(),
        ]);
    }

    private function seedSeries1(Tenant $t, array $courts, array $customers): void
    {
        $court = $courts['Sân A1'];
        $customer = $customers['0904444444'];

        $existing = RecurringSeries::where('tenant_id', $t->id)
            ->where('court_id', $court->id)
            ->where('weekday', 3)
            ->where('start_local', '18:00:00')
            ->first();

        if ($existing) {
            return;
        }

        RecurringSeries::forceCreate([
            'tenant_id' => $t->id,
            'customer_id' => $customer->id,
            'court_id' => $court->id,
            'weekday' => 3,
            'start_local' => '18:00:00',
            'end_local' => '20:00:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'price_per_session_snapshot' => 260_000,
            'deposit_per_session' => 78_000,
            'status' => SeriesStatus::Active,
        ]);
    }
}
