<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Booking lifecycle state machine. A "hold" is a booking in `PendingDeposit` with a
 * `hold_expires_at`. Never use boolean flags (docs/11 #10).
 */
enum BookingStatus: string
{
    case PendingDeposit = 'pending_deposit';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    case Completed = 'completed';
    case NoShow = 'no_show';
}
