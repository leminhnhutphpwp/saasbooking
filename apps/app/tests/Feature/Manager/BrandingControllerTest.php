<?php

declare(strict_types=1);

namespace Tests\Feature\Manager;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BrandingControllerTest extends TestCase
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

    public function test_valid_png_logo_is_stored_and_url_saved_to_settings(): void
    {
        Storage::fake('public');
        $t = $this->venue('venue-a');

        $this->actingAs($this->owner($t))
            ->post('/manager/branding', [
                'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $settings = $t->fresh()->settings;
        $this->assertNotNull($settings['logo_url'] ?? null);
        $this->assertStringContainsString($t->uuid, $settings['logo_url']);
        $this->assertGreaterThan(0, count(Storage::disk('public')->allFiles()));
    }

    public function test_svg_logo_is_rejected(): void
    {
        Storage::fake('public');
        $t = $this->venue('venue-a');

        // Security (#6): SVG can carry <script> and is served same-origin → rejected on the logo field.
        $this->actingAs($this->owner($t))
            ->from('/manager/branding')
            ->post('/manager/branding', [
                'logo' => UploadedFile::fake()->create('malicious.svg', 8, 'image/svg+xml'),
            ])
            ->assertRedirect()
            ->assertSessionHasErrors(['logo']);

        $this->assertNull($t->fresh()->settings['logo_url'] ?? null);
        $this->assertSame(0, count(Storage::disk('public')->allFiles()));
    }

    public function test_update_preserves_unrelated_existing_settings(): void
    {
        Storage::fake('public');
        $t = $this->venue('venue-a');
        $t->settings = ['existing_key' => 'keep-me', 'primary_color' => '#000000'];
        $t->save();

        $this->actingAs($this->owner($t))
            ->post('/manager/branding', [
                'primary_color' => '#ff0000',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $settings = $t->fresh()->settings;
        $this->assertSame('keep-me', $settings['existing_key']);       // untouched key preserved
        $this->assertSame('#ff0000', $settings['primary_color']);      // updated
    }
}
