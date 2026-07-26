<?php

declare(strict_types=1);

namespace App\Http\Requests\Manager;

use App\Support\WorkingTenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates a staff-assisted / walk-in booking request. The actual slot reservation
 * goes through BookingService::createHold — this FormRequest only checks input shape.
 */
class StoreWalkInBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Gate checked by `can:access-manager` on the route group.
    }

    public function rules(): array
    {
        $tenantId = (int) WorkingTenant::id($this);

        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'court_id' => ['required', 'integer', Rule::exists('courts', 'id')->where('tenant_id', $tenantId)],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'payment_mode' => ['sometimes', 'string', Rule::in(['cash', 'deposit'])],
        ];
    }
}
