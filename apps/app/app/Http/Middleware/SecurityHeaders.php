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

        $csp = $this->buildCsp();
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }

    private function buildCsp(): string
    {
        $isLocal = app()->environment('local', 'testing');

        $connectSrc = "'self'";
        if ($isLocal) {
            // Vite HMR uses WebSocket
            $connectSrc = "'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*";
        }

        $directives = [
            "default-src 'self'",
            "script-src 'self'",
            // Tailwind + Inertia require inline styles and occasionally inline scripts
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src {$connectSrc}",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        return implode('; ', $directives);
    }
}
