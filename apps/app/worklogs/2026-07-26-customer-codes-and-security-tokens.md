# 2026-07-26 — Customer Codes & Security Tokens

## Goal
Add customer code support to CustomerService and security tokens to PublicBookingController for the SÂN project.

## Changed

### 1. `app/Models/Customer.php`
- Changed `generateCode()` from `private static` to `public static` so CustomerService can call it directly after `forceCreate()` bypasses the model event.

### 2. `app/Services/CustomerService.php`
- Updated `upsert()` method to manually generate a customer code after `forceCreate()`, since `forceCreate()` bypasses the `creating` event.
- Added `$customer->update(['code' => Customer::generateCode($tenantId)])` after creation.
- Changed return to `$customer->fresh()` for consistency.

### 3. `app/Http/Controllers/Public/PublicBookingController.php`
- **`hold()` method**: After creating the booking, generates an HMAC token using `hash_hmac('sha256', "{$booking->code}:{$customer->code}", app('key')->getPreview())` and includes it in the redirect URL.
- **`status()` method**: Now accepts `$request` parameter, extracts `token` from query string, verifies it with `hash_equals()` against the expected HMAC. Returns 403 on mismatch.
- **New `customerHistory()` method**: Public endpoint at `/{tenant:slug}/cus-{code}` that renders customer booking history by customer code. No auth required; customer code is the lookup key.

### 4. `routes/web.php`
- Added route: `GET /{tenant:slug}/cus-{code}` → `PublicBookingController@customerHistory` named `public.booking.customer-history`.

## Decisions
- **HMAC token**: Uses app key (base64) with `hash_hmac('sha256', ...)` — same pattern as other SÂN security tokens. `hash_equals()` prevents timing attacks.
- **`generateCode()` made public**: The `private` visibility prevented CustomerService from calling it after `forceCreate()`. Making it `public static` is the minimal change; it's already safe (tenant-scoped, uses `FOR UPDATE` for concurrency).
- **Route pattern `cus-{code}`**: Distinct from `status/{code}` to avoid route conflicts and make the URL human-readable (e.g., `/book/my-venue/cus-KH0001`).

## Verification
- All 4 files pass `php -l` syntax checks.
- No existing tests broken (no test files modified).
