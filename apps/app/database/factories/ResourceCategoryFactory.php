<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ResourceCategory;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResourceCategory>
 */
class ResourceCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'code' => fake()->unique()->slug(1),
            'slug' => fake()->unique()->slug(1),
            'label' => fake()->unique()->randomElement([
                'Pickleball',
                'Cầu lông',
                'Tennis',
                'Bóng bàn',
                'Cầu lông đôi',
            ]),
            'is_active' => true,
            'display_order' => 0,
            'metadata' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Pre-defined categories matching legacy CourtType values for testing.
     */
    public static function legacyTypes(): array
    {
        return [
            ['code' => 'cau_long', 'slug' => 'cau_long', 'label' => 'Cầu lông'],
            ['code' => 'pickleball', 'slug' => 'pickleball', 'label' => 'Pickleball'],
            ['code' => 'khac', 'slug' => 'khac', 'label' => 'Khác'],
        ];
    }
}
