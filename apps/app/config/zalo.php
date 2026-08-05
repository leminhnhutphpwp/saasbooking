<?php

declare(strict_types=1);

/**
 * Zalo ZNS (Zalo Notification Service) configuration.
 *
 * The HTTP transport posts to https://business.openapi.zalo.me/message/template
 * using the encrypted OA access token and approved template mapping from each tenant's
 * `zalo_oa_configs` record. No OA credentials or template IDs are global runtime config.
 *
 * Driver: 'log' (default in local/testing) records only; 'http' posts to Zalo.
 * Set ZALO_DRIVER=http in production only after tenant configuration is complete.
 */
return [
    'driver' => env('ZALO_DRIVER', 'log'),

    'api' => [
        'base_url' => 'https://business.openapi.zalo.me',
        'send_endpoint' => '/message/template',
        'timeout_seconds' => 10,
    ],
];
