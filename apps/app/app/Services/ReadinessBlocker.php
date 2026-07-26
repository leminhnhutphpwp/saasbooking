<?php

declare(strict_types=1);

namespace App\Services;

/**
 * A single readiness blocker — an actionable item the venue owner must resolve.
 *
 * @param  string  $code  Machine-readable blocker code (e.g. 'no_active_court')
 * @param  string  $message  Vietnamese user-facing message
 * @param  string  $action  Route/identifier linking to the resolution page
 */
final readonly class ReadinessBlocker
{
    public function __construct(
        public string $code,
        public string $message,
        public string $action,
    ) {}
}
