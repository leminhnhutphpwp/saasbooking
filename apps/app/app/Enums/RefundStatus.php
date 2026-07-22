<?php

declare(strict_types=1);

namespace App\Enums;

enum RefundStatus: string
{
    case Requested = 'requested';
    case Done = 'done';
    case Failed = 'failed';
}
