<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a hold loses the race for a court+time — the Postgres exclusion constraint
 * (SQLSTATE 23P01) is the arbiter, never a check-then-act in PHP (docs/11 #2, #6). Rendered
 * as HTTP 409.
 */
class SlotTakenException extends RuntimeException
{
    public function __construct(string $message = 'Khung giờ này vừa có người giữ.')
    {
        parent::__construct($message);
    }

    public function getStatusCode(): int
    {
        return 409;
    }
}
