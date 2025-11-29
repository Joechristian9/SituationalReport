<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modification extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'model_type',
        'model_id',
        'action',
        'changed_fields',
    ];

    /**
     * The attributes that should be cast.
     *
     * THIS IS THE FIX.
     * It tells Laravel to handle the 'changed_fields' attribute
     * as an array, automatically converting it to JSON for the database.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'changed_fields' => 'array',
    ];

    /**
     * Get the user that made the modification.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the modified model (polymorphic relationship).
     */
    public function model()
    {
        return $this->morphTo('model', 'model_type', 'model_id');
    }
}
