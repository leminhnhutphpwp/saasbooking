<?php

use App\Http\Controllers\Manager\CourtController;
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
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Manager console — court owner / staff (tenant-scoped via WorkingTenant).
Route::middleware('auth')->prefix('manager')->name('manager.')->group(function () {
    Route::get('/courts', [CourtController::class, 'index'])->name('courts.index');
    Route::post('/courts', [CourtController::class, 'store'])->name('courts.store');
    Route::put('/courts/{court}', [CourtController::class, 'update'])->name('courts.update');
    Route::delete('/courts/{court}', [CourtController::class, 'destroy'])->name('courts.destroy');
});

// Public booking page (resolved by tenant slug — no auth).
Route::prefix('book')->name('public.')->group(function () {
    Route::get('/{tenant:slug}', [PublicBookingController::class, 'show'])->name('booking.show');
    Route::post('/{tenant:slug}/hold', [PublicBookingController::class, 'hold'])->name('booking.hold');
    Route::get('/{tenant:slug}/status/{code}', [PublicBookingController::class, 'status'])->name('booking.status');
});

require __DIR__.'/auth.php';
