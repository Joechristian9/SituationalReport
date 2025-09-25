<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modification extends Model
{
    /** @use HasFactory<\Database\Factories\ModificationFactory> */
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'model_type',
        'model_id',
        'action',
        'changed_fields',
        'remarks'
    ];

    protected $casts = [
        'changed_fields' => 'array',
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
