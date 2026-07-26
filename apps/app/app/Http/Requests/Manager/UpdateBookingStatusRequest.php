<?php

declare(strict_types=1);

namespace App\Http\Requests\Manager;

use App\Enums\BookingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates a booking status transition (check-in, complete, no-show, cancel).
 * The controller calls BookingService methods — this only validates input shape.
 */
class UpdateBookingStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'string', Rule::in(['check_in', 'complete', 'no_show', 'cancel'])],
            'reason' => ['required_if:action,cancel', 'nullable', 'string', 'max:500'],
        ];
    }
}
