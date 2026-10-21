<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Casualty extends Model
{
    use HasFactory, LogsModification;

    protected $table = 'casualties';

    protected $fillable = [
        'name',
        'age',
        'sex',
        'barangay',
        'address',
        'cause_of_death',
        'date_died',
        'place_of_incident',
        'disaster_id',
        'user_id',
        'updated_by',
    ];

    public function typhoon()
    {
        return $this->belongsTo(Typhoon::class, 'disaster_id');
    }

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
