<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\BankTxnInbox;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentIngressTenantBoundaryTest extends TestCase
{
    use DatabaseMigrations;

    public function test_runtime_role_can_only_access_payment_ingress_rows_in_its_tenant_context(): void
    {
        $tenantA = Tenant::create(['name' => 'Venue A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $tenantB = Tenant::create(['name' => 'Venue B', 'slug' => 'venue-b', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $configA = TenantBankConfig::create([
            'tenant_id' => $tenantA->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => 'account-a', 'account_name' => 'Venue A', 'webhook_secret' => 'secret-a', 'active' => true,
        ]);
        $configB = TenantBankConfig::create([
            'tenant_id' => $tenantB->id, 'provider' => 'sepay', 'bank_bin' => '970422',
            'account_number' => 'account-b', 'account_name' => 'Venue B', 'webhook_secret' => 'secret-b', 'active' => true,
        ]);
        $inboxA = BankTxnInbox::create([
            'tenant_id' => $tenantA->id, 'provider' => 'sepay', 'bank_txn_id' => 'txn-a', 'amount' => 10_000, 'memo' => 'SAN-AAAAA',
        ]);
        $inboxB = BankTxnInbox::create([
            'tenant_id' => $tenantB->id, 'provider' => 'sepay', 'bank_txn_id' => 'txn-b', 'amount' => 10_000, 'memo' => 'SAN-BBBBB',
        ]);
        $runtime = DB::connection('pgsql');

        $this->assertSame(0, $runtime->table('tenant_bank_config')->count());
        $this->assertSame(0, $runtime->table('bank_txn_inbox')->count());
        $this->assertSame((string) $tenantA->id, (string) $runtime->scalar('SELECT app_webhook_tenant_id(?, ?)', ['sepay', 'account-a']));

        $runtime->transaction(function () use ($runtime, $tenantA, $configA, $configB, $inboxA, $inboxB): void {
            $runtime->select("SELECT set_config('app.tenant_id', ?, true)", [(string) $tenantA->id]);

            $this->assertSame([$configA->id], $runtime->table('tenant_bank_config')->pluck('id')->all());
            $this->assertSame([$inboxA->id], $runtime->table('bank_txn_inbox')->pluck('id')->all());
            $this->assertSame(0, $runtime->table('tenant_bank_config')->where('id', $configB->id)->update(['active' => false]));
            $this->assertSame(0, $runtime->table('bank_txn_inbox')->where('id', $inboxB->id)->update(['note' => 'cross tenant']));
        });
    }
}
