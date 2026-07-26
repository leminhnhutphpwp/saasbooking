<?php

declare(strict_types=1);

/**
 * Zalo ZNS (Zalo Notification Service) configuration.
 *
 * The HTTP transport posts to https://business.openapi.zalo.me/message/template
 * using the OA access_token. When the token expires (403), the app logs a warning
 * and falls back to the log transport (so the notification is still recorded, just
 * not sent — an operator must refresh the token manually and re-send).
 *
 * Driver: 'log' (default in local/testing) records only; 'http' posts to Zalo.
 * Set ZALO_DRIVER=http in production after obtaining OA credentials.
 */
return [
    'driver' => env('ZALO_DRIVER', 'log'),

    'oa' => [
        'id' => env('ZALO_OA_ID'),
        'secret' => env('ZALO_OA_SECRET'),
        'access_token' => env('ZALO_OA_ACCESS_TOKEN'),
        'refresh_token' => env('ZALO_OA_REFRESH_TOKEN'),
    ],

    'api' => [
        'base_url' => 'https://business.openapi.zalo.me',
        'send_endpoint' => '/message/template',
    ],

    'template_ids' => [
        'booking_confirmation' => env('ZALO_TEMPLATE_CONFIRMATION', 'booking_confirmation'),
        'booking_reminder' => env('ZALO_TEMPLATE_REMINDER', 'booking_reminder'),
        'payment_received' => env('ZALO_TEMPLATE_PAYMENT', 'payment_received'),
    ],
];
