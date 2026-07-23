<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Enums\SeriesStatus;
use App\Models\Court;
use App\Models\Customer;
use App\Models\RecurringSeries;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SeriesControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['super_admin', 'owner', 'staff'] as $role) {
            Role::create(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function venue(string $slug): Tenant
    {
        return Tenant::create(['name' => $slug, 'slug' => $slug, 'timezone' => 'Asia/Ho_Chi_Minh', 'status' => 'active']);
    }

    private function owner(Tenant $t): User
    {
        $u = User::factory()->create(['tenant_id' => $t->id]);
        $u->assignRole('owner');

        return $u;
    }

    private function makeSeries(Tenant $t): RecurringSeries
    {
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0912345678', 'name' => 'Khách']);
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);

        return RecurringSeries::create([
            'tenant_id' => $t->id,
            'customer_id' => $customer->id,
            'court_id' => $court->id,
            'weekday' => 1,
            'start_local' => '18:00',
            'end_local' => '19:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'start_date' => '2026-08-01',
            'end_date' => '2026-12-31',
            'price_per_session_snapshot' => 60_000,
            'deposit_per_session' => 60_000,
            'status' => SeriesStatus::Active,
        ]);
    }

    public function test_destroy_sets_series_cancelled(): void
    {
        $t = $this->venue('venue-a');
        $series = $this->makeSeries($t);

        $this->actingAs($this->owner($t))
            ->delete("/manager/series/{$series->uuid}")
            ->assertRedirect();

        $this->assertSame(SeriesStatus::Cancelled, $series->fresh()->status);
    }

    public function test_owner_cannot_cancel_other_tenants_series(): void
    {
        $a = $this->venue('venue-a');
        $b = $this->venue('venue-b');
        $seriesB = $this->makeSeries($b);

        $this->actingAs($this->owner($a))
            ->delete("/manager/series/{$seriesB->uuid}")
            ->assertForbidden();

        // Status unchanged.
        $this->assertSame(SeriesStatus::Active, $seriesB->fresh()->status);
    }

    public function test_series_with_no_matching_weekday_in_window_is_rejected(): void
    {
        $t = $this->venue('venue-a');
        $customer = Customer::create(['tenant_id' => $t->id, 'phone' => '0912345678', 'name' => 'Khách']);
        $court = Court::create(['tenant_id' => $t->id, 'name' => 'Sân 1', 'court_type' => 'pickleball', 'status' => 'active']);

        // A 2-day window that spans two distinct weekdays; pick a weekday that is neither,
        // so the [start_date, end_date] range contains NO occurrence of it (#12).
        $start = Carbon::today()->addDays(2);
        $end = $start->copy()->addDay();
        $used = [$start->dayOfWeekIso, $end->dayOfWeekIso];
        $badWeekday = collect(range(1, 7))->first(fn (int $d): bool => ! in_array($d, $used, true));

        $this->actingAs($this->owner($t))
            ->from('/manager/series')
            ->post('/manager/series', [
                'customer_id' => $customer->id,
                'court_id' => $court->id,
                'weekday' => $badWeekday,
                'start_local' => '18:00',
                'end_local' => '19:00',
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'deposit_per_session' => 60_000,
            ])
            ->assertRedirect()               // validation redirect, NOT a 500
            ->assertSessionHasErrors(['end_date']);

        // No series was created.
        $this->assertSame(0, RecurringSeries::where('tenant_id', $t->id)->count());
    }
}
