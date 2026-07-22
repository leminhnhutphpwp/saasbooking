<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMode: string
{
    case Deposit = 'deposit';
    case Full = 'full';
    case Cash = 'cash';       // owner-booked walk-in, no VietQR deposit
}
