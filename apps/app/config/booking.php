<?php

declare(strict_types=1);

use App\Services\Booking\Drivers\ResourceTimeSlotDriver;

/**
 * Vertical dispatch registry (docs/08 §0). A tenant's `vertical` selects an inventory `mode`
 * (→ InventoryDriver), a pricing strategy, and a calendar UI component. Adding golf/spa =
 * add a row here + a driver, never edit the core.
 */
return [
    'hold_ttl_minutes' => 10,

    'series_horizon_weeks' => 4,

    'default_vertical' => 'racket_court',

    'verticals' => [
        'racket_court' => [
            'mode' => 'resource_time_slot',   // badminton / pickleball / tennis / futsal
            'ui' => 'CourtGrid',
        ],
        // 'golf' => ['mode' => 'capacity_session', 'ui' => 'TeeSheet'],   // 🚪 reserved door
        // 'spa'  => ['mode' => 'resource_time_slot', 'ui' => 'CourtGrid'], // 🚪 reserved door
    ],

    'modes' => [
        'resource_time_slot' => ResourceTimeSlotDriver::class,
        // 'capacity_session' => CapacitySessionDriver::class,   // 🚪 reserved door
    ],
];
