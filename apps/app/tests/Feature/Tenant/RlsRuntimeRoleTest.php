<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant;

use App\Models\Court;
use App\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RlsRuntimeRoleTest extends TestCase
{
    use DatabaseMigrations;

    public function test_runtime_role_enforces_tenant_context_and_cannot_bypass_rls(): void
    {
        $tenantA = Tenant::create(['name' => 'Venue A', 'slug' => 'venue-a', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $tenantB = Tenant::create(['name' => 'Venue B', 'slug' => 'venue-b', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $courtA = Court::forceCreate(['tenant_id' => $tenantA->id, 'name' => 'Court A', 'court_type' => 'pickleball', 'status' => 'active']);
        $courtB = Court::forceCreate(['tenant_id' => $tenantB->id, 'name' => 'Court B', 'court_type' => 'pickleball', 'status' => 'active']);
        $runtime = DB::connection('pgsql');

        $identity = $runtime->selectOne('SELECT current_user AS current_user, rolbypassrls FROM pg_roles WHERE rolname = current_user');
        $this->assertSame((string) config('database.connections.pgsql.username'), $identity->current_user);
        $this->assertFalse($identity->rolbypassrls);
        $this->assertSame(0, $runtime->table('courts')->count());

        try {
            $runtime->table('courts')->insert([
                'tenant_id' => $tenantA->id,
                'uuid' => (string) str()->uuid(),
                'name' => 'Denied without context',
                'court_type' => 'pickleball',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->fail('A runtime write without tenant context must be rejected by RLS.');
        } catch (QueryException) {
            // Expected: WITH CHECK rejects a row when app.tenant_id is absent.
        }

        $runtime->transaction(function () use ($runtime, $tenantA, $courtA, $courtB): void {
            $runtime->select("SELECT set_config('app.tenant_id', ?, true)", [(string) $tenantA->id]);
            $this->assertSame((string) $tenantA->id, $runtime->scalar("SELECT current_setting('app.tenant_id', true)"));
            $this->assertSame([$courtA->id], $runtime->table('courts')->pluck('id')->all());
            $this->assertSame(1, $runtime->table('courts')->where('id', $courtA->id)->update(['name' => 'Court A updated']));
            $this->assertSame(0, $runtime->table('courts')->where('id', $courtB->id)->update(['name' => 'cross tenant']));
        });

        $this->assertSame(0, $runtime->table('courts')->count());
        $this->assertSame('Court A updated', $courtA->fresh()->name);
        $this->assertSame('Court B', $courtB->fresh()->name);
    }
}
