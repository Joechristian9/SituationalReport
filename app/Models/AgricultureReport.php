<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgricultureReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'typhoon_id',
        'crops_affected',
        'standing_crop_ha',
        'stage_of_crop',
        'total_area_affected_ha',
        'total_production_loss',
        'remarks',
    ];

    protected $casts = [
        'standing_crop_ha' => 'decimal:2',
        'total_area_affected_ha' => 'decimal:2',
        'total_production_loss' => 'decimal:2',
    ];

    public function typhoon()
    {
        return $this->belongsTo(Typhoon::class);
    }
}
