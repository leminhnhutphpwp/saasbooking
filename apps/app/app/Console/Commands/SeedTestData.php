<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedTestData extends Command
{
    protected $signature = 'seed:test-data';
    protected $description = 'Seed test data using migrator connection';

    public function handle()
    {
        $this->info('Seeding test data...');

        DB::connection('migrator')->transaction(function () {
            $tenant = DB::connection('migrator')->table('tenants')->first();
            if (!$tenant) {
                $this->error('No tenant found');
                return;
            }

            $this->info("Tenant: {$tenant->name} (ID: {$tenant->id})");

            // Create customer
            $customerId = DB::connection('migrator')->table('customers')->insertGetId([
                'tenant_id' => $tenant->id,
                'phone' => '0912345678',
                'name' => 'Trần Thị B',
                'email' => 'tranthib@example.com',
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'code' => 'KH0001',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->info("Customer created: ID {$customerId}");

            // Create court if not exists
            $court = DB::connection('migrator')->table('courts')
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$court) {
                $courtId = DB::connection('migrator')->table('courts')->insertGetId([
                    'tenant_id' => $tenant->id,
                    'name' => 'Sân A',
                    'court_type' => 'pickleball',
                    'status' => 'active',
                    'uuid' => (string) \Illuminate\Support\Str::uuid(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->info("Court created: ID {$courtId}");
                $court = (object) ['id' => $courtId];
            } else {
                $this->info("Court exists: ID {$court->id}");
            }

            // Create booking
            $bookingId = DB::connection('migrator')->table('bookings')->insertGetId([
                'tenant_id' => $tenant->id,
                'customer_id' => $customerId,
                'code' => 'SAN-TEST01',
                'status' => 'confirmed',
                'channel' => 'zalo',
                'total_amount' => 260000,
                'deposit_amount' => 100000,
                'payment_mode' => 'deposit',
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->info("Booking created: ID {$bookingId}");

            // Create booking slot
            DB::connection('migrator')->table('booking_slots')->insert([
                'tenant_id' => $tenant->id,
                'booking_id' => $bookingId,
                'court_id' => $court->id,
                'start_at' => now()->addDay()->setHour(18),
                'end_at' => now()->addDay()->setHour(20),
                'price_snapshot' => 260000,
                'hold_status' => 'committed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->info("Booking slot created");
        });

        $this->info('Test data seeded successfully!');
    }
}
