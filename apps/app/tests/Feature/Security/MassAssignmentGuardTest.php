<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\RecurringSeries;
use App\Models\Refund;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Audit #10 — sensitive columns must NOT be mass-assignable, so a stray create($request->all())
 * can never set tenant_id / status / money. The suite runs with Model::unguard() for terse
 * fixtures; here we re-enable guarding to prove the production protection is real.
 */
class MassAssignmentGuardTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{0:class-string<Model>, 1:string}> */
    public static function guardedAttributes(): array
    {
        return [
            'Booking.tenant_id' => [Booking::class, 'tenant_id'],
            'Booking.status' => [Booking::class, 'status'],
            'Booking.total_amount' => [Booking::class, 'total_amount'],
            'Booking.deposit_amount' => [Booking::class, 'deposit_amount'],
            'Payment.tenant_id' => [Payment::class, 'tenant_id'],
            'Payment.amount' => [Payment::class, 'amount'],
            'Payment.status' => [Payment::class, 'status'],
            'Court.tenant_id' => [Court::class, 'tenant_id'],
            'Court.status' => [Court::class, 'status'],
            'Refund.tenant_id' => [Refund::class, 'tenant_id'],
            'Refund.amount' => [Refund::class, 'amount'],
            'Refund.status' => [Refund::class, 'status'],
            'RecurringSeries.tenant_id' => [RecurringSeries::class, 'tenant_id'],
            'RecurringSeries.status' => [RecurringSeries::class, 'status'],
        ];
    }

    /**
     * @param  class-string<Model>  $model
     */
    #[DataProvider('guardedAttributes')]
    public function test_sensitive_attribute_is_not_fillable(string $model, string $attribute): void
    {
        $this->assertNotContains($attribute, (new $model)->getFillable(),
            "$model::\$fillable must not expose '$attribute' to mass assignment.");
    }

    public function test_mass_assigning_a_guarded_attribute_throws_when_guarding_is_active(): void
    {
        // Undo the test-wide unguard so we exercise the real production guard.
        Model::reguard();

        try {
            $this->assertThrows(
                fn () => Court::create(['name' => 'X', 'court_type' => 'pickleball', 'status' => 'active']),
                MassAssignmentException::class,
            );
        } finally {
            Model::unguard();
        }
    }
}
