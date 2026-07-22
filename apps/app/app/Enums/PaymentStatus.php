<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Awaiting = 'awaiting';   // QR shown, waiting for transfer
    case Matched = 'matched';     // reconciled → booking confirmed
    case Orphaned = 'orphaned';   // paid but slot lost → refund owed
}
