<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AffectedTourist extends Model
{
    use HasFactory, LogsModification;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    // By convention, Laravel would look for 'affected_tourists'. This makes it explicit.
    protected $table = 'affected_tourists';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'province_city_municipality',
        'location',
        'local_tourists',
        'foreign_tourists',
        'remarks',
        'user_id',
        'updated_by',
    ];

    /**
     * Get the user who created the record.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who last updated the record.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * The "booted" method of the model.
     * Automatically sets user_id and updated_by.
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
