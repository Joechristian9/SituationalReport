<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Log a create action
     */
    public static function logCreate(Model $model, ?int $disasterId = null, ?string $description = null): void
    {
        self::log(
            action: 'created',
            model: $model,
            newValues: $model->getAttributes(),
            disasterId: $disasterId,
            description: $description
        );
    }

    /**
     * Log an update action with before/after values
     */
    public static function logUpdate(Model $model, array $originalValues, ?int $disasterId = null, ?string $description = null): void
    {
        $changes = $model->getChanges();
        
        // Remove timestamps and updated_by from changes if they exist
        unset($changes['updated_at'], $changes['created_at'], $changes['updated_by']);
        
        if (empty($changes)) {
            return; // No actual changes to log
        }

        $oldValues = [];
        $newValues = [];

        foreach ($changes as $key => $newValue) {
            $oldValues[$key] = $originalValues[$key] ?? null;
            $newValues[$key] = $newValue;
        }

        self::log(
            action: 'updated',
            model: $model,
            oldValues: $oldValues,
            newValues: $newValues,
            disasterId: $disasterId,
            description: $description
        );
    }

    /**
     * Log a delete action
     */
    public static function logDelete(Model $model, ?int $disasterId = null, ?string $description = null): void
    {
        self::log(
            action: 'deleted',
            model: $model,
            oldValues: $model->getAttributes(),
            disasterId: $disasterId,
            description: $description
        );
    }

    /**
     * Log user login
     */
    public static function logLogin(?string $description = null): void
    {
        self::log(
            action: 'login',
            description: $description ?? 'User logged in successfully'
        );
    }

    /**
     * Log user logout
     */
    public static function logLogout(?string $description = null): void
    {
        self::log(
            action: 'logout',
            description: $description ?? 'User logged out'
        );
    }

    /**
     * Log failed login attempt
     */
    public static function logFailedLogin(?string $email = null, ?string $description = null): void
    {
        self::log(
            action: 'failed_login',
            userId: null, // No user ID for failed attempts
            description: $description ?? "Failed login attempt" . ($email ? " for: {$email}" : '')
        );
    }

    /**
     * Log data export
     */
    public static function logExport(string $exportType, ?int $disasterId = null, ?string $description = null): void
    {
        self::log(
            action: 'exported',
            disasterId: $disasterId,
            description: $description ?? "Exported {$exportType} data"
        );
    }

    /**
     * Log password change
     */
    public static function logPasswordChange(?int $userId = null, ?string $description = null): void
    {
        self::log(
            action: 'password_changed',
            userId: $userId,
            description: $description ?? 'User password changed'
        );
    }

    /**
     * Log permission/role change
     */
    public static function logPermissionChange(Model $user, array $oldPermissions, array $newPermissions, ?string $description = null): void
    {
        self::log(
            action: 'permission_changed',
            model: $user,
            oldValues: ['permissions' => $oldPermissions],
            newValues: ['permissions' => $newPermissions],
            description: $description ?? 'User permissions updated'
        );
    }

    /**
     * Main logging method
     */
    private static function log(
        string $action,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null,
        ?int $disasterId = null,
        ?string $description = null
    ): void {
        try {
            AuditLog::create([
                'user_id' => $userId ?? Auth::id(),
                'action' => $action,
                'auditable_type' => $model ? get_class($model) : null,
                'auditable_id' => $model?->id,
                'old_values' => $oldValues ? self::sanitizeValues($oldValues) : null,
                'new_values' => $newValues ? self::sanitizeValues($newValues) : null,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
                'disaster_id' => $disasterId ?? self::getCurrentDisasterId($model),
                'description' => $description,
            ]);
        } catch (\Exception $e) {
            // Log error but don't interrupt the main process
            \Log::error('Audit logging failed: ' . $e->getMessage());
        }
    }

    /**
     * Sanitize values to remove sensitive data
     */
    private static function sanitizeValues(array $values): array
    {
        $sensitiveFields = ['password', 'password_confirmation', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];
        
        foreach ($sensitiveFields as $field) {
            if (isset($values[$field])) {
                $values[$field] = '[REDACTED]';
            }
        }
        
        return $values;
    }

    /**
     * Try to get the current disaster ID from the model
     */
    private static function getCurrentDisasterId(?Model $model): ?int
    {
        if (!$model) {
            return null;
        }

        // Check if model has disaster_id or typhoon_id attribute
        if (isset($model->disaster_id)) {
            return $model->disaster_id;
        }

        if (isset($model->typhoon_id)) {
            return $model->typhoon_id;
        }

        return null;
    }

    /**
     * Get human-readable field name
     */
    public static function getFieldLabel(string $field): string
    {
        // Convert snake_case to Title Case
        $label = str_replace('_', ' ', $field);
        return ucwords($label);
    }

    /**
     * Format value for display
     */
    public static function formatValue($value): string
    {
        if (is_null($value)) {
            return '(empty)';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_array($value)) {
            return json_encode($value, JSON_PRETTY_PRINT);
        }

        if ($value instanceof \DateTime || $value instanceof \Carbon\Carbon) {
            return $value->format('M d, Y h:i A');
        }

        return (string) $value;
    }
}
