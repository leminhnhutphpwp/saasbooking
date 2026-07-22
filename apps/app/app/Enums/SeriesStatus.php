<?php

declare(strict_types=1);

namespace App\Enums;

enum SeriesStatus: string
{
    case Active = 'active';
    case Ended = 'ended';
    case Cancelled = 'cancelled';
}
