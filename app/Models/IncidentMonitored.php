<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsModification;

class IncidentMonitored extends Model
{
    use HasFactory, LogsModification;
    protected $table = 'incident_monitored';
    protected $fillable = [
        'kinds_of_incident',
        'date_time',
        'location',
        'description',
        'remarks',
        'user_id',
        'updated_by',
        'typhoon_id',
    ];

    /**
     * Relationship to creator (user who created the record)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relationship to updater (last user who updated the record)
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Relationship to typhoon
     */
    public function typhoon()
    {
        return $this->belongsTo(Typhoon::class, 'typhoon_id');
    }

    /**
     * Automatically set `user_id` and `updated_by`
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (Auth::check()) {
                $model->user_id = $model->user_id ?? Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}
