<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * @deprecated Legacy court sport type — kept for historical compatibility only.
 *
 * New code should use `ResourceCategory` (tenant-scoped catalog) instead.
 * This enum is retained until all callers have migrated to the resource_category FK.
 * See ADR-001 §Migration Contract for the deprecation plan.
 *
 * All racket sports share ONE inventory shape (resource-time-slot); this is
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
