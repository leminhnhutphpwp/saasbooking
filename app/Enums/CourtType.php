<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Court sport. All racket sports share ONE inventory shape (resource-time-slot); this is
 * only a label + pricing/branding difference — it never changes the engine (docs/08 §0).
 */
enum CourtType: string
{
    case CauLong = 'cau_long';
    case Pickleball = 'pickleball';
    case Khac = 'khac';

    public function label(): string
    {
        return match ($this) {
            self::CauLong => 'Cầu lông',
            self::Pickleball => 'Pickleball',
            self::Khac => 'Khác',
        };
    }
}
