<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Adds security response headers to every web response.
 *
 * Headers set:
 * - X-Frame-Options: DENY (prevent clickjacking via iframe)
 * - X-Content-Type-Options: nosniff (prevent MIME sniffing)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: disable camera/mic/geolocation
 * - Strict-Transport-Security: enforce HTTPS outside local/testing
 * - Content-Security-Policy: restrict resource origins
 *
 * CSP is environment-aware: local dev allows Vite HMR (ws://localhost:*),
 * prod is strict.
 */
final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        /** @var SymfonyResponse $response */
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=()'
        );

        if (! app()->environment('local', 'testing')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        $csp = $this->buildCsp();
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }

    private function buildCsp(): string
    {
        $isLocal = app()->environment('local', 'testing');

        $scriptSrc = "'self'";
        $styleSrc = "'self' 'unsafe-inline'";
        $fontSrc = "'self' data:";
        $connectSrc = "'self'";

        if ($isLocal) {
            // Vite dev server (various hostnames used in Docker/local)
            $viteOrigins = 'http://localhost:5173 http://127.0.0.1:5173 http://0.0.0.0:5173';
            $scriptSrc .= " {$viteOrigins} 'unsafe-inline'";
            $styleSrc .= " {$viteOrigins}";
            $fontSrc .= " {$viteOrigins}";
            $connectSrc .= ' ws://localhost:* ws://127.0.0.1:* ws://0.0.0.0:* http://localhost:* http://127.0.0.1:* http://0.0.0.0:*';
        }

        // External fonts (used in production)
        $fontSrc .= ' https://fonts.bunny.net';
        $styleSrc .= ' https://fonts.bunny.net';

        $directives = [
            "default-src 'self'",
            "script-src {$scriptSrc}",
            "style-src {$styleSrc}",
            "img-src 'self' data: blob:",
            "font-src {$fontSrc}",
            "connect-src {$connectSrc}",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        return implode('; ', $directives);
    }
}
