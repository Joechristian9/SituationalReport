<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AssistanceProvidedLgu extends Model
{


    protected $fillable = [
        'province',
        'city',
        'barangay',
        'families_affected',
        'families_assisted',
        'cluster_type',
        'quantity',
        'unit',
        'cost_per_unit',
        'amount',
        'source',
        'remarks',
        'user_id',
        'updated_by',
        'typhoon_id',
    ];

    /**
     * Boot hooks to automatically set user_id and updated_by
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
