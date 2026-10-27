<?php

namespace App\Models;

use App\Traits\LogsModification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AgricultureReport extends Model
{
    use HasFactory, LogsModification;

    protected $fillable = [
        'disaster_id',
        'crops_affected',
        'standing_crop_ha',
        'stage_of_crop',
        'total_area_affected_ha',
        'total_production_loss',
        'remarks',
        'user_id',
        'updated_by',
    ];

    protected $casts = [
        'standing_crop_ha' => 'decimal:2',
        'total_area_affected_ha' => 'decimal:2',
        'total_production_loss' => 'decimal:2',
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
