<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION app_reassign_primary_tenant_on_membership_delete()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                UPDATE users
                SET tenant_id = (
                    SELECT tenants.id
                    FROM memberships
                    INNER JOIN tenants ON tenants.id = memberships.tenant_id
                    WHERE memberships.user_id = OLD.user_id
                      AND tenants.status = 'active'
                      AND tenants.deleted_at IS NULL
                    ORDER BY memberships.created_at, memberships.id
                    LIMIT 1
                )
                WHERE id = OLD.user_id
                  AND tenant_id = OLD.tenant_id;

                RETURN OLD;
            END;
            $$;

            CREATE TRIGGER memberships_reassign_primary_tenant
            AFTER DELETE ON memberships
            FOR EACH ROW
            EXECUTE FUNCTION app_reassign_primary_tenant_on_membership_delete();
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS memberships_reassign_primary_tenant ON memberships');
        DB::unprepared('DROP FUNCTION IF EXISTS app_reassign_primary_tenant_on_membership_delete()');
    }
};
