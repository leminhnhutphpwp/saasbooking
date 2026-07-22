<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Forces an audit actor id for background work (queue jobs, reconcile/reminder) where
 * `Auth::id()` is null — attribute the change to the user who triggered the job.
 */
final class AuditActor
{
    private static ?int $id = null;

    /** Run $callback with a forced actor id, restoring the previous one afterwards. */
    public static function runAs(?int $userId, callable $callback): mixed
    {
        $previous = self::$id;
        self::$id = $userId;

        try {
            return $callback();
        } finally {
            self::$id = $previous;
        }
    }

    public static function id(): ?int
    {
        return self::$id;
    }
}
