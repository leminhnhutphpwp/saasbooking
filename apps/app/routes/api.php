<?php

use App\Http\Controllers\Webhook\BankReconcileController;
use Illuminate\Support\Facades\Route;

// Bank reconcile webhook (SePay). Stateless, no CSRF; auth is the per-tenant webhook token.
Route::post('/webhooks/sepay', [BankReconcileController::class, 'sepay'])->name('webhooks.sepay');
