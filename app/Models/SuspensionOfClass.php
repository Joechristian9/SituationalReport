<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class SuspensionOfClass extends Model
{
    use HasFactory, LogsModification;

    protected $table = 'suspension_of_classes';

    protected $fillable = [
        'province_city_municipality',
        'level',
        'date_of_suspension',
        'remarks',
        'user_id',
        'updated_by',
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
     * Automatically set `user_id` and `updated_by`
     * Note: LogsModification trait also handles tracking changes.
     */
    protected static function booted()
    {
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
