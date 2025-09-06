<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeatherReport extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'municipality',
        'sky_condition',
        'wind',
        'precipitation',
        'sea_condition',
        'user_id',
    ];

    /**
     * Get the user that created this weather report.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
