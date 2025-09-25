<?php

namespace App\Traits;

use App\Models\Modification;

trait LogsModification
{
    protected static function bootLogsModification()
    {
        // 🔹 Created
        static::created(function ($model) {
            $fields = [];

            foreach ($model->getAttributes() as $field => $value) {
                if (in_array($field, ['id', 'created_at', 'updated_at'])) continue; // skip unwanted fields

                $fields[$field] = [
                    'old' => null,   // nothing existed before creation
                    'new' => $value, // current value
                ];
            }

            Modification::create([
                'user_id'        => auth()->id(),
                'model_type'     => class_basename($model),
                'model_id'       => $model->id,
                'action'         => 'created',
                'changed_fields' => $fields,
            ]);
        });

        // 🔹 Updated
        static::updated(function ($model) {
            $changes = [];

            foreach ($model->getAttributes() as $field => $newValue) {
                if (in_array($field, ['id', 'created_at', 'updated_at'])) continue; // skip unwanted fields

                $original = $model->getOriginal($field);

                // Only store if value actually changed
                if ($newValue != $original) {
                    $changes[$field] = [
                        'old' => $original,
                        'new' => $newValue,
                    ];
                }
            }

            // Only create a modification record if there are changes
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

        // 🔹 Deleted
        static::deleted(function ($model) {
            Modification::create([
                'user_id'    => auth()->id(),
                'model_type' => class_basename($model),
                'model_id'   => $model->id,
                'action'     => 'deleted',
            ]);
        });
    }
}
