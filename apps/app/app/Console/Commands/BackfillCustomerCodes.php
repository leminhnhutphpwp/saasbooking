<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Customer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Backfill human-readable `code` (KH0001, KH0002, …) for existing customers.
 * Generates per-tenant sequential codes ordered by (tenant_id, id).
 * Safe to run multiple times — only touches NULL codes.
 */
class BackfillCustomerCodes extends Command
{
    protected $signature = 'customers:backfill-codes';

    protected $description = 'Generate sequential customer codes (KH0001, …) for all tenants';

    public function handle(): int
    {
        $tenants = Customer::query()
            ->whereNull('code')
            ->select('tenant_id')
            ->distinct()
            ->pluck('tenant_id');

        if ($tenants->isEmpty()) {
            $this->info('All customers already have a code. Nothing to do.');

            return self::SUCCESS;
        }

        $total = 0;

        foreach ($tenants as $tenantId) {
            $customers = Customer::query()
                ->where('tenant_id', $tenantId)
                ->whereNull('code')
                ->orderBy('id')
                ->get();

            // Find the highest existing code number for this tenant (in case of partial backfill)
            $lastNumber = (int) Customer::query()
                ->where('tenant_id', $tenantId)
                ->whereNotNull('code')
                ->where('code', 'like', 'KH%')
                ->selectRaw('COALESCE(MAX(CAST(SUBSTRING(code FROM 3) AS INTEGER)), 0) as max_num')
                ->value('max_num');

            $codes = [];
            foreach ($customers as $customer) {
                $lastNumber++;
                $codes[$customer->id] = 'KH'.str_pad((string) $lastNumber, 4, '0', STR_PAD_LEFT);
            }

            // Bulk update in a single transaction for performance
            DB::transaction(function () use ($codes, $tenantId) {
                foreach ($codes as $customerId => $code) {
                    Customer::query()
                        ->where('tenant_id', $tenantId)
                        ->where('id', $customerId)
                        ->update(['code' => $code]);
                }
            });

            $total += count($codes);
            $this->info("Tenant #{$tenantId}: assigned codes to ".count($codes).' customers.');
        }

        $this->info("Done. Total customers backfilled: {$total}");

        return self::SUCCESS;
    }
}
