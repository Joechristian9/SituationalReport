<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
     * Edit history of one report type, limited to rows of the active disaster.
     *
     * The forms only show the current disaster's rows, and the table grows with every
     * edited field of every past disaster, so loading it whole slows each form open.
     *
     * @param  class-string<Model>  $modelClass
     */
    public function scopeForActiveDisaster(Builder $query, string $modelClass): Builder
    {
        $disaster = Typhoon::getActiveTyphoon();
        if (! $disaster) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where('model_type', class_basename($modelClass))
            ->whereIn('model_id', $modelClass::query()->select('id')->where('disaster_id', $disaster->id));
    }

    /**
     * Get the modified model (polymorphic relationship).
     */
    public function model()
    {
        return $this->morphTo('model', 'model_type', 'model_id');
    }
}
