<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $connection = DB::connection('migrator');
        $role = (string) config('database.connections.pgsql.username');
        if (! preg_match('/\A[a-z_][a-z0-9_]{0,62}\z/', $role)) {
            throw new InvalidArgumentException('DB_RUNTIME_USERNAME must be a lowercase PostgreSQL role name.');
        }

        $quotedRole = $this->quoteIdentifier($role);

        $connection->unprepared(<<<'SQL'
            ALTER TABLE tenant_bank_config ADD CONSTRAINT tenant_bank_config_tenant_id_id_unique UNIQUE (tenant_id, id);
            ALTER TABLE bank_txn_inbox ADD CONSTRAINT bank_txn_inbox_tenant_id_id_unique UNIQUE (tenant_id, id);
            ALTER TABLE payments ADD CONSTRAINT payments_tenant_recipient_config_foreign
                FOREIGN KEY (tenant_id, recipient_bank_config_id)
                REFERENCES tenant_bank_config (tenant_id, id) NOT VALID;
            ALTER TABLE bank_txn_inbox ADD CONSTRAINT bank_txn_inbox_tenant_payment_foreign
                FOREIGN KEY (tenant_id, payment_id)
                REFERENCES payments (tenant_id, id) NOT VALID;
            ALTER TABLE bank_txn_inbox ADD CONSTRAINT bank_txn_inbox_payment_requires_tenant
                CHECK (payment_id IS NULL OR tenant_id IS NOT NULL) NOT VALID;
        SQL);

        // Webhooks must derive tenant context from the receiving account before RLS can apply.
        // The runtime role can execute this one lookup but cannot query this function as a table.
        $connection->unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION app_webhook_tenant_id(text, text)
            RETURNS bigint
            LANGUAGE sql
            STABLE
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
                SELECT tenant_id
                FROM tenant_bank_config
                WHERE provider = $1 AND account_number = $2
            $$;
            REVOKE ALL ON FUNCTION app_webhook_tenant_id(text, text) FROM PUBLIC;
        SQL);
        $connection->unprepared("GRANT EXECUTE ON FUNCTION app_webhook_tenant_id(text, text) TO {$quotedRole}");

        foreach (['tenant_bank_config', 'bank_txn_inbox'] as $table) {
            $quotedTable = $this->quoteIdentifier($table);
            $connection->unprepared("ALTER TABLE {$quotedTable} ENABLE ROW LEVEL SECURITY");
            $connection->unprepared("DROP POLICY IF EXISTS san_tenant_isolation ON {$quotedTable}");
            $connection->unprepared(
                "CREATE POLICY san_tenant_isolation ON {$quotedTable} FOR ALL TO {$quotedRole} USING (tenant_id = app_current_tenant_id()) WITH CHECK (tenant_id = app_current_tenant_id())"
            );
        }
    }

    public function down(): void
    {
        $connection = DB::connection('migrator');

        foreach (['tenant_bank_config', 'bank_txn_inbox'] as $table) {
            $quotedTable = $this->quoteIdentifier($table);
            $connection->unprepared("DROP POLICY IF EXISTS san_tenant_isolation ON {$quotedTable}");
            $connection->unprepared("ALTER TABLE {$quotedTable} DISABLE ROW LEVEL SECURITY");
        }

        $connection->unprepared(<<<'SQL'
            DROP FUNCTION IF EXISTS app_webhook_tenant_id(text, text);
            ALTER TABLE bank_txn_inbox DROP CONSTRAINT IF EXISTS bank_txn_inbox_payment_requires_tenant;
            ALTER TABLE bank_txn_inbox DROP CONSTRAINT IF EXISTS bank_txn_inbox_tenant_payment_foreign;
            ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_tenant_recipient_config_foreign;
            ALTER TABLE bank_txn_inbox DROP CONSTRAINT IF EXISTS bank_txn_inbox_tenant_id_id_unique;
            ALTER TABLE tenant_bank_config DROP CONSTRAINT IF EXISTS tenant_bank_config_tenant_id_id_unique;
        SQL);
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '"'.str_replace('"', '""', $identifier).'"';
    }
};
