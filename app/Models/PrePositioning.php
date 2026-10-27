<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class PrePositioning extends Model
{
    use HasFactory, LogsModification;

    protected $fillable = [
        'team_units',
        'team_leader',
        'personnel_deployed',
        'response_assets',
        'capability',
        'area_of_deployment',
        'user_id',
        'updated_by',
        'disaster_id',
    ];

    public function typhoon()
    {
        return $this->belongsTo(Typhoon::class, 'disaster_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by')->withTrashed();
    }

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
