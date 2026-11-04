<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Typhoon extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'disasters';

    /** Allowed `disaster_type` values (matches the column's enum). */
    public const TYPES = [
        'Typhoon', 'Tropical Storm', 'Tropical Depression', 'Flood', 'Flash Flood', 'Earthquake', 'Landslide',
        'Storm Surge', 'Drought', 'Volcanic Eruption', 'Fire', 'Tornado', 'Heavy Rainfall', 'Other',
    ];

    protected $fillable = [
        'name',
        'disaster_type',
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
        'year_id',
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
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    /**
     * Get the user who ended this typhoon report
     */
    public function ender()
    {
        return $this->belongsTo(User::class, 'ended_by')->withTrashed();
    }

    /**
     * Get the user who paused this typhoon report
     */
    public function pauser()
    {
        return $this->belongsTo(User::class, 'paused_by')->withTrashed();
    }

    /**
     * Get the user who resumed this typhoon report
     */
    public function resumer()
    {
        return $this->belongsTo(User::class, 'resumed_by')->withTrashed();
    }

    /**
     * Get the year this disaster belongs to
     */
    public function year()
    {
        return $this->belongsTo(Year::class);
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
     * The disaster as every page receives it (the `typhoon` prop).
     *
     * @return array{active: ?self, hasActive: bool}
     */
    public static function forPage(): array
    {
        return [
            'active' => self::with('creator:id,name')->whereIn('status', ['active', 'paused'])->latest()->first(),
            'hasActive' => self::hasActiveTyphoon(),
        ];
    }

    /** The type printed before the name in reports; null when the name already says it or it is just "Other". */
    public function reportType(): ?string
    {
        $type = $this->disaster_type;

        return $type && $type !== 'Other' && ! Str::contains($this->name, $type, true) ? $type : null;
    }

    /** The PDF subject for this disaster, e.g. EARTHQUAKE "MAGNITUDE 6.5 ILAGAN". */
    public function reportSubject(): string
    {
        return ltrim(mb_strtoupper($this->reportType().' "'.$this->name.'"'));
    }
}
