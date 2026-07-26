<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\ZaloZnsTransport;
use App\Events\BookingConfirmed;
use App\Listeners\SendBookingConfirmation;
use App\Models\User;
use App\Services\Notification\HttpZaloZnsTransport;
use App\Services\Notification\LogZaloZnsTransport;
use App\Support\WorkingTenant;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Rate-limit budgets (per minute). Kept as named constants — not inline magic numbers —
     * so the public-surface throttle policy lives in one place (security finding #3).
     */
    private const API_PER_MINUTE = 60;

    private const PUBLIC_BOOKING_PER_IP = 30;

    private const PUBLIC_BOOKING_PER_TENANT = 120;

    private const WEBHOOK_PER_MINUTE = 60;

    public function register(): void
    {
        // ZNS transport: configurable via ZALO_DRIVER env var (default: 'log')
        // 'log' = record only (dev/testing), 'http' = send via Zalo Business API (production)
        $driver = config('zalo.driver', 'log');
        $transport = $driver === 'http' ? HttpZaloZnsTransport::class : LogZaloZnsTransport::class;
        $this->app->bind(ZaloZnsTransport::class, $transport);
    }

    public function boot(): void
    {
        // Defense-in-depth (audit #10): outside production, throw loudly if any code tries to
        // mass-assign an attribute that isn't in $fillable (e.g. a future create($request->all())
        // slipping tenant_id/status/price through) instead of silently dropping it. Production stays
        // lenient so an edge case can't 500 a live booking.
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        Vite::prefetch(concurrency: 3);

        Event::listen(BookingConfirmed::class, SendBookingConfirmation::class);

        $this->registerRateLimiters();
        $this->registerGates();
    }

    /**
     * Throttle every public / unauthenticated surface (finding #3). The public booking page and
     * the bank webhook are reachable without a session, so they get conservative per-IP budgets
     * plus a per-venue budget for the booking page.
     */
    private function registerRateLimiters(): void
    {
        // General fallback for the api middleware group.
        RateLimiter::for('api', fn (Request $request): Limit => Limit::perMinute(self::API_PER_MINUTE)
            ->by($request->user()?->id ?: (string) $request->ip()));

        // Public booking page (show / hold / status): clamp per client IP AND per venue slug so
        // one noisy IP or one hammered venue can't exhaust the shared surface.
        RateLimiter::for('public-booking', fn (Request $request): array => [
            Limit::perMinute(self::PUBLIC_BOOKING_PER_IP)->by('ip:'.$request->ip()),
            Limit::perMinute(self::PUBLIC_BOOKING_PER_TENANT)->by('tenant:'.(string) $request->route('tenant')),
        ]);

        // Bank reconcile webhook (SePay). No route-level tenant param (tenant is in the payload
        // token), so clamp by source IP.
        RateLimiter::for('webhook', fn (Request $request): Limit => Limit::perMinute(self::WEBHOOK_PER_MINUTE)
            ->by('ip:'.$request->ip()));
    }

    /**
     * Manager-console gate (finding #7): the console is owner-only. A user must be bound to a
     * tenant AND hold the 'owner' role. Applied as `can:access-manager` on the /manager group.
     */
    private function registerGates(): void
    {
        Gate::define('access-manager', function (User $user): bool {
            $tenantId = WorkingTenant::id(request());
            if (! $tenantId || ! $user->hasRole('owner')) {
                return false;
            }

            $membership = $user->tenants()->whereKey($tenantId)->first();
            if ($membership) {
                return $membership->pivot->role === 'owner';
            }

            return (int) $user->tenant_id === $tenantId;
        });
    }
}
