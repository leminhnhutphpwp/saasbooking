<?php

declare(strict_types=1);

namespace Tests\Feature\Notification;

use App\Contracts\ZaloZnsTransport;
use App\Enums\BookingStatus;
use App\Enums\HoldStatus;
use App\Events\BookingConfirmed;
use App\Jobs\SendBookingReminders;
use App\Listeners\SendBookingConfirmation;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Court;
use App\Models\Customer;
use App\Models\NotificationMessage;
use App\Models\Tenant;
use App\Notifications\BookingConfirmedNotification;
use App\Notifications\BookingReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Court $court;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-07-21 10:00:00');

        $this->tenant = Tenant::create(['name' => 'V', 'slug' => 'v', 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
        $this->court = Court::create(['tenant_id' => $this->tenant->id, 'name' => 'S', 'court_type' => 'pickleball', 'status' => 'active']);
        $this->customer = Customer::create(['tenant_id' => $this->tenant->id, 'phone' => '0900000011', 'name' => 'A', 'email' => 'a@example.com']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function confirmedBookingStartingInMinutes(int $minutes): Booking
    {
        $booking = Booking::create([
            'tenant_id' => $this->tenant->id, 'code' => 'SAN-'.strtoupper(substr(md5((string) $minutes.microtime()), 0, 5)),
            'customer_id' => $this->customer->id, 'status' => BookingStatus::Confirmed, 'channel' => 'zalo',
            'total_amount' => 60_000, 'deposit_amount' => 60_000, 'payment_mode' => 'deposit', 'cancel_policy_snapshot' => [],
        ]);
        // Slots are stored wall-as-UTC (venue wall-clock digits, no offset — single-tz Phase 1),
        // so "$minutes from now" must be measured against the VENUE wall-clock, matching how
        // SendBookingReminders evaluates its window.
        $wallNow = CarbonImmutable::parse(CarbonImmutable::now($this->tenant->timezone)->format('Y-m-d H:i:s'));
        BookingSlot::create([
            'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'court_id' => $this->court->id,
            'start_at' => $wallNow->addMinutes($minutes), 'end_at' => $wallNow->addMinutes($minutes + 60),
            'price_snapshot' => 60_000, 'hold_status' => HoldStatus::Committed,
        ]);

        return $booking;
    }

    public function test_confirmation_listener_notifies_the_customer(): void
    {
        Notification::fake();
        $booking = $this->confirmedBookingStartingInMinutes(600);

        (new SendBookingConfirmation)->handle(new BookingConfirmed($booking));

        Notification::assertSentTo($this->customer, BookingConfirmedNotification::class);
    }

    public function test_queued_zns_notifications_have_bounded_retry_policy(): void
    {
        $booking = $this->confirmedBookingStartingInMinutes(600);

        foreach ([new BookingConfirmedNotification($booking), new BookingReminderNotification($booking, 'reminder_2h')] as $notification) {
            $this->assertSame(3, $notification->tries);
            $this->assertSame(30, $notification->timeout);
            $this->assertSame([60, 300], $notification->backoff());
        }
    }

    public function test_reminder_job_notifies_due_bookings(): void
    {
        Notification::fake();
        $this->confirmedBookingStartingInMinutes(90);   // within both the 2h and 1-day windows

        (new SendBookingReminders)->handle();

        Notification::assertSentTo($this->customer, BookingReminderNotification::class);
    }

    public function test_reminder_job_does_not_resend_already_sent(): void
    {
        Notification::fake();
        $booking = $this->confirmedBookingStartingInMinutes(90);
        foreach (['reminder_1day', 'reminder_2h'] as $template) {
            NotificationMessage::create([
                'tenant_id' => $this->tenant->id, 'booking_id' => $booking->id, 'channel' => 'zalo_zns',
                'template' => $template, 'status' => 'sent', 'sent_at' => now(),
            ]);
        }

        (new SendBookingReminders)->handle();

        Notification::assertNotSentTo($this->customer, BookingReminderNotification::class);
    }

    public function test_reminder_dedupe_lookup_is_tenant_scoped(): void
    {
        Notification::fake();
        $booking = $this->confirmedBookingStartingInMinutes(90);
        DB::enableQueryLog();

        (new SendBookingReminders)->handle();

        $dedupeQueries = collect(DB::getQueryLog())->filter(
            fn (array $query) => str_contains($query['query'], 'notification_messages'),
        );

        $this->assertNotEmpty($dedupeQueries);
        $this->assertTrue($dedupeQueries->every(
            fn (array $query) => str_contains($query['query'], 'tenant_id')
                && in_array($booking->tenant_id, $query['bindings'], true),
        ));
    }

    public function test_transport_records_message_and_dedupes_by_booking_template(): void
    {
        $booking = $this->confirmedBookingStartingInMinutes(600);
        $transport = app(ZaloZnsTransport::class);
        $message = ['template' => 'booking_confirmed', 'booking_id' => $booking->id, 'params' => ['code' => $booking->code]];

        $transport->send($this->customer, $this->customer->phone, $message);
        $transport->send($this->customer, $this->customer->phone, $message);   // duplicate

        $this->assertSame(1, NotificationMessage::where('booking_id', $booking->id)->where('template', 'booking_confirmed')->count());
    }

    public function test_notification_message_references_stay_within_the_tenant(): void
    {
        $booking = $this->confirmedBookingStartingInMinutes(600);
        $otherTenant = Tenant::create([
            'name' => 'Other',
            'slug' => 'other',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);

        try {
            NotificationMessage::create([
                'tenant_id' => $otherTenant->id,
                'customer_id' => $this->customer->id,
                'booking_id' => $booking->id,
                'channel' => 'zalo_zns',
                'template' => 'booking_confirmed',
                'status' => 'sent',
            ]);

            $this->fail('Expected the composite tenant foreign key to reject the notification message.');
        } catch (QueryException $exception) {
            $this->assertSame('23503', $exception->getCode());
        }
    }

    public function test_notification_message_allows_nullable_business_references(): void
    {
        $message = NotificationMessage::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => null,
            'booking_id' => null,
            'channel' => 'zalo_zns',
            'template' => 'system_notice',
            'status' => 'sent',
        ]);

        $this->assertNull($message->customer_id);
        $this->assertNull($message->booking_id);
    }
}
