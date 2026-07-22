<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case VietQr = 'vietqr';
    case Cash = 'cash';   // owner-recorded walk-in
}
