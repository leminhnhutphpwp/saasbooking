<?php

use App\Http\Controllers\Manager\BrandingController;
use App\Http\Controllers\Manager\CalendarController;
use App\Http\Controllers\Manager\CourtController;
use App\Http\Controllers\Manager\HomeController;
use App\Http\Controllers\Manager\OpeningRuleController;
use App\Http\Controllers\Manager\PricingRuleController;
use App\Http\Controllers\Manager\ReconcileController;
use App\Http\Controllers\Manager\RefundController;
use App\Http\Controllers\Manager\ReportController;
use App\Http\Controllers\Manager\SeriesController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Public\PublicBookingController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = request()->user();
    if ($user && $user->tenant_id) {
        return redirect()->route('manager.home');
    }

    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Manager console — court owner (tenant-scoped via WorkingTenant).
// Security (#7): auth alone is not enough — `can:access-manager` requires a tenant-bound owner.
Route::middleware(['auth', 'can:access-manager'])->prefix('manager')->name('manager.')->group(function () {
    Route::get('/home', [HomeController::class, 'index'])->name('home');

    Route::get('/courts', [CourtController::class, 'index'])->name('courts.index');
    Route::post('/courts', [CourtController::class, 'store'])->name('courts.store');
    Route::put('/courts/{court}', [CourtController::class, 'update'])->name('courts.update');
    Route::delete('/courts/{court}', [CourtController::class, 'destroy'])->name('courts.destroy');

    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::post('/calendar/walk-in', [CalendarController::class, 'storeWalkIn'])->name('calendar.walk-in');

    Route::get('/refunds', [RefundController::class, 'index'])->name('refunds.index');
    Route::post('/refunds/{refund}/done', [RefundController::class, 'markDone'])->name('refunds.done');

    Route::get('/series', [SeriesController::class, 'index'])->name('series.index');
    Route::post('/series', [SeriesController::class, 'store'])->name('series.store');
    Route::delete('/series/{series}', [SeriesController::class, 'destroy'])->name('series.destroy');

    Route::get('/courts/{court}/opening-rules', [OpeningRuleController::class, 'index'])->name('courts.opening-rules.index');
    Route::post('/courts/{court}/opening-rules', [OpeningRuleController::class, 'store'])->name('courts.opening-rules.store');
    Route::put('/courts/{court}/opening-rules/{openingRule}', [OpeningRuleController::class, 'update'])->name('courts.opening-rules.update');
    Route::delete('/courts/{court}/opening-rules/{openingRule}', [OpeningRuleController::class, 'destroy'])->name('courts.opening-rules.destroy');

    Route::get('/courts/{court}/pricing-rules', [PricingRuleController::class, 'index'])->name('courts.pricing-rules.index');
    Route::post('/courts/{court}/pricing-rules', [PricingRuleController::class, 'store'])->name('courts.pricing-rules.store');
    Route::put('/courts/{court}/pricing-rules/{pricingRule}', [PricingRuleController::class, 'update'])->name('courts.pricing-rules.update');
    Route::delete('/courts/{court}/pricing-rules/{pricingRule}', [PricingRuleController::class, 'destroy'])->name('courts.pricing-rules.destroy');

    Route::get('/branding', [BrandingController::class, 'edit'])->name('branding.edit');
    Route::post('/branding', [BrandingController::class, 'update'])->name('branding.update');

    Route::get('/reconcile', [ReconcileController::class, 'unmatched'])->name('reconcile.index');
    Route::post('/reconcile/match', [ReconcileController::class, 'manualMatch'])->name('reconcile.match');
    Route::post('/reconcile/{inbox}/dismiss', [ReconcileController::class, 'dismissTxn'])->name('reconcile.dismiss');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
});

// Public booking page (resolved by tenant slug — no auth).
// Security (#3): unauthenticated surface → throttle per IP + per venue.
Route::middleware('throttle:public-booking')->prefix('book')->name('public.')->group(function () {
    Route::get('/{tenant:slug}', [PublicBookingController::class, 'show'])->name('booking.show');
    Route::post('/{tenant:slug}/hold', [PublicBookingController::class, 'hold'])->name('booking.hold');
    Route::get('/{tenant:slug}/status/{code}', [PublicBookingController::class, 'status'])->name('booking.status');
});

require __DIR__.'/auth.php';
