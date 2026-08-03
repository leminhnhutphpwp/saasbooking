<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Enums\CancelReason;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Tenant;
use App\Services\Booking\BookingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PublicBookingCancellationController extends Controller
{
    public function __construct(private BookingService $bookings) {}

    public function __invoke(Tenant $tenant, string $code, Request $request): RedirectResponse
    {
        abort_unless($tenant->isActive(), 404);

        $booking = Booking::with('customer')
            ->where('tenant_id', $tenant->id)
            ->where('code', $code)
            ->firstOrFail();
        $token = (string) $request->query('token');
        $expected = hash_hmac('sha256', "{$code}:{$booking->customer->code}", config('app.key'));
        abort_unless($token !== '' && hash_equals($expected, $token), 403);

        $this->bookings->cancel($booking, CancelReason::CustomerCancel);

        return redirect()->route('public.booking.status', [
            'tenant' => $tenant->slug,
            'code' => $booking->code,
            'token' => $token,
        ]);
    }
}
