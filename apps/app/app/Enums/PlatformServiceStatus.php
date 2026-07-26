<?php

declare(strict_types=1);

namespace App\Enums;

enum PlatformServiceStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}
