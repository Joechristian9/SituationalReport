<?php

namespace App\Traits;

use App\Models\Modification;

trait LogsModification
{
    protected static function bootLogsModification()
    {
        static::created(function ($model) {
            $fields = [];

            foreach ($model->getAttributes() as $field => $value) {
                if (in_array($field, ['id', 'created_at', 'updated_at'])) continue;

                $fields[$field] = [
                    'old'  => null,
                    'new'  => $value,
                    'user' => [
                        'id'   => auth()->id(),
                        'name' => auth()->user()?->name ?? 'System',
                    ],
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

        static::updated(function ($model) {
            $changes = [];

            // Get the latest modification for this model to know previous users per field
            $latestModification = Modification::where('model_type', class_basename($model))
                ->where('model_id', $model->id)
                ->latest('created_at')
                ->first();

            foreach ($model->getAttributes() as $field => $newValue) {
                if (in_array($field, ['id', 'created_at', 'updated_at'])) continue;

                $original = $model->getOriginal($field);

                if ($newValue != $original) {
                    // 🔹 Value changed → current user
                    $changes[$field] = [
                        'old'  => $original,
                        'new'  => $newValue,
                        'user' => [
                            'id'   => auth()->id(),
                            'name' => auth()->user()?->name,
                        ],
                    ];
                } else {
                    // 🔹 Value unchanged → keep the last modifier if it exists
                    $previousUser = $latestModification?->changed_fields[$field]['user']
                        ?? ['id' => auth()->id(), 'name' => auth()->user()?->name];

                    $changes[$field] = [
                        'old'  => $original,
                        'new'  => $newValue,
                        'user' => $previousUser, // 👈 reuses last modifier, not current user
                    ];
                }
            }

            Modification::create([
                'user_id'        => auth()->id(),
                'model_type'     => class_basename($model),
                'model_id'       => $model->id,
                'action'         => 'updated',
                'changed_fields' => $changes,
            ]);
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
