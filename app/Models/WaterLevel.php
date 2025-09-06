<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class WaterLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'gauging_station',
        'current_level',
        'alarm_level',
        'critical_level',
        'affected_areas',
        'updated_by',
        'user_id',
    ];

    /**
     * The user who created the water level report.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The user who last updated the water level report.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Boot method to automatically handle user_id and updated_by.
     */
    protected static function boot()
    {
        parent::boot();

        // Set user_id and updated_by when creating
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->user_id = $model->user_id ?? Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        // Always update updated_by when editing
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}
