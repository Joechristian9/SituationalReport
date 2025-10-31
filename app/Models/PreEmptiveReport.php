<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsModification;

class PreEmptiveReport extends Model
{
    use HasFactory, LogsModification;

    /**
     * Fields to track modifications for
     */
    protected $trackedFields = [
        'barangay',
        'evacuation_center',
        'families',
        'persons',
        'outside_center',
        'outside_families',
        'outside_persons',
    ];

    protected $fillable = [
        'barangay',
        'evacuation_center',
        'families',
        'persons',
        'outside_center',
        'outside_families',
        'outside_persons',
        'total_families',
        'total_persons',
        'user_id',
        'updated_by',
    ];

    /**
     * Each pre-emptive report belongs to a user (creator).
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
     * Boot method to automatically handle user_id and updated_by.
     */
    protected static function boot()
    {
        parent::boot();

        // When creating, set user_id and updated_by
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->user_id = $model->user_id ?? Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        // When updating, always update updated_by
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}
