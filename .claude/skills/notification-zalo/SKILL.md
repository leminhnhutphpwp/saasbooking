---
name: notification-zalo
description: Zalo ZNS notifications — confirmation, reminders, templates, retry, domain events
---

# Notification — Zalo ZNS

Sends booking confirmations and reminders via Zalo Official Account (OA) using Zalo Notification Service (ZNS). Email is a fallback channel. Notifications are async — queued via Horizon, retry on failure, isolated from booking lifecycle.

## Tables owned

| Table | Purpose |
|---|---|
| `notification_templates` | Pre-approved ZNS template content per tenant |
| `zalo_oa_config` | Per-tenant Zalo OA credentials (access token, template IDs) |

Notifications are **not** stored as rows — they are sent via Zalo API and logged in `audit_logs` for traceability.

## Notification flow

```
BookingConfirmed event (fired inside DB::transaction)
    │
    ▼
BookingConfirmedListener (ShouldQueue, afterCommit)
    │
    ▼
NotificationService::sendConfirmation($booking)
    │
    ├── Load zalo_oa_config for booking.tenant_id
    ├── Load notification_template for 'booking_confirmed'
    └── Call Zalo ZNS API (POST /v3/nsme-apps/...)

        On success → done
        On failure → retry (Horizon, max 3 attempts)
```

## Notification types

| Type | Trigger | When |
|---|---|---|
| `booking_confirmed` | `BookingConfirmed` event | Immediately after deposit confirmed |
| `booking_cancelled` | `BookingCancelled` event | Immediately after cancellation |
| `reminder_24h` | Scheduled job (`SendReminders`) | 24 hours before `booking_slots.start_at` |
| `reminder_2h` | Scheduled job (`SendReminders`) | 2 hours before `booking_slots.start_at` |

## Domain events (how notifications are triggered)

Notifications listen to domain events via queued listeners. This ensures:
- Notifications are async (do not block the booking transaction).
- Notifications are retried independently (a Zalo failure does not roll back the booking).
- The booking module does not know or care who listens.

```php
// EventServiceProvider.php
protected $listen = [
    BookingConfirmed::class => [
        BookingConfirmedListener::class,
    ],
    BookingCancelled::class => [
        BookingCancelledListener::class,
    ],
];
```

```php
// BookingConfirmedListener.php
class BookingConfirmedListener implements ShouldQueue
{
    use SerializesModels;

    public function handle(BookingConfirmed $event): void
    {
        app(NotificationService::class)->sendConfirmation($event->booking);
    }
}
```

## Scheduled reminders

```php
// Kernel.php (or routes/console.php)
$schedule->job(new SendReminders)->everyMinute();
```

`SendReminders` job:
1. Query `booking_slots` where `start_at` is within 24h or 2h from now.
2. Load `booking` + `customer` + `tenant.zalo_oa_config`.
3. Send reminder via `NotificationService::sendReminder($booking, $type)`.

## Zalo OA configuration

Each tenant configures their Zalo OA in the manager dashboard:

```php
ZaloOaConfig::forceCreate([
    'tenant_id' => $tenantId,
    'oa_id' => 'zalo-oa-id',
    'access_token' => 'encrypted-token',
    'refresh_token' => 'encrypted-refresh-token',
    'template_ids' => [
        'booking_confirmed' => 'template-id-1',
        'booking_cancelled' => 'template-id-2',
        'reminder_24h' => 'template-id-3',
        'reminder_2h' => 'template-id-4',
    ],
]);
```

## Retry mechanism

- Failed sends are retried via Horizon queue (max 3 attempts, exponential backoff).
- After 3 failures, the job is marked as `failed` and logged in `failed_jobs`.
- Operator can see failed notifications in the dashboard and retry manually.
- **Notification failure never rolls back the booking.** The booking is already confirmed.

## When to use

- Adding a new notification type (e.g. payment reminder, no-show warning).
- Debugging "notification not sent" → check Horizon logs, `zalo_oa_config`, template approval.
- Integrating a new channel (e.g. SMS, email) — add a new `NotificationChannel` implementation.
- Reviewing notification reliability → check `failed_jobs` table.

## Related docs

- `docs/08-thiet-ke-module-chi-tiet.md` §5 — notification module design
- `docs/07-luong-du-lieu.md` — notification flow in sequence diagrams
- `docs/11-diem-vo.md` — notification retry guarantees
