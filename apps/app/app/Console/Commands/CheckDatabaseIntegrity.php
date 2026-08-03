<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class CheckDatabaseIntegrity extends Command
{
    protected $signature = 'db:preflight-integrity';

    protected $description = 'Read-only preflight for T09 database integrity constraint validation';

    /** @var array<string, string> */
    private const CHECKS = [
        'pricing_rules_price_per_hour_nonnegative' => 'SELECT p.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM pricing_rules p JOIN tenants t ON t.id = p.tenant_id WHERE p.price_per_hour < 0 GROUP BY p.tenant_id, t.slug',
        'bookings_total_amount_nonnegative' => 'SELECT b.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM bookings b JOIN tenants t ON t.id = b.tenant_id WHERE b.total_amount < 0 GROUP BY b.tenant_id, t.slug',
        'bookings_deposit_amount_nonnegative' => 'SELECT b.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM bookings b JOIN tenants t ON t.id = b.tenant_id WHERE b.deposit_amount < 0 GROUP BY b.tenant_id, t.slug',
        'booking_slots_price_snapshot_nonnegative' => 'SELECT s.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM booking_slots s JOIN tenants t ON t.id = s.tenant_id WHERE s.price_snapshot < 0 GROUP BY s.tenant_id, t.slug',
        'recurring_series_price_per_session_nonnegative' => 'SELECT s.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM recurring_series s JOIN tenants t ON t.id = s.tenant_id WHERE s.price_per_session_snapshot < 0 GROUP BY s.tenant_id, t.slug',
        'recurring_series_deposit_per_session_nonnegative' => 'SELECT s.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM recurring_series s JOIN tenants t ON t.id = s.tenant_id WHERE s.deposit_per_session < 0 GROUP BY s.tenant_id, t.slug',
        'payments_amount_nonnegative' => 'SELECT p.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM payments p JOIN tenants t ON t.id = p.tenant_id WHERE p.amount < 0 GROUP BY p.tenant_id, t.slug',
        'refunds_amount_nonnegative' => 'SELECT r.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM refunds r JOIN tenants t ON t.id = r.tenant_id WHERE r.amount < 0 GROUP BY r.tenant_id, t.slug',
        'bank_txn_inbox_amount_nonnegative' => 'SELECT b.tenant_id, COALESCE(t.slug, \'unattributed\') AS tenant_slug, COUNT(*) AS violations FROM bank_txn_inbox b LEFT JOIN tenants t ON t.id = b.tenant_id WHERE b.amount < 0 GROUP BY b.tenant_id, t.slug',
        'booking_slots_time_order' => 'SELECT s.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM booking_slots s JOIN tenants t ON t.id = s.tenant_id WHERE s.start_at >= s.end_at GROUP BY s.tenant_id, t.slug',
        'blackouts_time_order' => 'SELECT b.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM blackouts b JOIN tenants t ON t.id = b.tenant_id WHERE b.starts_at >= b.ends_at GROUP BY b.tenant_id, t.slug',
        'refunds_tenant_payment_id_foreign' => 'SELECT r.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM refunds r JOIN tenants t ON t.id = r.tenant_id LEFT JOIN payments p ON p.id = r.payment_id AND p.tenant_id = r.tenant_id WHERE p.id IS NULL GROUP BY r.tenant_id, t.slug',
        'refunds_total_amount_within_payment' => 'SELECT r.tenant_id, t.slug AS tenant_slug, COUNT(*) AS violations FROM (SELECT tenant_id, payment_id, SUM(amount) AS refunded_amount FROM refunds GROUP BY tenant_id, payment_id) r JOIN tenants t ON t.id = r.tenant_id JOIN payments p ON p.id = r.payment_id AND p.tenant_id = r.tenant_id WHERE r.refunded_amount > p.amount GROUP BY r.tenant_id, t.slug',
    ];

    /** @var list<string> */
    private const TRIGGERS = [
        'payments_amount_immutable',
        'refunds_total_amount_within_payment',
    ];

    public function handle(): int
    {
        $this->info('Auditing all tenant rows. This command performs no writes.');

        try {
            $violations = $this->findViolations();
            $triggerProblems = $this->findTriggerProblems();
        } catch (Throwable $exception) {
            $this->error('Preflight could not complete: '.$exception->getMessage());

            return self::FAILURE;
        }

        foreach ($violations as $violation) {
            $this->error(sprintf(
                '%s: tenant #%s (%s), %s violation(s)',
                $violation['check'],
                $violation['tenant_id'] ?? 'unattributed',
                $violation['tenant_slug'],
                $violation['violations'],
            ));
        }

        foreach ($triggerProblems as $trigger) {
            $this->error("{$trigger}: trigger is missing or disabled");
        }

        if ($violations !== [] || $triggerProblems !== []) {
            $this->error('Integrity preflight failed. Repair data or restore the trigger, then run this command again.');

            return self::FAILURE;
        }

        $this->info('No integrity violations found across all tenants. Both T09 triggers are enabled.');
        $this->line('Payment amount immutability is verified by trigger status; prior updates cannot be inferred from current rows.');

        return self::SUCCESS;
    }

    /** @return list<array{check: string, tenant_id: int|null, tenant_slug: string, violations: int}> */
    private function findViolations(): array
    {
        $violations = [];

        foreach (self::CHECKS as $check => $sql) {
            foreach (DB::select($sql) as $row) {
                $violations[] = [
                    'check' => $check,
                    'tenant_id' => $row->tenant_id === null ? null : (int) $row->tenant_id,
                    'tenant_slug' => (string) $row->tenant_slug,
                    'violations' => (int) $row->violations,
                ];
            }
        }

        return $violations;
    }

    /** @return list<string> */
    private function findTriggerProblems(): array
    {
        $triggers = DB::select(
            'SELECT tgname, tgenabled
             FROM pg_trigger
             JOIN pg_class ON pg_class.oid = pg_trigger.tgrelid
             JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
             WHERE pg_namespace.nspname = current_schema()
               AND pg_class.relname IN (\'payments\', \'refunds\')
               AND tgname IN (?, ?)
               AND NOT tgisinternal',
            self::TRIGGERS,
        );

        $enabled = [];
        foreach ($triggers as $trigger) {
            if (in_array($trigger->tgenabled, ['O', 'A'], true)) {
                $enabled[] = $trigger->tgname;
            }
        }

        return array_values(array_diff(self::TRIGGERS, $enabled));
    }
}
