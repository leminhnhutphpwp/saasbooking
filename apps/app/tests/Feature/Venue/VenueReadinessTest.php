<?php

declare(strict_types=1);

namespace Tests\Feature\Venue;

use App\Models\Court;
use App\Models\OpeningRule;
use App\Models\PricingRule;
use App\Models\Tenant;
use App\Models\TenantBankConfig;
use App\Services\VenueReadinessService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Venue readiness service tests — verifies the typed readiness model for accepting
 * real bookings + VietQR deposits. Each blocker is tested in isolation and combined.
 *
 * Tests run on real PostgreSQL (testing rule).
 * No migrate:fresh or db:wipe.
 */
class VenueReadinessTest extends TestCase
{
    use RefreshDatabase;

    private function tenant(string $slug = 'venue'): Tenant
    {
        return Tenant::create([
            'name' => $slug,
            'slug' => $slug,
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
        ]);
    }

    private function court(Tenant $tenant, string $name = 'Sân 1'): Court
    {
        return Court::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => $name,
            'court_type' => 'pickleball',
            'status' => 'active',
        ]);
    }

    private function openingRule(Tenant $tenant, Court $court): OpeningRule
    {
        return OpeningRule::create([
            'tenant_id' => $tenant->id,
            'court_id' => $court->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'open_local' => '06:00',
            'close_local' => '22:00',
            'tz' => 'Asia/Ho_Chi_Minh',
            'effective_from' => now()->toDateString(),
        ]);
    }

    private function pricingRule(Tenant $tenant): PricingRule
    {
        return PricingRule::create([
            'tenant_id' => $tenant->id,
            'weekday' => [1, 2, 3, 4, 5, 6, 7],
            'start_local' => '00:00',
            'end_local' => '23:59',
            'price_per_hour' => 100_000,
            'priority' => 0,
        ]);
    }

    private function bankConfig(Tenant $tenant, bool $active = true): TenantBankConfig
    {
        return TenantBankConfig::create([
            'tenant_id' => $tenant->id,
            'provider' => 'sepay',
            'bank_bin' => '970422',
            'account_number' => '0123456789',
            'account_name' => 'NGUYEN VAN A',
            'webhook_secret' => 'test-secret-key',
            'active' => $active,
        ]);
    }

    // ── Blocker: no active court ──────────────────────────────────────

    public function test_new_tenant_has_readiness_blockers(): void
    {
        $tenant = $this->tenant();
        $state = VenueReadinessService::check($tenant);

        $this->assertFalse($state->isReady);
        $this->assertNotEmpty($state->blockers);
        $this->assertContains('no_active_court', array_map(fn ($b) => $b->code, $state->blockers));
    }

    public function test_no_active_court_blocker_message_and_action(): void
    {
        $tenant = $this->tenant();
        $state = VenueReadinessService::check($tenant);

        $blocker = collect($state->blockers)->firstWhere('code', 'no_active_court');
        $this->assertNotNull($blocker);
        $this->assertStringContainsString('sân hoạt động', $blocker->message);
        $this->assertSame('courts.create', $blocker->action);
    }

    // ── Blocker: missing opening coverage ─────────────────────────────

    public function test_court_without_opening_rule_is_a_blocker(): void
    {
        $tenant = $this->tenant();
        $this->court($tenant);

        $state = VenueReadinessService::check($tenant);

        $this->assertFalse($state->isReady);
        $this->assertContains('missing_opening_coverage', array_map(fn ($b) => $b->code, $state->blockers));
    }

    public function test_court_with_opening_rule_passes_coverage_check(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);

        $state = VenueReadinessService::check($tenant);

        $codes = array_map(fn ($b) => $b->code, $state->blockers);
        $this->assertNotContains('missing_opening_coverage', $codes);
    }

    // ── Blocker: missing pricing ──────────────────────────────────────

    public function test_no_pricing_rule_is_a_blocker(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);

        $state = VenueReadinessService::check($tenant);

        $this->assertFalse($state->isReady);
        $this->assertContains('missing_pricing', array_map(fn ($b) => $b->code, $state->blockers));
    }

    public function test_pricing_rule_passes_pricing_check(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);
        $this->pricingRule($tenant);

        $state = VenueReadinessService::check($tenant);

        $codes = array_map(fn ($b) => $b->code, $state->blockers);
        $this->assertNotContains('missing_pricing', $codes);
    }

    // ── Blocker: missing bank config ──────────────────────────────────

    public function test_no_active_bank_config_is_a_blocker(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);
        $this->pricingRule($tenant);

        $state = VenueReadinessService::check($tenant);

        $this->assertFalse($state->isReady);
        $this->assertContains('missing_bank_config', array_map(fn ($b) => $b->code, $state->blockers));
    }

    public function test_inactive_bank_config_is_still_a_blocker(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);
        $this->pricingRule($tenant);
        $this->bankConfig($tenant, active: false);

        $state = VenueReadinessService::check($tenant);

        $this->assertFalse($state->isReady);
        $this->assertContains('missing_bank_config', array_map(fn ($b) => $b->code, $state->blockers));
    }

    // ── Ready state: all blockers resolved ────────────────────────────

    public function test_tenant_with_all_requirements_is_ready(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);
        $this->pricingRule($tenant);
        $this->bankConfig($tenant);

        $state = VenueReadinessService::check($tenant);

        $this->assertTrue($state->isReady);
        $this->assertEmpty($state->blockers);
        $this->assertSame($tenant->id, $state->tenant->id);
    }

    public function test_readiness_state_has_checked_at_timestamp(): void
    {
        $tenant = $this->tenant();
        $state = VenueReadinessService::check($tenant);

        $this->assertInstanceOf(Carbon::class, $state->checkedAt);
        $this->assertTrue($state->checkedAt->isPast() || $state->checkedAt->isCurrent());
    }

    public function test_action_links_returns_only_action_identifiers(): void
    {
        $tenant = $this->tenant();
        $state = VenueReadinessService::check($tenant);

        $links = $state->actionLinks();
        $this->assertIsArray($links);
        $this->assertContains('courts.create', $links);
    }

    // ── Persist: cached state is written to tenant ────────────────────

    public function test_check_and_persist_writes_is_ready_to_tenant(): void
    {
        $tenant = $this->tenant();
        $this->assertFalse($tenant->fresh()->is_ready);

        VenueReadinessService::checkAndPersist($tenant);

        $tenant->refresh();
        $this->assertFalse($tenant->is_ready);
        $this->assertNotNull($tenant->readiness_checked_at);
    }

    public function test_check_and_persist_sets_ready_when_all_blockers_resolved(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);
        $this->pricingRule($tenant);
        $this->bankConfig($tenant);

        VenueReadinessService::checkAndPersist($tenant);

        $tenant->refresh();
        $this->assertTrue($tenant->is_ready);
        $this->assertNotNull($tenant->readiness_checked_at);
    }

    // ── Tenant scope isolation ────────────────────────────────────────

    public function test_readiness_isolation_between_tenants(): void
    {
        $a = $this->tenant('venue-a');
        $b = $this->tenant('venue-b');

        // Venue A: fully configured
        $courtA = $this->court($a);
        $this->openingRule($a, $courtA);
        $this->pricingRule($a);
        $this->bankConfig($a);

        // Venue B: no courts
        $stateA = VenueReadinessService::check($a);
        $stateB = VenueReadinessService::check($b);

        $this->assertTrue($stateA->isReady);
        $this->assertFalse($stateB->isReady);
    }

    public function test_bank_config_isolation_between_tenants(): void
    {
        $a = $this->tenant('venue-a');
        $b = $this->tenant('venue-b');

        $this->bankConfig($a);

        // Venue B has no bank config despite A having one
        $stateB = VenueReadinessService::check($b);
        $codes = array_map(fn ($blocker) => $blocker->code, $stateB->blockers);
        $this->assertContains('missing_bank_config', $codes);
    }

    // ── Encrypted secrets never leaked ────────────────────────────────

    public function test_bank_webhook_secret_is_encrypted_in_database(): void
    {
        $tenant = $this->tenant();
        $config = $this->bankConfig($tenant);

        // Raw DB value should NOT match plaintext
        $raw = DB::table('tenant_bank_config')
            ->where('id', $config->id)
            ->value('webhook_secret');

        $this->assertNotSame('test-secret-key', $raw);
        // Eloquent accessor decrypts it
        $this->assertSame('test-secret-key', $config->fresh()->webhook_secret);
    }

    public function test_readiness_state_does_not_expose_secrets(): void
    {
        $tenant = $this->tenant();
        $court = $this->court($tenant);
        $this->openingRule($tenant, $court);
        $this->pricingRule($tenant);
        $this->bankConfig($tenant);

        $state = VenueReadinessService::check($tenant);

        // The ReadinessState value object contains only tenant, isReady, blockers, checkedAt
        $serialized = serialize($state);
        $this->assertStringNotContainsString('test-secret-key', $serialized);
        $this->assertStringNotContainsString('webhook_secret', $serialized);
    }

    // ── Multiple courts: all must have opening rules ──────────────────

    public function test_all_active_courts_must_have_opening_coverage(): void
    {
        $tenant = $this->tenant();
        $court1 = $this->court($tenant, 'Sân 1');
        $court2 = $this->court($tenant, 'Sân 2');

        // Only court1 has opening rules
        $this->openingRule($tenant, $court1);

        $state = VenueReadinessService::check($tenant);

        $blocker = collect($state->blockers)->firstWhere('code', 'missing_opening_coverage');
        $this->assertNotNull($blocker);
        $this->assertStringContainsString('Sân 2', $blocker->message);
    }

    // ── Maintenance courts are excluded from active count ─────────────

    public function test_maintenance_court_does_not_count_as_active(): void
    {
        $tenant = $this->tenant();
        Court::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Maintenance Court',
            'court_type' => 'pickleball',
            'status' => 'maintenance',
        ]);

        $state = VenueReadinessService::check($tenant);

        $this->assertContains('no_active_court', array_map(fn ($b) => $b->code, $state->blockers));
    }
}
