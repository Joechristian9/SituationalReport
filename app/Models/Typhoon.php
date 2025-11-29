<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Typhoon extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
        'started_at',
        'ended_at',
        'paused_at',
        'resumed_at',
        'pdf_path',
        'created_by',
        'ended_by',
        'paused_by',
        'resumed_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'paused_at' => 'datetime',
        'resumed_at' => 'datetime',
    ];

    /**
     * Get the user who created this typhoon report
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who ended this typhoon report
     */
    public function ender()
    {
        return $this->belongsTo(User::class, 'ended_by');
    }

    /**
     * Get the user who paused this typhoon report
     */
    public function pauser()
    {
        return $this->belongsTo(User::class, 'paused_by');
    }

    /**
     * Get the user who resumed this typhoon report
     */
    public function resumer()
    {
        return $this->belongsTo(User::class, 'resumed_by');
    }

    /**
     * Scope to get only active typhoons (including paused)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'paused']);
    }

    /**
     * Scope to get paused typhoons
     */
    public function scopePaused($query)
    {
        return $query->where('status', 'paused');
    }

    /**
     * Check if typhoon is paused
     */
    public function isPaused()
    {
        return $this->status === 'paused';
    }

    /**
     * Check if typhoon is active (not paused, not ended)
     */
    public function isActive()
    {
        return $this->status === 'active';
    }

    /**
     * Scope to get ended typhoons
     */
    public function scopeEnded($query)
    {
        return $query->where('status', 'ended');
    }

    /**
     * Get the currently active typhoon
     */
    public static function getActiveTyphoon()
    {
        return self::active()->latest()->first();
    }

    /**
     * Check if there's an active typhoon (including paused)
     */
    public static function hasActiveTyphoon()
    {
        return self::whereIn('status', ['active', 'paused'])->exists();
    }

    /**
     * Relationships to all report tables
     */
    public function weatherReports()
    {
        return $this->hasMany(WeatherReport::class);
    }

    public function casualties()
    {
        return $this->hasMany(Casualty::class);
    }

    public function injured()
    {
        return $this->hasMany(Injured::class);
    }

    public function missing()
    {
        return $this->hasMany(Missing::class);
    }

    public function preEmptiveReports()
    {
        return $this->hasMany(PreEmptiveReport::class);
    }

    public function incidentMonitored()
    {
        return $this->hasMany(IncidentMonitored::class);
    }

    public function prePositionings()
    {
        return $this->hasMany(PrePositioning::class);
    }

    public function uscDeclarations()
    {
        return $this->hasMany(UscDeclaration::class);
    }

    public function damagedHouseReports()
    {
        return $this->hasMany(DamagedHouseReport::class);
    }

    public function affectedTourists()
    {
        return $this->hasMany(AffectedTourist::class);
    }

    public function responseOperations()
    {
        return $this->hasMany(ResponseOperation::class);
    }

    public function assistanceExtendeds()
    {
        return $this->hasMany(AssistanceExtended::class);
    }

    public function assistanceProvidedLgus()
    {
        return $this->hasMany(AssistanceProvidedLgu::class);
    }

    public function suspensionOfClasses()
    {
        return $this->hasMany(SuspensionOfClass::class);
    }

    public function suspensionOfWorks()
    {
        return $this->hasMany(SuspensionOfWork::class);
    }

    public function bridges()
    {
        return $this->hasMany(Bridge::class);
    }

    public function roads()
    {
        return $this->hasMany(Road::class);
    }

    public function waterLevels()
    {
        return $this->hasMany(WaterLevel::class);
    }

    public function communications()
    {
        return $this->hasMany(Communication::class);
    }

    public function electricityServices()
    {
        return $this->hasMany(ElectricityService::class);
    }

    public function waterServices()
    {
        return $this->hasMany(WaterService::class);
    }
}
