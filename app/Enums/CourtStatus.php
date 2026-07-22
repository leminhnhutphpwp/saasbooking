<?php

declare(strict_types=1);

namespace App\Enums;

enum CourtStatus: string
{
    case Active = 'active';
    case Maintenance = 'maintenance';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Đang hoạt động',
            self::Maintenance => 'Bảo trì',
            self::Archived => 'Đã lưu trữ',
        };
    }
}
