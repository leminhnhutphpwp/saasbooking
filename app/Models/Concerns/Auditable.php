<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\AuditLog;
use App\Support\AuditActor;
use Illuminate\Support\Facades\Auth;

/**
 * Records create/update/delete activity to the `audit_logs` table.
 *
 * Actor = logged-in user (`Auth::id()`) OR an actor forced via `AuditActor::runAs()`
 * (used for jobs running in the queue — attribute to whoever triggered them). With neither
 * (seeder / command with no actor) → SKIP, so we don't create noise audit rows and because
 * `audit_logs.user_id` is NOT NULL.
 */
trait Auditable
{
    /** Attribute keys never worth recording (noise / secrets). */
    protected array $auditExcludeDefault = [
        'id', 'uuid', 'password', 'remember_token', 'created_at', 'updated_at', 'deleted_at',
    ];

    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->writeAuditLog('created', null, $model->auditableValues($model->getAttributes()));
        });

        static::updated(function ($model) {
            $new = $model->auditableValues($model->getChanges());
            if (empty($new)) {
                return; // only excluded fields (e.g. timestamps) changed
            }
            $old = [];
            foreach (array_keys($new) as $key) {
                $old[$key] = $model->getOriginal($key);
            }
            $model->writeAuditLog('updated', $old, $new);
        });

        static::deleted(function ($model) {
            $model->writeAuditLog('deleted', $model->auditableValues($model->getAttributes()), null);
        });
    }

    protected function writeAuditLog(string $action, ?array $old, ?array $new): void
    {
        $actorId = Auth::id() ?? AuditActor::id();
        if ($actorId === null) {
            return;
        }

        AuditLog::create([
            'user_id' => $actorId,
            'action' => $action,
            'model_type' => class_basename($this),
            'model_id' => $this->getKey(),
            'old_values' => $old,
            'new_values' => $new,
        ]);
    }

    protected function auditableValues(array $attributes): array
    {
        $exclude = array_merge($this->auditExcludeDefault, $this->auditExclude ?? []);

        return collect($attributes)->except($exclude)->toArray();
    }
}
