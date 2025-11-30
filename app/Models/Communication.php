<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsModification;

class Communication extends Model
{
    use HasFactory, LogsModification;

    protected $fillable = [
        'globe',
        'smart',
        'pldt_landline',
        'pldt_internet',
        'vhf',
        'remarks',
        'updated_by',
        'user_id',
        'typhoon_id',
    ];

    /**
     * The user who created the communication report.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The user who last updated the communication report.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * The service values for this communication report.
     */
    public function serviceValues()
    {
        return $this->hasMany(CommunicationServiceValue::class, 'communication_id');
    }

    /**
     * The typhoon this communication report belongs to.
     */
    public function typhoon()
    {
        return $this->belongsTo(Typhoon::class);
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
