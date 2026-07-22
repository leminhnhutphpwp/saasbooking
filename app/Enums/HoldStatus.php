<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Per-slot hold state. The exclusion constraint only blocks slots that are `holding` or
 * `committed`; a `released` slot frees its time range for someone else (docs/11 #2).
 */
enum HoldStatus: string
{
    case Holding = 'holding';
    case Committed = 'committed';
    case Released = 'released';
}
