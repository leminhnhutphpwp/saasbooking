<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankTxnInbox extends Model
{
    protected $table = 'bank_txn_inbox';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id', 'provider', 'bank_txn_id', 'account_number', 'amount', 'memo', 'payload', 'received_at', 'processed_at', 'note',
    ];

    protected $casts = [
        'amount' => 'integer',
        'payload' => 'array',
        'received_at' => 'datetime',
        'processed_at' => 'datetime',
    ];
}
