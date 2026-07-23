<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Two structured columns for the reconcile queue.
 *
 * `payment_id` — links a bank txn to the deposit it paid so the manual-reconcile queue keeps the
 * linkage the owner needs. Previously ReconcileService::markUnmatched accepted $paymentId (e.g. an
 * underpayment) but never persisted it, losing the connection between the money and the booking
 * (finding #8). Nullable + FK to payments, nullOnDelete (the raw txn is the reconcile source of
 * truth and must outlive a deleted payment).
 *
 * `status` — makes the reconcile state machine explicit (pending / matched / orphaned / unmatched /
 * dismissed) so the owner-action query filters on a real column instead of `note NOT LIKE '...'`
 * on free text — which dropped rows where note IS NULL (NULL NOT LIKE → not true) and let
 * manually-matched txns reappear (finding #4). `note` stays as a human-readable annotation only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bank_txn_inbox', function (Blueprint $table) {
            $table->foreignId('payment_id')->nullable()->after('account_number')
                ->constrained('payments')->nullOnDelete();
            $table->string('status')->default('pending')->after('processed_at');
            $table->index('status');
        });

        // Backfill existing rows so the state machine is consistent with the old note conventions.
        DB::table('bank_txn_inbox')->where('note', 'Dismissed by owner')->update(['status' => 'dismissed']);
        DB::table('bank_txn_inbox')->where('note', 'Manual match by owner')->update(['status' => 'matched']);
        DB::table('bank_txn_inbox')
            ->whereNotNull('processed_at')
            ->whereNotNull('note')
            ->whereNotIn('note', ['Dismissed by owner', 'Manual match by owner'])
            ->update(['status' => 'unmatched']);   // prior markUnmatched rows carried a reason note
    }

    public function down(): void
    {
        Schema::table('bank_txn_inbox', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropConstrainedForeignId('payment_id');
            $table->dropColumn('status');
        });
    }
};
