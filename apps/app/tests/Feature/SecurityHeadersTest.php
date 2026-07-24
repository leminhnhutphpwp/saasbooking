<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    private TestResponse $response;

    protected function setUp(): void
    {
        parent::setUp();
        // Hit a route that does not require auth (login page).
        $this->response = $this->get('/login');
    }

    public function test_sets_x_frame_options_to_deny(): void
    {
        $this->assertSame('DENY', $this->response->headers->get('X-Frame-Options'));
    }

    public function test_sets_x_content_type_options_to_nosniff(): void
    {
        $this->assertSame('nosniff', $this->response->headers->get('X-Content-Type-Options'));
    }

    public function test_sets_referrer_policy(): void
    {
        $this->assertSame(
            'strict-origin-when-cross-origin',
            $this->response->headers->get('Referrer-Policy'),
        );
    }

    public function test_sets_permissions_policy(): void
    {
        $policy = $this->response->headers->get('Permissions-Policy');
        $this->assertStringContainsString('camera=()', $policy);
        $this->assertStringContainsString('microphone=()', $policy);
        $this->assertStringContainsString('geolocation=()', $policy);
    }

    public function test_sets_content_security_policy(): void
    {
        $csp = $this->response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("script-src 'self'", $csp);
        $this->assertStringContainsString("style-src 'self' 'unsafe-inline'", $csp);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringContainsString("form-action 'self'", $csp);
    }

    public function test_includes_vite_hmr_origins_in_local_env(): void
    {
        $csp = $this->response->headers->get('Content-Security-Policy');
        // In testing env (treated as local), CSP should allow Vite WS
        $this->assertStringContainsString('ws://localhost:*', $csp);
    }
}
