<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CourtStatus;
use App\Enums\CourtType;
use App\Models\Court;
use App\Models\Customer;
use App\Models\OpeningRule;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::create([
            'name' => 'Sân Pickleball Demo',
            'slug' => 'pickleball-demo',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
            'settings' => [
                'primary_color' => '#2563eb',
            ],
        ]);

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test Owner',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
            ],
        );
        $user->update(['tenant_id' => $tenant->id]);
        $user->assignRole('owner');

        TenantBankConfig::create([
            'tenant_id' => $tenant->id,
            'provider' => 'sepay',
            'bank_bin' => '970422',
            'account_number' => '0123456789',
            'account_name' => 'SAN PICKLEBALL DEMO',
            'webhook_secret' => 'demo-secret',
            'active' => true,
        ]);

        $courts = [];
        foreach (['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4'] as $i => $name) {
            $courts[] = Court::create([
                'tenant_id' => $tenant->id,
                'name' => $name,
                'court_type' => CourtType::Pickleball,
                'status' => CourtStatus::Active,
            ]);
        }

        foreach ($courts as $court) {
            OpeningRule::create([
                'tenant_id' => $tenant->id,
                'court_id' => $court->id,
                'weekday' => [1, 2, 3, 4, 5, 6, 7],
                'open_local' => '06:00:00',
                'close_local' => '23:00:00',
                'tz' => 'Asia/Ho_Chi_Minh',
                'effective_from' => now()->subMonth()->toDateString(),
                'effective_to' => null,
            ]);
        }

        PricingRule::create([
            'tenant_id' => $tenant->id,
            'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5],
            'start_local' => '06:00:00',
            'end_local' => '17:00:00',
            'price_per_hour' => 50_000,
            'priority' => 0,
        ]);

        PricingRule::create([
            'tenant_id' => $tenant->id,
            'court_id' => null,
            'weekday' => [1, 2, 3, 4, 5],
            'start_local' => '17:00:00',
            'end_local' => '23:00:00',
            'price_per_hour' => 80_000,
            'priority' => 1,
        ]);

        PricingRule::create([
            'tenant_id' => $tenant->id,
            'court_id' => null,
            'weekday' => [6, 7],
            'start_local' => '06:00:00',
            'end_local' => '23:00:00',
            'price_per_hour' => 80_000,
            'priority' => 0,
        ]);

        $customersData = [
            ['phone' => '0901111111', 'name' => 'Nguyễn Văn An'],
            ['phone' => '0902222222', 'name' => 'Trần Thị Bình'],
            ['phone' => '0903333333', 'name' => 'Lê Hoàng Cường'],
        ];

        foreach ($customersData as $data) {
            Customer::create(array_merge($data, ['tenant_id' => $tenant->id]));
        }
    }
}
