<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsModification;

class ElectricityService extends Model
{
    use HasFactory, LogsModification;

    protected $fillable = [
        'status',
        'barangays_affected',
        'remarks',
        'user_id',
        'updated_by',
        'typhoon_id',
    ];

    /**
     * The user who created the electricity service report.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The user who last updated the electricity service report.
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
