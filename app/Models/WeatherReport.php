<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class WeatherReport extends Model
{
    use HasFactory, LogsModification;

    protected $fillable = [
        'municipality',
        'sky_condition',
        'wind',
        'precipitation',
        'sea_condition',
        'updated_by',
        'user_id',
    ];

    /**
     * Each weather report belongs to a user (creator).
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * User who last updated the report.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Boot method to automatically handle updated_by.
     */
    protected static function boot()
    {
        parent::boot();

        // Set user_id and updated_by when creating
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->user_id = $model->user_id ?? Auth::id();
                $model->updated_by = Auth::id();
            } else {
                // Fallback when running in CLI or seeding
                $model->user_id = $model->user_id ?? 1;
                $model->updated_by = 1;
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
