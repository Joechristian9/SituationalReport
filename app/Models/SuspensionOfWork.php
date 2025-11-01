<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class SuspensionOfWork extends Model
{
    use HasFactory, LogsModification;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'province_city_municipality',
        'date_of_suspension',
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
