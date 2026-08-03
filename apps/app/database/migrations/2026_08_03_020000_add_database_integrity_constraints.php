<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // NOT VALID preserves rollout compatibility with existing rows while protecting all new writes.
        DB::unprepared(<<<'SQL'
            ALTER TABLE pricing_rules ADD CONSTRAINT pricing_rules_price_per_hour_nonnegative CHECK (price_per_hour >= 0) NOT VALID;
            ALTER TABLE bookings ADD CONSTRAINT bookings_total_amount_nonnegative CHECK (total_amount >= 0) NOT VALID;
            ALTER TABLE bookings ADD CONSTRAINT bookings_deposit_amount_nonnegative CHECK (deposit_amount >= 0) NOT VALID;
            ALTER TABLE booking_slots ADD CONSTRAINT booking_slots_price_snapshot_nonnegative CHECK (price_snapshot >= 0) NOT VALID;
            ALTER TABLE recurring_series ADD CONSTRAINT recurring_series_price_per_session_nonnegative CHECK (price_per_session_snapshot >= 0) NOT VALID;
            ALTER TABLE recurring_series ADD CONSTRAINT recurring_series_deposit_per_session_nonnegative CHECK (deposit_per_session >= 0) NOT VALID;
            ALTER TABLE payments ADD CONSTRAINT payments_amount_nonnegative CHECK (amount >= 0) NOT VALID;
            ALTER TABLE refunds ADD CONSTRAINT refunds_amount_nonnegative CHECK (amount >= 0) NOT VALID;
            ALTER TABLE bank_txn_inbox ADD CONSTRAINT bank_txn_inbox_amount_nonnegative CHECK (amount >= 0) NOT VALID;
            ALTER TABLE booking_slots ADD CONSTRAINT booking_slots_time_order CHECK (start_at < end_at) NOT VALID;
            ALTER TABLE blackouts ADD CONSTRAINT blackouts_time_order CHECK (starts_at < ends_at) NOT VALID;
        SQL);

        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_tenant_id_id_unique UNIQUE (tenant_id, id)');
        DB::statement('ALTER TABLE refunds ADD CONSTRAINT refunds_tenant_payment_id_foreign FOREIGN KEY (tenant_id, payment_id) REFERENCES payments (tenant_id, id) ON DELETE CASCADE NOT VALID');

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION prevent_payment_amount_change()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                IF NEW.amount IS DISTINCT FROM OLD.amount THEN
                    RAISE EXCEPTION 'payments.amount is immutable; create a refund ledger row instead'
                        USING ERRCODE = '23514', CONSTRAINT = 'payments_amount_immutable';
                END IF;

                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER payments_amount_immutable
            BEFORE UPDATE OF amount ON payments
            FOR EACH ROW EXECUTE FUNCTION prevent_payment_amount_change();

            CREATE OR REPLACE FUNCTION enforce_refund_total_within_payment()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            DECLARE
                payment_amount bigint;
                refunded_amount bigint;
            BEGIN
                -- Locking the parent serializes concurrent refund requests for the same payment.
                SELECT amount INTO payment_amount
                FROM payments
                WHERE tenant_id = NEW.tenant_id AND id = NEW.payment_id
                FOR UPDATE;

                -- Let the composite foreign key report a missing or cross-tenant payment reference.
                IF NOT FOUND THEN
                    RETURN NEW;
                END IF;

                SELECT COALESCE(SUM(amount), 0) INTO refunded_amount
                FROM refunds
                WHERE tenant_id = NEW.tenant_id
                    AND payment_id = NEW.payment_id
                    AND id IS DISTINCT FROM NEW.id;

                IF refunded_amount + NEW.amount > payment_amount THEN
                    RAISE EXCEPTION 'cumulative refunds cannot exceed the original payment amount'
                        USING ERRCODE = '23514', CONSTRAINT = 'refunds_total_amount_within_payment';
                END IF;

                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER refunds_total_amount_within_payment
            BEFORE INSERT OR UPDATE OF tenant_id, payment_id, amount ON refunds
            FOR EACH ROW EXECUTE FUNCTION enforce_refund_total_within_payment();
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TRIGGER IF EXISTS refunds_total_amount_within_payment ON refunds;
            DROP FUNCTION IF EXISTS enforce_refund_total_within_payment();
            DROP TRIGGER IF EXISTS payments_amount_immutable ON payments;
            DROP FUNCTION IF EXISTS prevent_payment_amount_change();
            ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_tenant_payment_id_foreign;
            ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_tenant_id_id_unique;
            ALTER TABLE bank_txn_inbox DROP CONSTRAINT IF EXISTS bank_txn_inbox_amount_nonnegative;
            ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_amount_nonnegative;
            ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_nonnegative;
            ALTER TABLE recurring_series DROP CONSTRAINT IF EXISTS recurring_series_deposit_per_session_nonnegative;
            ALTER TABLE recurring_series DROP CONSTRAINT IF EXISTS recurring_series_price_per_session_nonnegative;
            ALTER TABLE booking_slots DROP CONSTRAINT IF EXISTS booking_slots_time_order;
            ALTER TABLE booking_slots DROP CONSTRAINT IF EXISTS booking_slots_price_snapshot_nonnegative;
            ALTER TABLE blackouts DROP CONSTRAINT IF EXISTS blackouts_time_order;
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_deposit_amount_nonnegative;
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_total_amount_nonnegative;
            ALTER TABLE pricing_rules DROP CONSTRAINT IF EXISTS pricing_rules_price_per_hour_nonnegative;
        SQL);
    }
};
