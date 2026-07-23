<?php

use App\Http\Controllers\Webhook\BankReconcileController;
use Illuminate\Support\Facades\Route;

// Bank reconcile webhook (SePay). Stateless, no CSRF; auth is the per-tenant webhook token.
// Security (#3): throttle by source IP on top of the api group's default 'api' limiter.
Route::post('/webhooks/sepay', [BankReconcileController::class, 'sepay'])
    ->middleware('throttle:webhook')
    ->name('webhooks.sepay');
