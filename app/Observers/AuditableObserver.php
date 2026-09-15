<?php

namespace App\Observers;

use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;

/**
 * Observer to automatically log all model changes to audit logs
 * Can be attached to any model that needs auditing
 */
class AuditableObserver
{
    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        AuditLogger::logCreate(
            model: $model,
            disasterId: $this->getDisasterId($model)
        );
    }

    /**
     * Handle the Model "updating" event.
     * We use "updating" instead of "updated" to capture original values before save
     */
    public function updating(Model $model): void
    {
        // Store original values before the update
        $model->_auditOriginalValues = $model->getOriginal();
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        // Get the original values we stored in "updating"
        $originalValues = $model->_auditOriginalValues ?? $model->getOriginal();
        
        AuditLogger::logUpdate(
            model: $model,
            originalValues: $originalValues,
            disasterId: $this->getDisasterId($model)
        );
    }

    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        AuditLogger::logDelete(
            model: $model,
            disasterId: $this->getDisasterId($model)
        );
    }

    /**
     * Get disaster ID from model if available
     */
    private function getDisasterId(Model $model): ?int
    {
        if (isset($model->disaster_id)) {
            return $model->disaster_id;
        }

        if (isset($model->typhoon_id)) {
            return $model->typhoon_id;
        }

        return null;
    }
}
