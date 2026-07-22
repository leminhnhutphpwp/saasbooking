<?php

declare(strict_types=1);

namespace App\Enums;

enum BookingChannel: string
{
    case Zalo = 'zalo';               // player self-booking
    case OwnerManual = 'owner_manual'; // owner books on behalf of a walk-in
}
