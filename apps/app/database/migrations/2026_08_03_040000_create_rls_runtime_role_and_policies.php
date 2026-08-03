<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var list<string> */
    private array $tenantTables = [
        'audit_logs', 'resource_categories', 'courts', 'opening_rules', 'pricing_rules', 'blackouts',
        'customers', 'bookings', 'booking_slots', 'recurring_series', 'payments', 'refunds',
        'zalo_oa_configs', 'notification_messages',
    ];

    public function up(): void
    {
        $connection = DB::connection('migrator');
        $role = (string) config('database.connections.pgsql.username');
        if (! preg_match('/\A[a-z_][a-z0-9_]{0,62}\z/', $role)) {
            throw new InvalidArgumentException('DB_RUNTIME_USERNAME must be a lowercase PostgreSQL role name.');
        }

        if (! $connection->selectOne('SELECT 1 FROM pg_roles WHERE rolname = ?', [$role])) {
            $password = (string) config('database.connections.pgsql.password');
            if ($password === '') {
                throw new RuntimeException('DB_RUNTIME_PASSWORD is required to provision the RLS runtime role.');
            }

            // Production normally creates this login through secret management first. This fallback
            // makes a fresh Docker/test database usable when its migrator has CREATEROLE.
            $connection->unprepared(sprintf(
                'CREATE ROLE %s LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD %s',
                $this->quoteIdentifier($role),
                $connection->getPdo()->quote($password),
            ));
        }

        $connection->unprepared(sprintf('GRANT CONNECT ON DATABASE %s TO %s', $this->quoteIdentifier((string) config('database.connections.migrator.database')), $this->quoteIdentifier($role)));
        $connection->unprepared(sprintf('GRANT USAGE ON SCHEMA public TO %s', $this->quoteIdentifier($role)));

        foreach (array_merge($this->tenantTables, $this->globalRuntimeTables()) as $table) {
            $connection->unprepared(sprintf('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %s TO %s', $this->quoteIdentifier($table), $this->quoteIdentifier($role)));
        }
        $connection->unprepared(sprintf('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %s', $this->quoteIdentifier($role)));

        $connection->unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION app_current_tenant_id()
            RETURNS bigint
            LANGUAGE sql
            STABLE
            AS $$
                SELECT NULLIF(current_setting('app.tenant_id', true), '')::bigint
            $$;
        SQL);

        foreach ($this->tenantTables as $table) {
            $quotedTable = $this->quoteIdentifier($table);
            $connection->unprepared("ALTER TABLE {$quotedTable} ENABLE ROW LEVEL SECURITY");
            $connection->unprepared("DROP POLICY IF EXISTS san_tenant_isolation ON {$quotedTable}");
            $connection->unprepared(sprintf(
                'CREATE POLICY san_tenant_isolation ON %s FOR ALL TO %s USING (tenant_id = app_current_tenant_id()) WITH CHECK (tenant_id = app_current_tenant_id())',
                $quotedTable,
                $this->quoteIdentifier($role),
            ));
        }
    }

    public function down(): void
    {
        $connection = DB::connection('migrator');
        foreach ($this->tenantTables as $table) {
            $quotedTable = $this->quoteIdentifier($table);
            $connection->unprepared("DROP POLICY IF EXISTS san_tenant_isolation ON {$quotedTable}");
            $connection->unprepared("ALTER TABLE {$quotedTable} DISABLE ROW LEVEL SECURITY");
        }
        $connection->unprepared('DROP FUNCTION IF EXISTS app_current_tenant_id()');
    }

    /** @return list<string> */
    private function globalRuntimeTables(): array
    {
        return [
            'tenants', 'users', 'memberships', 'platform_services', 'tenant_bank_config', 'bank_txn_inbox',
            'roles', 'permissions', 'model_has_roles', 'model_has_permissions', 'role_has_permissions',
            'password_reset_tokens', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs',
        ];
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '"'.str_replace('"', '""', $identifier).'"';
    }
};
