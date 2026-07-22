<?php

declare(strict_types=1);

namespace App\Enums;

enum CancelReason: string
{
    case CustomerCancel = 'customer_cancel';
    case RaceLost = 'race_lost';        // paid but lost the slot (docs/07 flow a)
    case OwnerCancel = 'owner_cancel';
    case NoShowPolicy = 'no_show_policy';
}
