<?php

namespace App\Traits;

use App\Models\Modification;
use Illuminate\Database\Eloquent\Model;

trait LogsModification
{
    protected static function bootLogsModification()
    {
        // The 'created' function is perfect. No changes needed here.
        static::created(function (Model $model) {
            $fields = [];
            foreach ($model->getFillable() as $field) {
                // Ensure there is a value to log and it's not a password field for security
                if ($model->isDirty($field) && !in_array($field, ['password', 'remember_token'])) {
                    $fields[$field] = [
                        'old'  => null,
                        'new'  => $model->{$field},
                        'user' => [
                            'id'   => auth()->id(),
                            'name' => auth()->user()?->name ?? 'System',
                        ],
                    ];
                }
            }

            if (!empty($fields)) {
                Modification::create([
                    'user_id'        => auth()->id(),
                    'model_type'     => class_basename($model),
                    'model_id'       => $model->id,
                    'action'         => 'created',
                    'changed_fields' => $fields,
                ]);
            }
        });

        // THIS IS THE FIX: Use the `updating` event instead of `updated`.
        // This event fires *before* the save, guaranteeing we can see the changes.
        static::updating(function (Model $model) {
            $changes = [];

            // getDirty() correctly identifies fields that have new values set on the model instance.
            foreach ($model->getDirty() as $field => $newValue) {
                // We can ignore certain fields we don't want to track.
                if (in_array($field, ['updated_at', 'updated_by'])) {
                    continue;
                }

                // getOriginal() is reliable inside the `updating` event.
                $originalValue = $model->getOriginal($field);

                // Ensure we only log actual changes
                if ($originalValue != $newValue) {
                    $changes[$field] = [
                        'old'  => $originalValue,
                        'new'  => $newValue,
                        'user' => [
                            'id'   => auth()->id(),
                            'name' => auth()->user()?->name ?? 'System',
                        ],
                    ];
                }
            }

            // Only create a modification record if something actually changed.
            if (!empty($changes)) {
                Modification::create([
                    'user_id'        => auth()->id(),
                    'model_type'     => class_basename($model),
                    'model_id'       => $model->id,
                    'action'         => 'updated',
                    'changed_fields' => $changes,
                ]);
            }
        });

        // We remove the old 'updated' listener as 'updating' now handles everything.
    }
}
