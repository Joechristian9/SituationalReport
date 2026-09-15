<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'disaster_id',
        'description',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withDefault([
            'name' => 'System',
            'email' => 'system@system.local',
        ]);
    }

    /**
     * Get the auditable model (polymorphic relationship)
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the disaster associated with this log
     */
    public function disaster(): BelongsTo
    {
        return $this->belongsTo(Typhoon::class, 'disaster_id');
    }

    /**
     * Get a human-readable action name
     */
    public function getActionNameAttribute(): string
    {
        if (!$this->action) {
            return 'Unknown';
        }

        return match($this->action) {
            'created' => 'Created',
            'updated' => 'Updated',
            'deleted' => 'Deleted',
            'login' => 'Logged In',
            'logout' => 'Logged Out',
            'exported' => 'Exported Data',
            'failed_login' => 'Failed Login',
            'password_changed' => 'Password Changed',
            'permission_changed' => 'Permission Changed',
            default => ucfirst($this->action),
        };
    }

    /**
     * Get a human-readable model name
     */
    public function getModelNameAttribute(): string
    {
        if (!$this->auditable_type) {
            return 'System';
        }

        return match($this->auditable_type) {
            'App\Models\WeatherReport', 'App\\Models\\WeatherReport' => 'Weather Report',
            'App\Models\WaterLevel', 'App\\Models\\WaterLevel' => 'Water Level',
            'App\Models\ElectricityService', 'App\\Models\\ElectricityService' => 'Electricity Service',
            'App\Models\WaterService', 'App\\Models\\WaterService' => 'Water Service',
            'App\Models\Communication', 'App\\Models\\Communication' => 'Communication',
            'App\Models\CommunicationService', 'App\\Models\\CommunicationService' => 'Communication Service',
            'App\Models\Road', 'App\\Models\\Road' => 'Road',
            'App\Models\Bridge', 'App\\Models\\Bridge' => 'Bridge',
            'App\Models\PreEmptiveReport', 'App\\Models\\PreEmptiveReport' => 'Pre-Emptive Evacuation',
            'App\Models\PrePositioning', 'App\\Models\\PrePositioning' => 'Pre-Positioning',
            'App\Models\IncidentMonitored', 'App\\Models\\IncidentMonitored' => 'Incident Monitored',
            'App\Models\Casualty', 'App\\Models\\Casualty' => 'Casualty',
            'App\Models\Injured', 'App\\Models\\Injured' => 'Injured',
            'App\Models\Missing', 'App\\Models\\Missing' => 'Missing',
            'App\Models\AffectedTourist', 'App\\Models\\AffectedTourist' => 'Affected Tourist',
            'App\Models\DamagedHouseReport', 'App\\Models\\DamagedHouseReport' => 'Damaged Houses',
            'App\Models\ResponseOperation', 'App\\Models\\ResponseOperation' => 'Response Operation',
            'App\Models\SuspensionOfClass', 'App\\Models\\SuspensionOfClass' => 'Suspension of Classes',
            'App\Models\SuspensionOfWork', 'App\\Models\\SuspensionOfWork' => 'Suspension of Work',
            'App\Models\AssistanceExtended', 'App\\Models\\AssistanceExtended' => 'Assistance Extended',
            'App\Models\AssistanceProvidedLgu', 'App\\Models\\AssistanceProvidedLgu' => 'Assistance Provided by LGU',
            'App\Models\AgricultureReport', 'App\\Models\\AgricultureReport' => 'Agriculture Report',
            'App\Models\User', 'App\\Models\\User' => 'User',
            'App\Models\Disaster', 'App\\Models\\Disaster' => 'Disaster',
            default => class_basename($this->auditable_type),
        };
    }

    /**
     * Get changes summary (count of changed fields)
     */
    public function getChangesCountAttribute(): int
    {
        if ($this->action === 'created' || $this->action === 'deleted') {
            return count($this->new_values ?? $this->old_values ?? []);
        }
        
        if ($this->action === 'updated') {
            return count(array_keys($this->new_values ?? []));
        }
        
        return 0;
    }

    /**
     * Scope to filter by action
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by model type
     */
    public function scopeByModel($query, $modelType)
    {
        return $query->where('auditable_type', $modelType);
    }

    /**
     * Scope to filter by disaster
     */
    public function scopeByDisaster($query, $disasterId)
    {
        return $query->where('disaster_id', $disasterId);
    }

    /**
     * Scope to filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
