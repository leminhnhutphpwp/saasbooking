# Database Integrity Validation Preflight

T09 installs new PostgreSQL checks and a composite refund-payment foreign key as `NOT VALID`. They protect new writes immediately, but PostgreSQL will not check historical rows until an operator validates them. Do not validate until the preflight is clean.

## Safe Execution

Run this after deploying the T09 migration, using the production application container and its normal database connection:

```bash
docker compose exec app php artisan db:preflight-integrity
```

The command is read-only. It intentionally audits rows for every tenant and reports only the constraint/trigger name, tenant ID/slug, and violation count. It never prints bank account numbers, bank transaction IDs, payment memos, raw payloads, or row contents.

Exit code `0` means no current violations were found and both T09 triggers are enabled. A nonzero exit means do not validate: repair the reported historical data through an approved, separately reviewed procedure, then rerun the command. Payment amount immutability is checked by confirming its trigger is enabled; prior amount changes cannot be derived from current row values.

## Manual Validation

Only after a clean report, run the following manually in `psql` against production. This is deliberately not a migration or artisan command.

```sql
ALTER TABLE pricing_rules VALIDATE CONSTRAINT pricing_rules_price_per_hour_nonnegative;
ALTER TABLE bookings VALIDATE CONSTRAINT bookings_total_amount_nonnegative;
ALTER TABLE bookings VALIDATE CONSTRAINT bookings_deposit_amount_nonnegative;
ALTER TABLE booking_slots VALIDATE CONSTRAINT booking_slots_price_snapshot_nonnegative;
ALTER TABLE recurring_series VALIDATE CONSTRAINT recurring_series_price_per_session_nonnegative;
ALTER TABLE recurring_series VALIDATE CONSTRAINT recurring_series_deposit_per_session_nonnegative;
ALTER TABLE payments VALIDATE CONSTRAINT payments_amount_nonnegative;
ALTER TABLE refunds VALIDATE CONSTRAINT refunds_amount_nonnegative;
ALTER TABLE bank_txn_inbox VALIDATE CONSTRAINT bank_txn_inbox_amount_nonnegative;
ALTER TABLE booking_slots VALIDATE CONSTRAINT booking_slots_time_order;
ALTER TABLE blackouts VALIDATE CONSTRAINT blackouts_time_order;
ALTER TABLE refunds VALIDATE CONSTRAINT refunds_tenant_payment_id_foreign;
```

The payment-amount and cumulative-refund rules are triggers, so PostgreSQL has no `VALIDATE CONSTRAINT` statement for them. The preflight checks the current refund total and confirms both triggers are enabled. Do not disable triggers or add automated repair logic as part of this rollout.
