<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\PlatformServiceStatus;
use App\Models\PlatformService;
use Illuminate\Database\Seeder;

class PlatformServiceSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Pickleball', 'slug' => 'pickleball', 'description' => 'Quản lý và nhận đặt sân pickleball.', 'icon' => 'circle-dot', 'display_order' => 10],
            ['name' => 'Cầu lông', 'slug' => 'badminton', 'description' => 'Quản lý và nhận đặt sân cầu lông.', 'icon' => 'activity', 'display_order' => 20],
        ] as $service) {
            PlatformService::updateOrCreate(['slug' => $service['slug']], $service + [
                'vertical_key' => 'racket_court',
                'status' => PlatformServiceStatus::Active,
                'pricing_model' => 'flat',
                'features' => ['recurring_booking', 'vietqr_deposit', 'zalo_reminders'],
                'trial_days' => 14,
            ]);
        }
    }
}
